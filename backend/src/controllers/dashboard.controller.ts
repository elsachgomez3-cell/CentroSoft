import { Response } from "express";
import { RequestConUsuario } from "../middlewares/authenticate";
import pool from "../config/database";

export const getKPIs = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    // Citas de hoy por estado
    const citasHoy = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(*) FILTER (WHERE estado = 'programada')    AS programadas,
        COUNT(*) FILTER (WHERE estado = 'en_espera')     AS en_espera,
        COUNT(*) FILTER (WHERE estado = 'atendida')      AS atendidas,
        COUNT(*) FILTER (WHERE estado = 'cancelada')     AS canceladas,
        COUNT(*) FILTER (WHERE estado = 'inasistente')   AS inasistentes
      FROM Cita
      WHERE fecha = CURRENT_DATE
    `);

    // Totales generales del sistema
    const totales = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Paciente
          JOIN Usuario u ON u.id_usuario = paciente.id_usuario
          WHERE u.estado = 'activo')                      AS pacientes_activos,
        (SELECT COUNT(*) FROM Personal
          JOIN Usuario u ON u.id_usuario = personal.id_usuario
          WHERE u.estado = 'activo')                      AS personal_activo,
        (SELECT COUNT(*) FROM MensajeContacto
          WHERE leido = FALSE)                            AS mensajes_no_leidos,
        (SELECT COUNT(*) FROM Cita
          WHERE fecha = CURRENT_DATE
            AND estado != 'cancelada')                    AS citas_hoy
    `);

    // Citas de los últimos 7 días para el gráfico
    const citasSemana = await pool.query(`
      SELECT
        TO_CHAR(fecha, 'DD/MM') AS dia,
        COUNT(*)                AS total,
        COUNT(*) FILTER (WHERE estado = 'atendida')  AS atendidas,
        COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas
      FROM Cita
      WHERE fecha >= CURRENT_DATE - INTERVAL '6 days'
        AND fecha <= CURRENT_DATE
      GROUP BY fecha
      ORDER BY fecha ASC
    `);

    // Próximas citas del día (las siguientes 5)
    const proximasCitas = await pool.query(`
      SELECT
        c.hora,
        pac.primer_nombre || ' ' || pac.apellido_pat AS paciente,
        per.primer_nombre || ' ' || per.apellido_pat AS medico,
        e.nombre AS especialidad,
        c.estado
      FROM Cita c
      JOIN Paciente     pac ON pac.id_paciente     = c.id_paciente
      JOIN Horario      h   ON h.id_horario        = c.id_horario
      JOIN Personal     per ON per.id_personal     = h.id_personal
      JOIN Especialidad e   ON e.id_especialidad   = h.id_especialidad
      WHERE c.fecha = CURRENT_DATE
        AND c.estado IN ('programada', 'en_espera')
      ORDER BY c.hora
      LIMIT 5
    `);

    // Actividad reciente — últimas 8 acciones del sistema
    const actividadReciente = await pool.query(`
      SELECT
        a.tabla_afectada,
        a.accion,
        a.nombre_usuario,
        a.id_registro,
        a.fecha,
        COALESCE(
          a.valores_nuevos::text,
          a.valores_anteriores::text,
          ''
        ) AS detalle
      FROM AuditoriaLog a
      ORDER BY a.fecha DESC
      LIMIT 8
    `);

    // Usuarios activos en las últimas 2 horas
    const usuariosActivos = await pool.query(`
      SELECT
        u.nom_usuario,
        r.nombre AS rol,
        u.ultimo_acceso
      FROM Usuario u
      JOIN Rol r ON r.id_rol = u.id_rol
      WHERE u.ultimo_acceso >= NOW() - INTERVAL '2 hours'
        AND u.estado = 'activo'
      ORDER BY u.ultimo_acceso DESC
    `);

    res.json({
      citasHoy: citasHoy.rows[0],
      totales: totales.rows[0],
      citasSemana: citasSemana.rows,
      proximasCitas: proximasCitas.rows,
      actividadReciente: actividadReciente.rows,
      usuariosActivos: usuariosActivos.rows,
    });
  } catch {
    res.status(500).json({ error: "Error al obtener los KPIs" });
  }
};
