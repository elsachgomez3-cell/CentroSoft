import { Response } from 'express'
import { RequestConUsuario } from '../middlewares/authenticate'
import pool from '../config/database'

// Obtener notificaciones del usuario autenticado
export const getMisNotificaciones = async (
  req: RequestConUsuario,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        n.id_notificacion,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.leida,
        n.fecha_envio,
        n.id_cita
      FROM Notificacion n
      WHERE n.id_usuario = $1
      ORDER BY n.fecha_envio DESC
    `, [req.usuario!.id_usuario])

    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones' })
  }
}

// Marcar una notificación como leída
export const marcarLeida = async (
  req: RequestConUsuario,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string)

    await pool.query(`
      UPDATE Notificacion
      SET leida = TRUE
      WHERE id_notificacion = $1
        AND id_usuario = $2
    `, [id, req.usuario!.id_usuario])

    res.json({ mensaje: 'Notificación marcada como leída' })
  } catch {
    res.status(500).json({ error: 'Error al actualizar notificación' })
  }
}

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidas = async (
  req: RequestConUsuario,
  res: Response
): Promise<void> => {
  try {
    await pool.query(`
      UPDATE Notificacion
      SET leida = TRUE
      WHERE id_usuario = $1
        AND leida = FALSE
    `, [req.usuario!.id_usuario])

    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
  } catch {
    res.status(500).json({ error: 'Error al actualizar notificaciones' })
  }
}