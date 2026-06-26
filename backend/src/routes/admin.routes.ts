import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authenticate";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(authenticate);

// ─── Rutas de LECTURA con acceso multi-rol (antes del authorize general) ───
router.get('/horarios',       authorize(['admin', 'paciente', 'recepcionista', 'medico', 'auxiliar', 'enfermera']), adminController.getHorarios);
router.get('/personal',       authorize(['admin', 'gerente', 'recepcionista']),                       adminController.getPersonal);
router.get('/especialidades', authorize(['admin', 'paciente', 'recepcionista', 'medico', 'gerente', 'auxiliar', 'enfermera']), adminController.getEspecialidades);
router.get('/roles',          authorize(['admin']),                                                    adminController.getRoles);

// ─── Horarios — escritura (admin y recepcionista) ────────────
// Recepcionista puede crear, editar y eliminar horarios igual que admin.
router.post("/horarios",       authorize(['admin', 'recepcionista']), adminController.createHorario);
router.put("/horarios/:id",    authorize(['admin', 'recepcionista']), adminController.updateHorario);
router.delete("/horarios/:id", authorize(['admin', 'recepcionista']), adminController.deleteHorario);

// ─── A partir de aquí todo requiere ser admin ──────────────
router.use(authorize(['admin']));

// ─── Personal ──────────────────────────────────────────────
// GET ya definido arriba — solo POST, PUT, DELETE aquí
router.post("/personal",       adminController.createPersonal);
router.put("/personal/:id",    adminController.updatePersonal);
router.delete("/personal/:id", adminController.deletePersonal);

// ─── Pacientes ─────────────────────────────────────────────
router.get("/pacientes",        adminController.getPacientes);
router.put("/pacientes/:id",    adminController.updatePaciente);
router.delete("/pacientes/:id", adminController.deletePaciente);

// ─── Especialidades ────────────────────────────────────────
// GET ya definido arriba — solo POST, PUT, DELETE aquí
router.post("/especialidades",       adminController.createEspecialidad);
router.put("/especialidades/:id",    adminController.updateEspecialidad);
router.delete("/especialidades/:id", adminController.deleteEspecialidad);

export default router;