import pool from '../config/database';

// ─── REPORTE DE CITAS ────────────────────────────────────────
// Filtra por rango de fechas, médico, especialidad y estado
export const getReporteCitas = async (filtros: {
  desde?:          string;
  hasta?:          string;
  id_personal?:    number;
  id_especialidad?: number;
  estado?:         string;
}) => {
  // Construimos la query dinámicamente según los filtros recibidos
  // $1 y $2 siempre son las fechas. Los demás son opcionales.
  const condiciones: string[] = [
    `c.fecha BETWEEN $1::DATE AND $2::DATE`
  ];
  const valores: any[] = [
    filtros.desde || '2000-01-01',
    filtros.hasta || new Date().toISOString().split('T')[0]
  ];

  let paramIndex = 3;

  if (filtros.id_personal) {
    condiciones.push(`h.id_personal = $${paramIndex}`);
    valores.push(filtros.id_personal);
    paramIndex++;
  }

  if (filtros.id_especialidad) {
    condiciones.push(`h.id_especialidad = $${paramIndex}`);
    valores.push(filtros.id_especialidad);
    paramIndex++;
  }

  if (filtros.estado) {
    condiciones.push(`c.estado = $${paramIndex}`);
    valores.push(filtros.estado);
    paramIndex++;
  }

  const where = condiciones.join(' AND ');

  // Query principal con el detalle de cada cita
  const detalle = await pool.query(`
    SELECT
      c.id_cita,
      c.fecha,
      c.hora,
      c.estado,
      pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad
    FROM Cita c
    JOIN Paciente     pac ON pac.id_paciente     = c.id_paciente
    JOIN Horario      h   ON h.id_horario        = c.id_horario
    JOIN Personal     per ON per.id_personal     = h.id_personal
    JOIN Especialidad e   ON e.id_especialidad   = h.id_especialidad
    WHERE ${where}
    ORDER BY c.fecha DESC, c.hora DESC
  `, valores);

  // Totales por estado
  const totales = await pool.query(`
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE c.estado = 'atendida')    AS atendidas,
      COUNT(*) FILTER (WHERE c.estado = 'cancelada')   AS canceladas,
      COUNT(*) FILTER (WHERE c.estado = 'inasistente') AS inasistentes,
      COUNT(*) FILTER (WHERE c.estado = 'programada')  AS programadas,
      COUNT(*) FILTER (WHERE c.estado = 'en_espera')   AS en_espera
    FROM Cita c
    JOIN Horario h ON h.id_horario = c.id_horario
    WHERE ${where}
  `, valores);

  return {
    totales: totales.rows[0],
    detalle: detalle.rows
  };
};

