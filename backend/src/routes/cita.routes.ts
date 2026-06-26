import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authenticate";
import * as citaController from "../controllers/cita.controller";
import { procesarRecordatorios } from "../services/notificacion.service";

const router = Router();

// ─── RUTA DE PRUEBA — eliminar antes de producción ───────────
router.get("/test-recordatorios", async (_req, res) => {
  await procesarRecordatorios();
  res.json({ ok: true, mensaje: "Recordatorios procesados — revisa tu Gmail" });
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// ─── Disponibilidad (paciente, recepcionista, médico) ────────
router.get(
  "/disponibilidad",
  authorize(["paciente", "recepcionista", "medico", "auxiliar"]),
  citaController.getDisponibilidad,
);

// ─── Agendar cita ────────────────────────────────────────────
router.post(
  "/",
  authorize(["paciente", "recepcionista"]),
  citaController.crearCita,
);

// ─── Mis citas (paciente) ────────────────────────────────────
router.get("/mis-citas", authorize(["paciente"]), citaController.getMisCitas);

router.get(
  "/mis-citas-programadas",
  authorize(["paciente"]),
  citaController.getMisCitasProgramadas,
);

// ─── Agenda del médico ───────────────────────────────────────
router.get("/agenda", authorize(["medico"]), citaController.getAgendaMedico);

// ─── Especialidades propias del médico ───────────────────────
router.get("/mis-especialidades", authorize(["medico"]), citaController.getMisEspecialidades);

// ─── Horarios del médico (con filtro opcional por especialidad) ──
router.get("/horarios-medico", authorize(["medico"]), citaController.getHorariosMedico);

// ─── Citas de hoy (recepcionista, enfermera) ─────────────────
router.get(
  "/hoy",
  authorize(["recepcionista", "enfermera", "admin"]),
  citaController.getCitasHoy,
);

// ─── Reprogramar ─────────────────────────────────────────────
router.put(
  "/:id/reprogramar",
  authorize(["paciente", "recepcionista", "admin"]),
  citaController.reprogramarCita,
);

// ─── Cambiar estado ──────────────────────────────────────────
router.patch(
  "/:id/estado",
  authorize(["medico", "recepcionista", "admin", "paciente", "enfermera"]),
  citaController.cambiarEstado,
);

// Todas las citas — solo admin
router.get("/todas", authorize(["admin", "recepcionista"]), citaController.getAllCitas);
// Resumen mensual para calendario del médico
router.get('/resumen-mensual',
  authorize(['medico']),
  citaController.getResumenMensual
);
export default router;