import pool from "../config/database";
import {
  notificarCitaAgendada,
  notificarCitaCancelada,
  notificarCitaReprogramada,
} from "../services/notificacion.service";
import { registrarAuditoria } from "../services/auditoria.service";
import { EstadoCita } from "../models";

// ─── CITAS DEL DÍA (para recepcionista y enfermera) ─────────
export const findCitasHoy = async () => {
  const result = await pool.query(`
    SELECT
      c.id_cita,
      c.fecha,
      c.hora,
      c.motivo,
      c.estado,
      pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
      pac.ci            AS paciente_ci,
      pac.telefono      AS paciente_telefono,
      DATE_PART('year', AGE(pac.fecha_nac))::INT AS paciente_edad,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre          AS especialidad
    FROM Cita c
    JOIN Paciente   pac ON pac.id_paciente     = c.id_paciente
    JOIN Horario    h   ON h.id_horario        = c.id_horario
    JOIN Personal   per ON per.id_personal     = h.id_personal
    JOIN Especialidad e ON e.id_especialidad   = h.id_especialidad
    WHERE c.fecha = CURRENT_DATE
      AND c.estado != 'cancelada'
    ORDER BY c.hora
  `);
  return result.rows;
};

// ─── CITAS DE UN PACIENTE ────────────────────────────────────
export const findCitasByPaciente = async (id_paciente: number) => {
  const result = await pool.query(
    `
    SELECT
      c.id_cita,
      c.id_horario,
      c.fecha,
      c.hora,
      c.motivo,
      c.estado,
      c.motivo_cancelacion,
      c.fecha_creacion,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad
    FROM Cita c
    JOIN Horario    h   ON h.id_horario      = c.id_horario
    JOIN Personal   per ON per.id_personal   = h.id_personal
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    WHERE c.id_paciente = $1
    ORDER BY c.fecha DESC, c.hora DESC
  `,
    [id_paciente],
  );
  return result.rows;
};

// ─── CITAS PROGRAMADAS DE UN PACIENTE ───────────────────────
// Solo las que puede reprogramar o cancelar
export const findCitasProgramadasByPaciente = async (id_paciente: number) => {
  const result = await pool.query(
    `
    SELECT
      c.id_cita,
      c.id_horario,
      c.fecha,
      c.hora,
      c.motivo,
      c.estado,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad
    FROM Cita c
    JOIN Horario    h   ON h.id_horario      = c.id_horario
    JOIN Personal   per ON per.id_personal   = h.id_personal
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    WHERE c.id_paciente = $1
      AND c.estado = 'programada'
      AND c.fecha >= CURRENT_DATE
    ORDER BY c.fecha, c.hora
  `,
    [id_paciente],
  );
  return result.rows;
};

// ─── AGENDA DEL MÉDICO (para el módulo Doctor) ───────────────
export const findAgendaMedico = async (
  id_personal: number,
  fecha: string,
  id_especialidad?: number,
) => {
  const params: any[] = [id_personal, fecha];
  const filtroEsp = id_especialidad
    ? `AND h.id_especialidad = $${params.push(id_especialidad)}`
    : '';

  const result = await pool.query(
    `
    SELECT
      c.id_cita,
      c.fecha,
      c.hora,
      c.motivo,
      c.estado,
      pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
      pac.ci        AS paciente_ci,
      pac.telefono  AS paciente_telefono,
      pac.fecha_nac AS paciente_fecha_nac,
      DATE_PART('year', AGE(pac.fecha_nac))::INT AS paciente_edad,
      e.nombre AS especialidad,
      h.id_especialidad
    FROM Cita c
    JOIN Paciente   pac ON pac.id_paciente     = c.id_paciente
    JOIN Horario    h   ON h.id_horario        = c.id_horario
    JOIN Especialidad e ON e.id_especialidad   = h.id_especialidad
    WHERE h.id_personal = $1
      AND c.fecha = $2::DATE
      AND c.estado != 'cancelada'
      ${filtroEsp}
    ORDER BY c.hora
  `,
    params,
  );
  return result.rows;
};

