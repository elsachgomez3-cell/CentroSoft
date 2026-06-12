import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/authenticate'
import pool from '../config/database'
import { Request, Response } from 'express'

const router = Router()

router.get('/',
  authenticate,
  authorize(['admin']),
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          id_auditoria,
          tabla_afectada,
          accion,
          nombre_usuario,
          id_registro,
          valores_anteriores,
          valores_nuevos,
          fecha
        FROM AuditoriaLog
        ORDER BY fecha DESC
        LIMIT 200
      `)
      res.json(result.rows)
    } catch {
      res.status(500).json({ error: 'Error al obtener auditoría' })
    }
  }
)

export default router