// ─── REPORTE DE RENDIMIENTO DE DOCTORES ─────────────────────
// Fórmula del PDF: (atendidas / total) * 100
// Incluye TODOS los médicos con horario activo en el período,
// aunque no tengan citas finalizadas (aparecen con 0).
export const getReporteDoctores = async (filtros: {
  desde?:       string;
  hasta?:       string;
  id_personal?: number;
}) => {
  const valores: any[] = [
    filtros.desde || '2000-01-01',
    filtros.hasta || new Date().toISOString().split('T')[0]
  ];

  const filtroPersonal = filtros.id_personal
    ? `AND per.id_personal = $3`
    : '';

  if (filtros.id_personal) valores.push(filtros.id_personal);

  // LEFT JOIN desde Personal para incluir médicos sin citas finalizadas.
  // El filtro de estado se aplica solo a las citas no-nulas (citas existentes).
  const result = await pool.query(`
    SELECT
      per.id_personal,
      per.primer_nombre || ' ' || per.apellido_pat AS nombre,
      COUNT(c.id_cita)                                                        AS total_citas,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'atendida')                  AS atendidas,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'inasistente')               AS inasistentes,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'cancelada')                 AS canceladas,
      ROUND(
        COUNT(c.id_cita) FILTER (WHERE c.estado = 'atendida')::NUMERIC
        / NULLIF(
            COUNT(c.id_cita) FILTER (
              WHERE c.estado NOT IN ('programada','en_espera')
            ), 0
          ) * 100,
        2
      ) AS porcentaje_rendimiento,
      ROUND(
        COUNT(c.id_cita) FILTER (WHERE c.estado = 'inasistente')::NUMERIC
        / NULLIF(
            COUNT(c.id_cita) FILTER (
              WHERE c.estado NOT IN ('programada','en_espera')
            ), 0
          ) * 100,
        2
      ) AS porcentaje_inasistencia
    FROM Personal per
    JOIN Usuario u   ON u.id_usuario  = per.id_usuario
    JOIN Rol     r   ON r.id_rol      = u.id_rol
    -- LEFT JOIN: médicos sin citas en el período aparecen con 0
    LEFT JOIN Horario h ON h.id_personal = per.id_personal AND h.activo = TRUE
    LEFT JOIN Cita    c ON c.id_horario  = h.id_horario
                       AND c.fecha BETWEEN $1::DATE AND $2::DATE
                       AND c.estado NOT IN ('programada', 'en_espera')
    WHERE r.nombre = 'medico'
      AND u.estado = 'activo'
      ${filtroPersonal}
    GROUP BY per.id_personal, per.primer_nombre, per.apellido_pat
    ORDER BY porcentaje_rendimiento DESC NULLS LAST, total_citas DESC
  `, valores);

  // Fila de totales — incluye canceladas para consistencia con filas individuales
  const totalesResult = await pool.query(`
    SELECT
      COUNT(c.id_cita)                                          AS total_citas,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'atendida')    AS atendidas,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'inasistente') AS inasistentes,
      COUNT(c.id_cita) FILTER (WHERE c.estado = 'cancelada')   AS canceladas,
      ROUND(
        COUNT(c.id_cita) FILTER (WHERE c.estado = 'atendida')::NUMERIC
        / NULLIF(
            COUNT(c.id_cita) FILTER (
              WHERE c.estado NOT IN ('programada','en_espera')
            ), 0
          ) * 100,
        2
      ) AS porcentaje_rendimiento
    FROM Personal per
    JOIN Usuario u   ON u.id_usuario  = per.id_usuario
    JOIN Rol     r   ON r.id_rol      = u.id_rol
    LEFT JOIN Horario h ON h.id_personal = per.id_personal AND h.activo = TRUE
    LEFT JOIN Cita    c ON c.id_horario  = h.id_horario
                       AND c.fecha BETWEEN $1::DATE AND $2::DATE
                       AND c.estado NOT IN ('programada', 'en_espera')
    WHERE r.nombre = 'medico'
      AND u.estado = 'activo'
      ${filtroPersonal}
  `, valores);

  return {
    doctores: result.rows,
    totales:  totalesResult.rows[0]
  };
};

// ─── REPORTE DE DEMANDA POR ESPECIALIDAD ─────────────────────
// Fórmula del PDF: (cantidad / total) * 100
// Incluye TODAS las especialidades activas aunque tengan 0 citas en el período.
// Solo cuenta citas con estados finales: atendida, inasistente, cancelada.
export const getReporteEspecialidades = async (filtros: {
  desde?:           string;
  hasta?:           string;
  id_especialidad?: number;
}) => {
  const valores: any[] = [
    filtros.desde || '2000-01-01',
    filtros.hasta || new Date().toISOString().split('T')[0]
  ];

  const filtroEsp = filtros.id_especialidad
    ? `AND e.id_especialidad = $3`
    : '';

  if (filtros.id_especialidad) valores.push(filtros.id_especialidad);

  // LEFT JOIN desde Especialidad para que aparezcan todas,
  // incluso las que no tienen citas en el período.
  // Solo se cuentan estados finalizados (excluye programada y en_espera).
  const result = await pool.query(`
    SELECT
      e.id_especialidad,
      e.nombre AS especialidad,
      COUNT(c.id_cita)              AS cantidad,
      COUNT(DISTINCT h2.id_personal) AS doctores_activos,
      ROUND(
        COUNT(c.id_cita)::NUMERIC
        / NULLIF(SUM(COUNT(c.id_cita)) OVER (), 0) * 100,
        2
      ) AS porcentaje
    FROM Especialidad e
    -- Médicos activos de la especialidad (sin filtro de fecha)
    LEFT JOIN Horario h2 ON h2.id_especialidad = e.id_especialidad
                         AND h2.activo = TRUE
    -- Citas del período con estado finalizado
    LEFT JOIN Horario h  ON h.id_especialidad = e.id_especialidad
    LEFT JOIN Cita    c  ON c.id_horario = h.id_horario
                        AND c.fecha BETWEEN $1::DATE AND $2::DATE
                        AND c.estado NOT IN ('programada', 'en_espera')
    WHERE e.activa = TRUE
      ${filtroEsp}
    GROUP BY e.id_especialidad, e.nombre
    ORDER BY cantidad DESC, e.nombre
  `, valores);

  // Total general: suma de citas finalizadas en el período
  const totalResult = await pool.query(`
    SELECT COUNT(c.id_cita) AS total
    FROM Especialidad e
    LEFT JOIN Horario h ON h.id_especialidad = e.id_especialidad
    LEFT JOIN Cita    c ON c.id_horario = h.id_horario
                       AND c.fecha BETWEEN $1::DATE AND $2::DATE
                       AND c.estado NOT IN ('programada', 'en_espera')
    WHERE e.activa = TRUE
      ${filtroEsp}
  `, valores);

  return {
    especialidades: result.rows,
    total:          parseInt(totalResult.rows[0].total)
  };
};

