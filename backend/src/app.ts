import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { testConnection } from './config/database';
import { errorHandler } from './middlewares/errorHandler';
import { procesarRecordatorios } from './services/notificacion.service';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import citaRoutes  from './routes/cita.routes'; 
import notificacionRoutes from './routes/notificacion.routes'
import contactoRoutes from './routes/contacto.routes'
import dashboardRoutes from './routes/dashboard.routes'
import auditoriaRoutes from './routes/auditoria.routes'
import gerenteRoutes from './routes/gerente.routes';
import pacienteRoutes from './routes/paciente.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Rutas ──────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);  // ← agregar esta línea
app.use('/citas', citaRoutes);   // ← agregar después de adminRoutes
app.use('/notificaciones', notificacionRoutes)
app.use('/contacto', contactoRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/auditoria', auditoriaRoutes)
app.use('/gerente', gerenteRoutes);
app.use('/pacientes', pacienteRoutes);
// ─── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor CentroSoft funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ─── Manejo global de errores ────────────────────────────────
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
  });

  // ─── Scheduler de recordatorios ─────────────────────────
  // Corre cada hora en punto (0 * * * *).
  // - Busca citas de mañana → recordatorio "1 día antes"
  // - Busca citas de hoy en ventana +25..+35 min → recordatorio "30 min antes"
  // Los duplicados están protegidos: la query verifica que no exista
  // ya una notificación de tipo 'recordatorio' para esa cita.
  cron.schedule('0 * * * *', async () => {
    console.log(`[Cron] Procesando recordatorios — ${new Date().toLocaleString('es-BO')}`);
    await procesarRecordatorios();
  }, {
    timezone: 'America/La_Paz'   // UTC-4, hora de Bolivia
  });

  console.log('⏰ Scheduler de recordatorios iniciado (cada hora en punto)');
};

startServer();

export default app;