// ─── DISPONIBILIDAD DE SLOTS ─────────────────────────────────
// Genera todos los slots posibles de un médico en una fecha
// y marca cuáles están ocupados
export const findDisponibilidad = async (id_horario: number, fecha: string) => {
  // Primero verificar que el médico trabaja ese día
  // (dia_semana: 0=Lunes ... 4=Viernes)
  const diaSemana = new Date(fecha + "T12:00:00").getDay();
  // JavaScript: 0=Domingo, 1=Lunes... Convertir a nuestro formato
  const diaConvertido = diaSemana === 0 ? 6 : diaSemana - 1;

  const diaResult = await pool.query(
    `
    SELECT hd.dia_semana
    FROM HorarioDetalle hd
    WHERE hd.id_horario = $1 AND hd.dia_semana = $2
  `,
    [id_horario, diaConvertido],
  );

  if (diaResult.rows.length === 0) {
    return []; // El médico no trabaja ese día
  }

  // Obtener el horario para generar los slots
  const horarioResult = await pool.query(
    `
    SELECT * FROM Horario WHERE id_horario = $1
  `,
    [id_horario],
  );

  const horario = horarioResult.rows[0];

  // Obtener citas ya agendadas ese día para este médico en CUALQUIER especialidad.
  // Se cruza por id_personal (no por id_horario) para evitar que el médico
  // aparezca disponible a una hora que ya tiene ocupada en otra especialidad.
  const citasResult = await pool.query(
    `
    SELECT c.hora FROM Cita c
    JOIN Horario h ON h.id_horario = c.id_horario
    WHERE h.id_personal = (SELECT id_personal FROM Horario WHERE id_horario = $1)
      AND c.fecha  = $2::DATE
      AND c.estado != 'cancelada'
  `,
    [id_horario, fecha],
  );

  const horasOcupadas = citasResult.rows.map((r: any) =>
    r.hora.substring(0, 5),
  );

  // Si la fecha solicitada es hoy, calcular la hora actual para
  // marcar como no disponibles los slots que ya transcurrieron.
  // Se usa hora local del servidor (mismo huso horario que el cliente).
  const ahora    = new Date();
  const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const esFechaHoy = fecha === fechaHoy;

  // Minutos transcurridos desde medianoche en hora local
  const minutosAhora = esFechaHoy
    ? ahora.getHours() * 60 + ahora.getMinutes()
    : -1; // -1 = no aplicar filtro de hora (fecha futura)

  const slotEsDisponible = (hora: string): boolean => {
    if (horasOcupadas.includes(hora)) return false;
    if (!esFechaHoy) return true;
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m > minutosAhora; // solo slots FUTUROS
  };

  // Generar todos los slots posibles
  const slots: { hora: string; disponible: boolean }[] = [];
  const duracion = horario.duracion_cita_min;

  // Slots del turno mañana
  if (horario.hora_inicio_manana && horario.hora_fin_manana) {
    const slotsManana = generarSlots(
      horario.hora_inicio_manana,
      horario.hora_fin_manana,
      duracion,
    );
    slotsManana.forEach((hora) => {
      slots.push({ hora, disponible: slotEsDisponible(hora) });
    });
  }

  // Slots del turno tarde
  if (horario.hora_inicio_tarde && horario.hora_fin_tarde) {
    const slotsTarde = generarSlots(
      horario.hora_inicio_tarde,
      horario.hora_fin_tarde,
      duracion,
    );
    slotsTarde.forEach((hora) => {
      slots.push({ hora, disponible: slotEsDisponible(hora) });
    });
  }

  return slots;
};