// ─── REPORTE DE RANGOS DE EDAD ───────────────────────────────
// Fórmula del PDF: (cantidad / total) * 100
// Usa fecha_nac para calcular la edad real — nunca el campo edad
export const getReporteEdades = async (filtros: {
  desde?: string;
  hasta?: string;
}) => {
  const valores = [
    filtros.desde || '2000-01-01',
    filtros.hasta || new Date().toISOString().split('T')[0]
  ];

  // Pacientes únicos que tuvieron citas en el período
  const result = await pool.query(`
    WITH pacientes_periodo AS (
      SELECT DISTINCT
        c.id_paciente,
        DATE_PART('year', AGE(pac.fecha_nac))::INT AS edad
      FROM Cita c
      JOIN Paciente pac ON pac.id_paciente = c.id_paciente
      WHERE c.fecha BETWEEN $1::DATE AND $2::DATE
        AND pac.fecha_nac IS NOT NULL
    ),
    rangos AS (
      SELECT
        CASE
          WHEN edad BETWEEN  0 AND 12 THEN '0 - 12 años'
          WHEN edad BETWEEN 13 AND 30 THEN '13 - 30 años'
          WHEN edad BETWEEN 31 AND 50 THEN '31 - 50 años'
          ELSE '51 a más'
        END AS rango,
        CASE
          WHEN edad BETWEEN  0 AND 12 THEN 'Niños'
          WHEN edad BETWEEN 13 AND 30 THEN 'Jóvenes'
          WHEN edad BETWEEN 31 AND 50 THEN 'Adultos medios'
          ELSE 'Adultos mayores'
        END AS categoria,
        CASE
          WHEN edad BETWEEN  0 AND 12 THEN 1
          WHEN edad BETWEEN 13 AND 30 THEN 2
          WHEN edad BETWEEN 31 AND 50 THEN 3
          ELSE 4
        END AS orden,
        COUNT(*) AS cantidad
      FROM pacientes_periodo
      GROUP BY rango, categoria, orden
    )
    SELECT
      rango,
      categoria,
      cantidad,
      ROUND(
        cantidad::NUMERIC / NULLIF(SUM(cantidad) OVER (), 0) * 100,
        2
      ) AS porcentaje
    FROM rangos
    ORDER BY orden
  `, valores);

  const totalResult = await pool.query(`
    SELECT COUNT(DISTINCT c.id_paciente) AS total
    FROM Cita c
    JOIN Paciente pac ON pac.id_paciente = c.id_paciente
    WHERE c.fecha BETWEEN $1::DATE AND $2::DATE
      AND pac.fecha_nac IS NOT NULL
  `, valores);

  return {
    rangos: result.rows,
    total:  parseInt(totalResult.rows[0].total)
  };
};

