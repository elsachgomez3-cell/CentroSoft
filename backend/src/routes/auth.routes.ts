import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import {
  login,
  registrarPaciente,
  getMiPerfil,
  cambiarContrasena
} from '../controllers/auth.controller'

const router = Router()

// Rutas públicas
router.post('/login',    login)
router.post('/register', registrarPaciente)

// Rutas protegidas — requieren token
router.get ('/perfil',            authenticate, getMiPerfil)
router.post('/cambiar-contrasena', authenticate, cambiarContrasena)

export default router