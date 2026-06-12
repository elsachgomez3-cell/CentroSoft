import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/authenticate';
import * as gerenteController from '../controllers/gerente.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['gerente']));

// ─── Reportes ────────────────────────────────────────────────
router.get('/reportes/citas',          gerenteController.getReporteCitas);
router.get('/reportes/doctores',       gerenteController.getReporteDoctores);
router.get('/reportes/especialidades', gerenteController.getReporteEspecialidades);
router.get('/reportes/edades',         gerenteController.getReporteEdades);

// ─── Listados ────────────────────────────────────────────────
router.get('/listados/doctores',  gerenteController.getListadoDoctores);
router.get('/listados/horarios',  gerenteController.getListadoHorarios);
router.get('/listados/citas',     gerenteController.getListadoCitas);

export default router;