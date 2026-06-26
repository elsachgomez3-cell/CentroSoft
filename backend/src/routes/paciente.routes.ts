import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authenticate";
import * as pacienteController from "../controllers/paciente.controller";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ─── Buscar paciente por CI ──────────────────────────────────
// Usado por recepcionista para encontrar pacientes rápido al
// agendar citas o consultar datos.
router.get(
  "/buscar",
  authorize(["recepcionista", "admin", "enfermera"]),
  pacienteController.buscarPorCI,
);

// ─── Registrar paciente desde recepción ──────────────────────
router.post(
  "/",
  authorize(["recepcionista", "admin"]),
  pacienteController.registrarPacienteDesdeRecepcion,
);

export default router;