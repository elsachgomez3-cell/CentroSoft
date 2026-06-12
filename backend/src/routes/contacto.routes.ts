import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/authenticate'
import {
  enviarMensaje,
  getMensajes,
  marcarMensajeLeido
} from '../controllers/contacto.controller'

const router = Router()

// Ruta pública — cualquier visitante puede enviar un mensaje
router.post('/', enviarMensaje)

// Rutas protegidas — solo el administrador puede ver los mensajes
router.get(
  '/admin',
  authenticate,
  authorize(['admin']),
  getMensajes
)

router.patch(
  '/admin/:id/leer',
  authenticate,
  authorize(['admin']),
  marcarMensajeLeido
)

export default router