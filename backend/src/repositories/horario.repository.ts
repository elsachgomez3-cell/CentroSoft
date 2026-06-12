import pool from "../config/database";
import { notificarAdmins } from "../services/notificacion.service";

// ─── LISTAR HORARIOS ─────────────────────────────────────────
// Con días de atención ya agrupados
export const findAllHorarios = async () => {
  const result = await pool.query(`
    SELECT
      h.id_horario,
      h.id_personal,
      p.primer_nombre || ' ' || p.apellido_pat AS medico,
      h.id_especialidad,
      e.nombre AS especialidad,
      h.hora_inicio_manana,
      h.hora_fin_manana,
      h.hora_inicio_tarde,
      h.hora_fin_tarde,
      h.duracion_cita_min,
      h.activo,
      ARRAY_AGG(hd.dia_semana ORDER BY hd.dia_semana) AS dias
    FROM Horario h
    JOIN Personal p ON p.id_personal = h.id_personal
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    LEFT JOIN HorarioDetalle hd ON hd.id_horario = h.id_horario
    GROUP BY
      h.id_horario, h.id_personal, p.primer_nombre, p.apellido_pat,
      h.id_especialidad, e.nombre, h.hora_inicio_manana,
      h.hora_fin_manana, h.hora_inicio_tarde, h.hora_fin_tarde,
      h.duracion_cita_min, h.activo
    ORDER BY p.primer_nombre
  `);
  return result.rows;
};

// ─── BUSCAR HORARIO POR ID ───────────────────────────────────
export const findHorarioById = async (id_horario: number) => {
  const result = await pool.query(
    `
    SELECT
      h.*,
      p.primer_nombre || ' ' || p.apellido_pat AS medico,
      e.nombre AS especialidad,
      ARRAY_AGG(hd.dia_semana ORDER BY hd.dia_semana) AS dias
    FROM Horario h
    JOIN Personal p ON p.id_personal = h.id_personal
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    LEFT JOIN HorarioDetalle hd ON hd.id_horario = h.id_horario
    WHERE h.id_horario = $1
    GROUP BY h.id_horario, p.primer_nombre, p.apellido_pat, e.nombre
  `,
    [id_horario],
  );
  return result.rows[0] || null;
};

// ─── CREAR HORARIO ───────────────────────────────────────────
// Crea el horario y sus días en una transacción
export const createHorario = async (data: {
  id_personal: number;
  id_especialidad: number;
  hora_inicio_manana?: string;
  hora_fin_manana?: string;
  hora_inicio_tarde?: string;
  hora_fin_tarde?: string;
  duracion_cita_min: number;
  dias: number[]; // [0,1,3] = Lunes, Martes, Jueves
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const horarioResult = await client.query(
      `
      INSERT INTO Horario
        (id_personal, id_especialidad,
         hora_inicio_manana, hora_fin_manana,
         hora_inicio_tarde, hora_fin_tarde,
         duracion_cita_min)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
      [
        data.id_personal,
        data.id_especialidad,
        data.hora_inicio_manana || null,
        data.hora_fin_manana || null,
        data.hora_inicio_tarde || null,
        data.hora_fin_tarde || null,
        data.duracion_cita_min,
      ],
    );

    const id_horario = horarioResult.rows[0].id_horario;

    // Insertar cada día como una fila separada en HorarioDetalle
    for (const dia of data.dias) {
      await client.query(
        `
        INSERT INTO HorarioDetalle (id_horario, dia_semana)
        VALUES ($1, $2)
      `,
        [id_horario, dia],
      );
    }
    await client.query("COMMIT");

    const horarioCreado = await findHorarioById(id_horario);

    await notificarAdmins({
      titulo: "Nuevo horario médico registrado",
      mensaje: `Se registró un nuevo horario para ${horarioCreado?.medico || "un médico"} en ${horarioCreado?.especialidad || "una especialidad"}.`,
      tipo: "sistema",
    });

    return horarioCreado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── ACTUALIZAR HORARIO ──────────────────────────────────────
export const updateHorario = async (
  id_horario: number,
  data: {
    hora_inicio_manana?: string;
    hora_fin_manana?: string;
    hora_inicio_tarde?: string;
    hora_fin_tarde?: string;
    duracion_cita_min?: number;
    activo?: boolean;
    dias?: number[];
  },
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // UPDATE dinámico para manejar correctamente tres casos:
    // - Campo con valor ("14:00")  → escribe el valor en BD
    // - Campo vacío ("")           → escribe NULL (permite eliminar un turno)
    // - Campo undefined            → no toca la columna
    // El COALESCE anterior no servía: '' || null = null, y COALESCE(null, null) = null,
    // por lo que agregar turno tarde a un horario que antes tenía NULL nunca funcionaba.
    const setClauses: string[] = [];
    const values:     any[]    = [];
    let   idx = 1;

    const addHora = (col: string, val: string | undefined) => {
      if (val === undefined) return;           // no vino — no tocar
      setClauses.push(`${col} = $${idx++}`);
      values.push(val === '' ? null : val);    // vacío → NULL, valor → escribir
    };

    addHora('hora_inicio_manana', data.hora_inicio_manana);
    addHora('hora_fin_manana',    data.hora_fin_manana);
    addHora('hora_inicio_tarde',  data.hora_inicio_tarde);
    addHora('hora_fin_tarde',     data.hora_fin_tarde);

    if (data.duracion_cita_min !== undefined) {
      setClauses.push(`duracion_cita_min = $${idx++}`);
      values.push(data.duracion_cita_min);
    }
    if (data.activo !== undefined) {
      setClauses.push(`activo = $${idx++}`);
      values.push(data.activo);
    }

    if (setClauses.length > 0) {
      values.push(id_horario);
      await client.query(
        `UPDATE Horario SET ${setClauses.join(', ')} WHERE id_horario = $${idx}`,
        values,
      );
    }

    // Si se enviaron días nuevos, reemplazar todos
    if (data.dias && data.dias.length > 0) {
      await client.query(`DELETE FROM HorarioDetalle WHERE id_horario = $1`, [
        id_horario,
      ]);
      for (const dia of data.dias) {
        await client.query(
          `
          INSERT INTO HorarioDetalle (id_horario, dia_semana)
          VALUES ($1, $2)
        `,
          [id_horario, dia],
        );
      }
    }

    await client.query("COMMIT");
    return await findHorarioById(id_horario);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── ELIMINAR HORARIO ────────────────────────────────────────
export const deleteHorario = async (id_horario: number) => {
  await pool.query(`UPDATE Horario SET activo = FALSE WHERE id_horario = $1`, [
    id_horario,
  ]);
};