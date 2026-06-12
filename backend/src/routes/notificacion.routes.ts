import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import {
  getMisNotificaciones,
  marcarLeida,
  marcarTodasLeidas
} from '../controllers/notificacion.controller'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Obtener mis notificaciones
router.get('/', getMisNotificaciones)

// Marcar una como leída
router.patch('/:id/leer', marcarLeida)

// Marcar todas como leídas
router.patch('/leer-todas', marcarTodasLeidas)

export default router