// ─── LISTADO DE DOCTORES ─────────────────────────────────────
export const getListadoDoctores = async (filtros: {
  id_especialidad?: number;
  estado?:          string;
}) => {
  const condiciones = [`r.nombre = 'medico'`];
  const valores: any[] = [];
  let paramIndex = 1;

  if (filtros.estado) {
    condiciones.push(`u.estado = $${paramIndex}`);
    valores.push(filtros.estado);
    paramIndex++;
  }

  const where = condiciones.join(' AND ');

  const result = await pool.query(`
    SELECT
      per.id_personal,
      per.primer_nombre || ' ' || per.apellido_pat AS nombre,
      per.email,
      per.telefono,
      u.estado,
      STRING_AGG(DISTINCT e.nombre, ', ' ORDER BY e.nombre) AS especialidades
    FROM Personal per
    JOIN Usuario      u   ON u.id_usuario       = per.id_usuario
    JOIN Rol          r   ON r.id_rol            = u.id_rol
    LEFT JOIN PersonalEspecialidad pe ON pe.id_personal     = per.id_personal
    LEFT JOIN Especialidad         e  ON e.id_especialidad  = pe.id_especialidad
    WHERE ${where}
    GROUP BY per.id_personal, per.primer_nombre, per.apellido_pat,
             per.email, per.telefono, u.estado
    ORDER BY per.primer_nombre
  `, valores);

  return result.rows;
};

// ─── LISTADO DE HORARIOS ─────────────────────────────────────
export const getListadoHorarios = async (filtros: {
  id_personal?: number;
  dia_semana?:  number;
}) => {
  const condiciones = [`h.activo = TRUE`];
  const valores: any[] = [];
  let paramIndex = 1;

  if (filtros.id_personal) {
    condiciones.push(`h.id_personal = $${paramIndex}`);
    valores.push(filtros.id_personal);
    paramIndex++;
  }

  if (filtros.dia_semana !== undefined) {
    condiciones.push(`hd.dia_semana = $${paramIndex}`);
    valores.push(filtros.dia_semana);
    paramIndex++;
  }

  const where = condiciones.join(' AND ');

  const result = await pool.query(`
    SELECT
      h.id_horario,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad,
      h.hora_inicio_manana,
      h.hora_fin_manana,
      h.hora_inicio_tarde,
      h.hora_fin_tarde,
      h.duracion_cita_min,
      STRING_AGG(
        CASE hd.dia_semana
          WHEN 0 THEN 'Lun' WHEN 1 THEN 'Mar' WHEN 2 THEN 'Mie'
          WHEN 3 THEN 'Jue' WHEN 4 THEN 'Vie' WHEN 5 THEN 'Sab'
          ELSE 'Dom'
        END,
        ' - ' ORDER BY hd.dia_semana
      ) AS dias
    FROM Horario h
    JOIN Personal     per ON per.id_personal     = h.id_personal
    JOIN Especialidad e   ON e.id_especialidad   = h.id_especialidad
    JOIN HorarioDetalle hd ON hd.id_horario      = h.id_horario
    WHERE ${where}
    GROUP BY h.id_horario, per.primer_nombre, per.apellido_pat,
             e.nombre, h.hora_inicio_manana, h.hora_fin_manana,
             h.hora_inicio_tarde, h.hora_fin_tarde, h.duracion_cita_min
    ORDER BY per.primer_nombre
  `, valores);

  return result.rows;
};

// ─── LISTADO DE CITAS ────────────────────────────────────────
export const getListadoCitas = async (filtros: {
  desde?:  string;
  hasta?:  string;
  estado?: string;
}) => {
  const condiciones: string[] = [
    `c.fecha BETWEEN $1::DATE AND $2::DATE`
  ];
  const valores: any[] = [
    filtros.desde || '2000-01-01',
    filtros.hasta || new Date().toISOString().split('T')[0]
  ];

  if (filtros.estado) {
    condiciones.push(`c.estado = $3`);
    valores.push(filtros.estado);
  }

  const result = await pool.query(`
    SELECT
      c.id_cita,
      c.fecha,
      c.hora,
      c.estado,
      pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
      per.primer_nombre || ' ' || per.apellido_pat AS medico,
      e.nombre AS especialidad
    FROM Cita c
    JOIN Paciente     pac ON pac.id_paciente     = c.id_paciente
    JOIN Horario      h   ON h.id_horario        = c.id_horario
    JOIN Personal     per ON per.id_personal     = h.id_personal
    JOIN Especialidad e   ON e.id_especialidad   = h.id_especialidad
    WHERE ${condiciones.join(' AND ')}
    ORDER BY c.fecha DESC, c.hora DESC
  `, valores);

  return result.rows;
};