// ─── CREAR CITA ──────────────────────────────────────────────
export const createCita = async (data: {
  id_paciente: number;
  id_horario: number;
  fecha: string;
  hora: string;
  motivo?: string;
}) => {
  // ── Validación de seguridad: rechazar citas en fecha/hora ya pasada ──
  // Previene que un paciente confirme una cita en un slot que venció
  // mientras tenía el formulario abierto, o por cualquier intento directo a la API.
  const ahora    = new Date();
  const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;

  if (data.fecha < fechaHoy) {
    throw new Error("No se puede agendar una cita en una fecha pasada");
  }

  if (data.fecha === fechaHoy) {
    const [h, m] = data.hora.substring(0, 5).split(":").map(Number);
    const minutosSlot  = h * 60 + m;
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    if (minutosSlot <= minutosAhora) {
      throw new Error("No se puede agendar una cita en una hora que ya transcurrió");
    }
  }

  // ── Verificar que el médico no tenga ya una cita en esa hora ──
  // independientemente de la especialidad (un médico no puede
  // atender dos pacientes al mismo tiempo).
  const ocupado = await pool.query(
    `
    SELECT c.id_cita FROM Cita c
    JOIN Horario h ON h.id_horario = c.id_horario
    WHERE h.id_personal = (SELECT id_personal FROM Horario WHERE id_horario = $1)
      AND c.fecha  = $2::DATE
      AND c.hora   = $3::TIME
      AND c.estado != 'cancelada'
  `,
    [data.id_horario, data.fecha, data.hora],
  );

  if (ocupado.rows.length > 0) {
    throw new Error("El médico ya tiene una cita a esa hora");
  }

  const result = await pool.query(
    `
    INSERT INTO Cita (id_paciente, id_horario, fecha, hora, motivo)
    VALUES ($1, $2, $3::DATE, $4::TIME, $5)
    RETURNING *
  `,
    [
      data.id_paciente,
      data.id_horario,
      data.fecha,
      data.hora,
      data.motivo || null,
    ],
  );

  const citaCreada = result.rows[0];

  // Generar notificación automática al paciente y al médico
  await notificarCitaAgendada(citaCreada.id_cita);

  await registrarAuditoria({
    id_usuario_resp: data.id_paciente,
    nombre_usuario: "paciente",
    tabla_afectada: "Cita",
    accion: "INSERT",
    id_registro: citaCreada.id_cita,
    valores_nuevos: {
      id_horario: data.id_horario,
      fecha: data.fecha,
      hora: data.hora,
      motivo: data.motivo,
    },
  });

  return citaCreada;
};

