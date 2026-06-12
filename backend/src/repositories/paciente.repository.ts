import pool from "../config/database";

// ─── LISTAR TODOS LOS PACIENTES ──────────────────────────────
export const findAllPacientes = async () => {
  const result = await pool.query(`
    SELECT
      p.id_paciente,
      p.primer_nombre || ' ' || p.apellido_pat ||
        COALESCE(' ' || p.apellido_mat, '') AS nombre,
      p.primer_nombre,
      p.apellido_pat,
      p.apellido_mat,
      p.ci,
      p.email,
      p.telefono,
      p.direccion,
      p.fecha_nac,
      DATE_PART('year', AGE(p.fecha_nac))::INT AS edad,
      p.foto_url,
      p.fecha_registro,
      u.nom_usuario,
      u.estado
    FROM Paciente p
    JOIN Usuario u ON u.id_usuario = p.id_usuario
    ORDER BY p.primer_nombre
  `);
  return result.rows;
};

// ─── BUSCAR PACIENTE POR ID ──────────────────────────────────
export const findPacienteById = async (id_paciente: number) => {
  const result = await pool.query(
    `
    SELECT
      p.*,
      DATE_PART('year', AGE(p.fecha_nac))::INT AS edad,
      u.nom_usuario,
      u.estado
    FROM Paciente p
    JOIN Usuario u ON u.id_usuario = p.id_usuario
    WHERE p.id_paciente = $1
  `,
    [id_paciente],
  );
  return result.rows[0] || null;
};

// ─── BUSCAR PACIENTE POR CI ──────────────────────────────────
// Usado por la recepcionista para encontrar pacientes rápido
export const findPacienteByCI = async (ci: string) => {
  const result = await pool.query(
    `
    SELECT
      p.*,
      DATE_PART('year', AGE(p.fecha_nac))::INT AS edad,
      u.nom_usuario,
      u.estado
    FROM Paciente p
    JOIN Usuario u ON u.id_usuario = p.id_usuario
    WHERE p.ci = $1
  `,
    [ci],
  );
  return result.rows[0] || null;
};

// ─── ACTUALIZAR PACIENTE ─────────────────────────────────────
export const updatePaciente = async (
  id_paciente: number,
  data: {
    primer_nombre?: string;
    apellido_pat?: string;
    apellido_mat?: string;
    ci?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    fecha_nac?: string;
    estado?: string;
    nom_usuario?: string;
    contrasena?: string;
  },
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE Paciente SET
        primer_nombre = COALESCE($1, primer_nombre),
        apellido_pat  = COALESCE($2, apellido_pat),
        apellido_mat  = COALESCE($3, apellido_mat),
        ci            = COALESCE($4, ci),
        email         = COALESCE($5, email),
        telefono      = COALESCE($6, telefono),
        direccion     = COALESCE($7, direccion),
        fecha_nac     = COALESCE($8::DATE, fecha_nac)
      WHERE id_paciente = $9
    `,
      [
        data.primer_nombre || null,
        data.apellido_pat || null,
        data.apellido_mat || null,
        data.ci || null,
        data.email || null,
        data.telefono || null,
        data.direccion || null,
        data.fecha_nac || null,
        id_paciente,
      ],
    );

    if (data.estado || data.nom_usuario || data.contrasena) {
      let contrasena_hash = null;
      if (data.contrasena) {
        const bcrypt = require("bcryptjs");
        contrasena_hash = await bcrypt.hash(data.contrasena, 10);
      }

      await client.query(
        `
        UPDATE Usuario u SET
          estado          = COALESCE($1::estado_usuario, estado),
          nom_usuario     = COALESCE($2, nom_usuario),
          contrasena_hash = COALESCE($3, contrasena_hash)
        FROM Paciente p
        WHERE p.id_usuario = u.id_usuario
          AND p.id_paciente = $4
      `,
        [
          data.estado || null,
          data.nom_usuario || null,
          contrasena_hash,
          id_paciente,
        ],
      );
    }

    await client.query("COMMIT");
    return await findPacienteById(id_paciente);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── ELIMINAR PACIENTE ───────────────────────────────────────
// Desactiva en lugar de borrar para preservar historial
export const deletePaciente = async (id_paciente: number) => {
  await pool.query(
    `
    UPDATE Usuario u SET estado = 'inactivo'
    FROM Paciente p
    WHERE p.id_usuario = u.id_usuario
      AND p.id_paciente = $1
  `,
    [id_paciente],
  );
};
