import pool from '../config/database'
import { enviarCorreoRecordatorio } from './email.service'

// ─── TIPOS DE NOTIFICACIÓN ───────────────────────────────────
// Deben coincidir exactamente con el ENUM de PostgreSQL
type TipoNotificacion =
  | 'cita_agendada'
  | 'cita_cancelada'
  | 'cita_reprogramada'
  | 'recordatorio'
  | 'sistema'

// ─── FUNCIÓN BASE ────────────────────────────────────────────
// Crea una notificación para un usuario específico.
// Se usa internamente por las demás funciones.
const crearNotificacion = async (data: {
  id_usuario: number
  id_cita?:   number
  titulo:     string
  mensaje:    string
  tipo:       TipoNotificacion
}): Promise<void> => {
  try {
    await pool.query(`
      INSERT INTO Notificacion
        (id_usuario, id_cita, titulo, mensaje, tipo)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      data.id_usuario,
      data.id_cita || null,
      data.titulo,
      data.mensaje,
      data.tipo
    ])
  } catch (error) {
    // Si falla la notificación, NO interrumpimos el flujo principal.
    // La cita igual se guarda aunque la notificación falle.
    console.error('Error al crear notificación:', error)
  }
}

// ─── OBTENER IDs DE USUARIO ──────────────────────────────────
// Dado el id_cita, obtiene los id_usuario del paciente y del médico.
// Los necesitamos para saber a quién enviar la notificación.
const getUsuariosDeCita = async (id_cita: number): Promise<{
  id_usuario_paciente: number
  id_usuario_medico:   number
  nombre_paciente:     string
  nombre_medico:       string
  fecha:               string
  hora:                string
}> => {
  const result = await pool.query(`
    SELECT
      uPac.id_usuario                                         AS id_usuario_paciente,
      uMed.id_usuario                                         AS id_usuario_medico,
      pac.primer_nombre || ' ' || pac.apellido_pat            AS nombre_paciente,
      per.primer_nombre || ' ' || per.apellido_pat            AS nombre_medico,
      TO_CHAR(c.fecha, 'DD/MM/YYYY')                          AS fecha,
      TO_CHAR(c.hora,  'HH24:MI')                             AS hora
    FROM Cita c
    JOIN Paciente pac ON pac.id_paciente     = c.id_paciente
    JOIN Usuario  uPac ON uPac.id_usuario    = pac.id_usuario
    JOIN Horario  h    ON h.id_horario       = c.id_horario
    JOIN Personal per  ON per.id_personal    = h.id_personal
    JOIN Usuario  uMed ON uMed.id_usuario    = per.id_usuario
    WHERE c.id_cita = $1
  `, [id_cita])

  return result.rows[0]
}

// ─── NOTIFICACIÓN: CITA AGENDADA ─────────────────────────────
export const notificarCitaAgendada = async (
  id_cita: number
): Promise<void> => {
  try {
    const datos = await getUsuariosDeCita(id_cita)

    // Notificación al paciente
    await crearNotificacion({
      id_usuario: datos.id_usuario_paciente,
      id_cita,
      titulo:  'Cita médica agendada',
      mensaje: `Tu cita con el Dr. ${datos.nombre_medico} fue agendada para el ${datos.fecha} a las ${datos.hora}.`,
      tipo:    'cita_agendada'
    })

    // Notificación al médico
    await crearNotificacion({
      id_usuario: datos.id_usuario_medico,
      id_cita,
      titulo:  'Nueva cita programada',
      mensaje: `El paciente ${datos.nombre_paciente} agendó una cita para el ${datos.fecha} a las ${datos.hora}.`,
      tipo:    'cita_agendada'
    })
  } catch (error) {
    console.error('Error en notificarCitaAgendada:', error)
  }
}

// ─── NOTIFICACIÓN: CITA CANCELADA ────────────────────────────
export const notificarCitaCancelada = async (
  id_cita: number,
  motivo?: string
): Promise<void> => {
  try {
    const datos = await getUsuariosDeCita(id_cita)

    // Notificación al paciente
    await crearNotificacion({
      id_usuario: datos.id_usuario_paciente,
      id_cita,
      titulo:  'Cita cancelada',
      mensaje: `Tu cita con el Dr. ${datos.nombre_medico} del ${datos.fecha} a las ${datos.hora} fue cancelada.${motivo ? ` Motivo: ${motivo}` : ''}`,
      tipo:    'cita_cancelada'
    })

    // Notificación al médico
    await crearNotificacion({
      id_usuario: datos.id_usuario_medico,
      id_cita,
      titulo:  'Cita cancelada',
      mensaje: `La cita del paciente ${datos.nombre_paciente} del ${datos.fecha} a las ${datos.hora} fue cancelada.`,
      tipo:    'cita_cancelada'
    })
  } catch (error) {
    console.error('Error en notificarCitaCancelada:', error)
  }
}

// ─── NOTIFICACIÓN: CITA REPROGRAMADA ─────────────────────────
export const notificarCitaReprogramada = async (
  id_cita:    number,
  fechaNueva: string,
  horaNueva:  string
): Promise<void> => {
  try {
    const datos = await getUsuariosDeCita(id_cita)

    // Notificación al paciente
    await crearNotificacion({
      id_usuario: datos.id_usuario_paciente,
      id_cita,
      titulo:  'Cita reprogramada',
      mensaje: `Tu cita con el Dr. ${datos.nombre_medico} fue reprogramada para el ${fechaNueva} a las ${horaNueva}.`,
      tipo:    'cita_reprogramada'
    })

    // Notificación al médico
    await crearNotificacion({
      id_usuario: datos.id_usuario_medico,
      id_cita,
      titulo:  'Cita reprogramada',
      mensaje: `La cita del paciente ${datos.nombre_paciente} fue reprogramada para el ${fechaNueva} a las ${horaNueva}.`,
      tipo:    'cita_reprogramada'
    })
  } catch (error) {
    console.error('Error en notificarCitaReprogramada:', error)
  }
}

// ─── NOTIFICACIÓN: ADMINS ────────────────────────────────────
// Envía una notificación de sistema a todos los usuarios con rol admin.
export const notificarAdmins = async (data: {
  titulo:  string
  mensaje: string
  tipo:    TipoNotificacion
}): Promise<void> => {
  try {
    const admins = await pool.query(`
      SELECT u.id_usuario
      FROM Usuario u
      JOIN Rol r ON r.id_rol = u.id_rol
      WHERE r.nombre = 'admin'
        AND u.estado = 'activo'
    `)
    for (const admin of admins.rows) {
      await crearNotificacion({
        id_usuario: admin.id_usuario,
        titulo:     data.titulo,
        mensaje:    data.mensaje,
        tipo:       data.tipo,
      })
    }
  } catch (error) {
    console.error('Error en notificarAdmins:', error)
  }
}

// ─── RECORDATORIOS AUTOMÁTICOS ───────────────────────────────
// Llamada por el cron job. Busca citas que necesiten recordatorio
// y aún no lo hayan recibido, luego crea notificación interna y
// opcionalmente envía correo si el paciente tiene email registrado.

export const procesarRecordatorios = async (): Promise<void> => {
  try {
    const ahora    = new Date()
    const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`

    // Fecha de mañana para el recordatorio de 1 día antes
    const mañana   = new Date(ahora)
    mañana.setDate(mañana.getDate() + 1)
    const fechaMañana = `${mañana.getFullYear()}-${String(mañana.getMonth() + 1).padStart(2, '0')}-${String(mañana.getDate()).padStart(2, '0')}`

    // Minutos actuales desde medianoche (para el recordatorio de 30 min)
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
    const desde30      = minutosAhora + 25   // ventana: de +25 a +35 min
    const hasta30      = minutosAhora + 35   // centrada en los 30 minutos

    // ── 1. Recordatorio 1 DÍA ANTES ──────────────────────────
    // Citas programadas para mañana que no tienen recordatorio de 1 día enviado
    const citasMañana = await pool.query(`
      SELECT
        c.id_cita,
        pac.primer_nombre || ' ' || pac.apellido_pat AS nombre_paciente,
        pac.email                                     AS email_paciente,
        uPac.id_usuario                               AS id_usuario_paciente,
        per.primer_nombre || ' ' || per.apellido_pat  AS nombre_medico,
        TO_CHAR(c.fecha, 'DD/MM/YYYY')                AS fecha,
        TO_CHAR(c.hora,  'HH24:MI')                   AS hora
      FROM Cita c
      JOIN Paciente pac ON pac.id_paciente   = c.id_paciente
      JOIN Usuario  uPac ON uPac.id_usuario  = pac.id_usuario
      JOIN Horario  h    ON h.id_horario     = c.id_horario
      JOIN Personal per  ON per.id_personal  = h.id_personal
      WHERE c.fecha   = $1::DATE
        AND c.estado  = 'programada'
        AND NOT EXISTS (
          SELECT 1 FROM Notificacion n
          WHERE n.id_cita    = c.id_cita
            AND n.id_usuario = uPac.id_usuario
            AND n.tipo       = 'recordatorio'
            AND n.titulo     LIKE '%mañana%'
        )
    `, [fechaMañana])

    for (const cita of citasMañana.rows) {
      // Notificación interna
      await crearNotificacion({
        id_usuario: cita.id_usuario_paciente,
        id_cita:    cita.id_cita,
        titulo:     'Recordatorio: tu cita es mañana',
        mensaje:    `Recuerda que tienes una cita con el Dr. ${cita.nombre_medico} mañana ${cita.fecha} a las ${cita.hora}.`,
        tipo:       'recordatorio',
      })

      // Correo (si el paciente tiene email registrado)
      if (cita.email_paciente) {
        try {
          await enviarCorreoRecordatorio({
            to:              cita.email_paciente,
            nombre_paciente: cita.nombre_paciente,
            nombre_medico:   cita.nombre_medico,
            fecha:           cita.fecha,
            hora:            cita.hora,
            tipo:            '1dia',
          })
        } catch (emailErr) {
          console.error(`[Recordatorio] Error enviando email a ${cita.email_paciente}:`, emailErr)
        }
      }
    }

    if (citasMañana.rows.length > 0) {
      console.log(`[Recordatorio 1 día] ${citasMañana.rows.length} recordatorio(s) enviado(s) para ${fechaMañana}`)
    }

    // ── 2. Recordatorio 30 MINUTOS ANTES ─────────────────────
    // Citas de hoy cuya hora cae en la ventana [ahora+25min, ahora+35min]
    // y que no tienen recordatorio de 30 min enviado todavía
    const citasProximas = await pool.query(`
      SELECT
        c.id_cita,
        pac.primer_nombre || ' ' || pac.apellido_pat AS nombre_paciente,
        pac.email                                     AS email_paciente,
        uPac.id_usuario                               AS id_usuario_paciente,
        per.primer_nombre || ' ' || per.apellido_pat  AS nombre_medico,
        TO_CHAR(c.fecha, 'DD/MM/YYYY')                AS fecha,
        TO_CHAR(c.hora,  'HH24:MI')                   AS hora,
        EXTRACT(HOUR   FROM c.hora)::INT * 60
          + EXTRACT(MINUTE FROM c.hora)::INT            AS minutos_cita
      FROM Cita c
      JOIN Paciente pac ON pac.id_paciente   = c.id_paciente
      JOIN Usuario  uPac ON uPac.id_usuario  = pac.id_usuario
      JOIN Horario  h    ON h.id_horario     = c.id_horario
      JOIN Personal per  ON per.id_personal  = h.id_personal
      WHERE c.fecha  = $1::DATE
        AND c.estado = 'programada'
        AND (EXTRACT(HOUR FROM c.hora)::INT * 60 + EXTRACT(MINUTE FROM c.hora)::INT)
              BETWEEN $2 AND $3
        AND NOT EXISTS (
          SELECT 1 FROM Notificacion n
          WHERE n.id_cita    = c.id_cita
            AND n.id_usuario = uPac.id_usuario
            AND n.tipo       = 'recordatorio'
            AND n.titulo     LIKE '%30 minutos%'
        )
    `, [fechaHoy, desde30, hasta30])

    for (const cita of citasProximas.rows) {
      // Notificación interna
      await crearNotificacion({
        id_usuario: cita.id_usuario_paciente,
        id_cita:    cita.id_cita,
        titulo:     'Recordatorio: tu cita es en 30 minutos',
        mensaje:    `Tu cita con el Dr. ${cita.nombre_medico} comienza a las ${cita.hora}. ¡No olvides presentarte!`,
        tipo:       'recordatorio',
      })

      // Correo (si el paciente tiene email registrado)
      if (cita.email_paciente) {
        try {
          await enviarCorreoRecordatorio({
            to:              cita.email_paciente,
            nombre_paciente: cita.nombre_paciente,
            nombre_medico:   cita.nombre_medico,
            fecha:           cita.fecha,
            hora:            cita.hora,
            tipo:            '30min',
          })
        } catch (emailErr) {
          console.error(`[Recordatorio] Error enviando email a ${cita.email_paciente}:`, emailErr)
        }
      }
    }

    if (citasProximas.rows.length > 0) {
      console.log(`[Recordatorio 30 min] ${citasProximas.rows.length} recordatorio(s) enviado(s)`)
    }

  } catch (error) {
    console.error('[procesarRecordatorios] Error general:', error)
  }
}