// ─── REPROGRAMAR CITA ────────────────────────────────────────
export const reprogramarCita = async (
  id_cita: number,
  id_usuario_resp: number,
  data: {
    id_horario: number;
    fecha: string;
    hora: string;
    motivo_cambio?: string;
  },
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Obtener estado actual antes de cambiar
    const citaActual = await client.query(
      `SELECT * FROM Cita WHERE id_cita = $1`,
      [id_cita],
    );
    const cita = citaActual.rows[0];

    // Registrar en historial
    await client.query(
      `
      INSERT INTO HistorialCita
        (id_cita, id_usuario_resp,
         fecha_anterior, hora_anterior,
         fecha_nueva, hora_nueva,
         estado_anterior, estado_nuevo, motivo_cambio)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8)
    `,
      [
        id_cita,
        id_usuario_resp,
        cita.fecha,
        cita.hora,
        data.fecha,
        data.hora,
        "programada",
        data.motivo_cambio || "Reprogramación de cita",
      ],
    );

    // Actualizar la cita
    await client.query(
      `
      UPDATE Cita SET
        id_horario = $1,
        fecha      = $2::DATE,
        hora       = $3::TIME
      WHERE id_cita = $4
    `,
      [data.id_horario, data.fecha, data.hora, id_cita],
    );

    await client.query("COMMIT");

    // Generar notificación al paciente y al médico
    const fechaFormateada = new Date(
      data.fecha + "T12:00:00",
    ).toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    await notificarCitaReprogramada(id_cita, fechaFormateada, data.hora);

    return { mensaje: "Cita reprogramada correctamente" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── CAMBIAR ESTADO DE CITA ──────────────────────────────────
// Usado para: atendida, cancelada, inasistente, en_espera
export const cambiarEstadoCita = async (
  id_cita: number,
  id_usuario_resp: number,
  nuevoEstado: EstadoCita,
  motivo_cancelacion?: string,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const citaActual = await client.query(
      `SELECT estado FROM Cita WHERE id_cita = $1`,
      [id_cita],
    );
    const estadoAnterior = citaActual.rows[0]?.estado;

    // Registrar cambio en historial
    await client.query(
      `
      INSERT INTO HistorialCita
        (id_cita, id_usuario_resp, estado_anterior, estado_nuevo)
      VALUES ($1, $2, $3, $4)
    `,
      [id_cita, id_usuario_resp, estadoAnterior, nuevoEstado],
    );

    // Actualizar estado
    await client.query(
      `
      UPDATE Cita SET
        estado             = $1,
        motivo_cancelacion = COALESCE($2, motivo_cancelacion)
      WHERE id_cita = $3
    `,
      [nuevoEstado, motivo_cancelacion || null, id_cita],
    );

    await client.query("COMMIT");

    // Generar notificación si la cita fue cancelada
    if (nuevoEstado === "cancelada") {
      await notificarCitaCancelada(id_cita, motivo_cancelacion);
    }

    await registrarAuditoria({
      id_usuario_resp: id_usuario_resp,
      nombre_usuario: "sistema",
      tabla_afectada: "Cita",
      accion: "UPDATE",
      id_registro: id_cita,
      valores_anteriores: { estado: estadoAnterior },
      valores_nuevos: { estado: nuevoEstado },
    });

    return { mensaje: `Cita marcada como ${nuevoEstado}` };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── TODAS LAS CITAS (para el administrador) ─────────────────
export const findAllCitas = async (filtros: {
  desde?: string;
  hasta?: string;
  estado?: string;
}) => {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (filtros.desde) {
    condiciones.push(`c.fecha >= $${i}::DATE`);
    valores.push(filtros.desde);
    i++;
  }
  if (filtros.hasta) {
    condiciones.push(`c.fecha <= $${i}::DATE`);
    valores.push(filtros.hasta);
    i++;
  }
  if (filtros.estado) {
    condiciones.push(`c.estado = $${i}`);
    valores.push(filtros.estado);
    i++;
  }

  const where =
    condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

  const result = await pool.query(
    `
    SELECT
      c.id_cita,
      c.id_horario,
      c.id_paciente,
      c.fecha,
      c.hora,
      c.estado,
      c.motivo,
      c.motivo_cancelacion,
      pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
      pac.ci AS paciente_ci,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad
    FROM Cita c
    JOIN Paciente     pac ON pac.id_paciente     = c.id_paciente
    JOIN Horario      h   ON h.id_horario        = c.id_horario
    JOIN Personal     per ON per.id_personal     = h.id_personal
    JOIN Especialidad e   ON e.id_especialidad   = h.id_especialidad
    ${where}
    ORDER BY c.fecha DESC, c.hora DESC
  `,
    valores,
  );

  return result.rows;
};

// ─── RESUMEN MENSUAL PARA EL CALENDARIO DEL MÉDICO ──────────
export const findResumenMensual = async (
  id_personal: number,
  mes: number,
  anio: number,
  id_especialidad?: number,
) => {
  // Días que trabaja el médico (filtrado por especialidad si se indica)
  const diasParams: any[] = [id_personal];
  const diasFiltroEsp = id_especialidad
    ? `AND h.id_especialidad = $${diasParams.push(id_especialidad)}`
    : '';

  const diasResult = await pool.query(
    `
    SELECT DISTINCT hd.dia_semana
    FROM HorarioDetalle hd
    JOIN Horario h ON h.id_horario = hd.id_horario
    WHERE h.id_personal = $1
      AND h.activo = TRUE
      ${diasFiltroEsp}
  `,
    diasParams,
  );

  const diasTrabaja: number[] = diasResult.rows.map((r: any) => r.dia_semana);

  // Citas del mes agrupadas por fecha (filtrado por especialidad si se indica)
  const citasParams: any[] = [id_personal, mes, anio];
  const citasFiltroEsp = id_especialidad
    ? `AND h.id_especialidad = $${citasParams.push(id_especialidad)}`
    : '';

  const citasResult = await pool.query(
    `
    SELECT
      c.fecha::TEXT,
      COUNT(*)                                        AS total,
      COUNT(*) FILTER (WHERE c.estado = 'atendida')  AS atendidas
    FROM Cita c
    JOIN Horario h ON h.id_horario = c.id_horario
    WHERE h.id_personal = $1
      AND EXTRACT(MONTH FROM c.fecha) = $2
      AND EXTRACT(YEAR  FROM c.fecha) = $3
      AND c.estado != 'cancelada'
      ${citasFiltroEsp}
    GROUP BY c.fecha
    ORDER BY c.fecha
  `,
    citasParams,
  );

  return {
    diasTrabaja,
    citas: citasResult.rows,
  };
};
// ─── ESPECIALIDADES DEL MÉDICO AUTENTICADO ───────────────────
export const findMisEspecialidades = async (id_personal: number) => {
  const result = await pool.query(
    `
    SELECT DISTINCT
      e.id_especialidad,
      e.nombre
    FROM Horario h
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    WHERE h.id_personal = $1
      AND h.activo = TRUE
    ORDER BY e.nombre
  `,
    [id_personal],
  );
  return result.rows;
};

// ─── HORARIOS DEL MÉDICO POR ESPECIALIDAD ────────────────────
// Devuelve el/los horarios activos de un médico, opcionalmente filtrado
// por especialidad, para mostrar la sección de turnos en Mi Agenda
export const findHorariosMedico = async (
  id_personal: number,
  id_especialidad?: number,
) => {
  const params: any[] = [id_personal];
  const filtroEsp = id_especialidad
    ? `AND h.id_especialidad = $${params.push(id_especialidad)}`
    : '';

  const result = await pool.query(
    `
    SELECT
      h.id_horario,
      h.id_especialidad,
      e.nombre                AS especialidad,
      h.hora_inicio_manana,
      h.hora_fin_manana,
      h.hora_inicio_tarde,
      h.hora_fin_tarde,
      h.duracion_cita_min,
      ARRAY_AGG(hd.dia_semana ORDER BY hd.dia_semana) AS dias
    FROM Horario h
    JOIN Especialidad e ON e.id_especialidad = h.id_especialidad
    LEFT JOIN HorarioDetalle hd ON hd.id_horario = h.id_horario
    WHERE h.id_personal = $1
      AND h.activo = TRUE
      ${filtroEsp}
    GROUP BY
      h.id_horario, h.id_especialidad, e.nombre,
      h.hora_inicio_manana, h.hora_fin_manana,
      h.hora_inicio_tarde, h.hora_fin_tarde, h.duracion_cita_min
    ORDER BY e.nombre
  `,
    params,
  );
  return result.rows;
};

// ─── HELPER: GENERAR SLOTS DE TIEMPO ────────────────────────
// Divide un rango de horas en slots del tamaño indicado
// Ejemplo: 08:00 → 12:00 con 30 min = [08:00, 08:30, 09:00...]
const generarSlots = (
  horaInicio: string,
  horaFin: string,
  duracionMin: number,
): string[] => {
  const slots: string[] = [];
  const [hIni, mIni] = horaInicio.substring(0, 5).split(":").map(Number);
  const [hFin, mFin] = horaFin.substring(0, 5).split(":").map(Number);

  let totalMinInicio = hIni * 60 + mIni;
  const totalMinFin = hFin * 60 + mFin;

  while (totalMinInicio < totalMinFin) {
    const h = Math.floor(totalMinInicio / 60)
      .toString()
      .padStart(2, "0");
    const m = (totalMinInicio % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    totalMinInicio += duracionMin;
  }

  return slots;
};