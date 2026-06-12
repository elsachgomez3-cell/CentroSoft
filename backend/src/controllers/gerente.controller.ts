import { Response } from 'express';
import { RequestConUsuario } from '../middlewares/authenticate';
import * as reporteRepo from '../repositories/reporte.repository';

// ─── REPORTE DE CITAS ────────────────────────────────────────
export const getReporteCitas = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { desde, hasta, id_personal, id_especialidad, estado } = req.query;
    const reporte = await reporteRepo.getReporteCitas({
      desde:           desde as string,
      hasta:           hasta as string,
      id_personal:     id_personal     ? parseInt(id_personal as string)     : undefined,
      id_especialidad: id_especialidad ? parseInt(id_especialidad as string) : undefined,
      estado:          estado as string
    });
    res.json(reporte);
  } catch {
    res.status(500).json({ error: 'Error al generar reporte de citas' });
  }
};

// ─── REPORTE DE DOCTORES ─────────────────────────────────────
export const getReporteDoctores = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { desde, hasta, id_personal } = req.query;
    const reporte = await reporteRepo.getReporteDoctores({
      desde:       desde       as string,
      hasta:       hasta       as string,
      id_personal: id_personal ? parseInt(id_personal as string) : undefined
    });
    res.json(reporte);
  } catch {
    res.status(500).json({ error: 'Error al generar reporte de doctores' });
  }
};

// ─── REPORTE DE ESPECIALIDADES ───────────────────────────────
export const getReporteEspecialidades = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { desde, hasta, id_especialidad } = req.query;
    const reporte = await reporteRepo.getReporteEspecialidades({
      desde:           desde           as string,
      hasta:           hasta           as string,
      id_especialidad: id_especialidad ? parseInt(id_especialidad as string) : undefined
    });
    res.json(reporte);
  } catch {
    res.status(500).json({ error: 'Error al generar reporte de especialidades' });
  }
};

// ─── REPORTE DE EDADES ───────────────────────────────────────
export const getReporteEdades = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { desde, hasta } = req.query;
    const reporte = await reporteRepo.getReporteEdades({
      desde: desde as string,
      hasta: hasta as string
    });
    res.json(reporte);
  } catch {
    res.status(500).json({ error: 'Error al generar reporte de edades' });
  }
};

// ─── LISTADO DE DOCTORES ─────────────────────────────────────
export const getListadoDoctores = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { id_especialidad, estado } = req.query;
    const listado = await reporteRepo.getListadoDoctores({
      id_especialidad: id_especialidad ? parseInt(id_especialidad as string) : undefined,
      estado:          estado as string
    });
    res.json(listado);
  } catch {
    res.status(500).json({ error: 'Error al obtener listado de doctores' });
  }
};

// ─── LISTADO DE HORARIOS ─────────────────────────────────────
export const getListadoHorarios = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { id_personal, dia_semana } = req.query;
    const listado = await reporteRepo.getListadoHorarios({
      id_personal: id_personal ? parseInt(id_personal as string) : undefined,
      dia_semana:  dia_semana  ? parseInt(dia_semana  as string) : undefined
    });
    res.json(listado);
  } catch {
    res.status(500).json({ error: 'Error al obtener listado de horarios' });
  }
};

// ─── LISTADO DE CITAS ────────────────────────────────────────
export const getListadoCitas = async (
  req: RequestConUsuario, res: Response
): Promise<void> => {
  try {
    const { desde, hasta, estado } = req.query;
    const listado = await reporteRepo.getListadoCitas({
      desde:  desde  as string,
      hasta:  hasta  as string,
      estado: estado as string
    });
    res.json(listado);
  } catch {
    res.status(500).json({ error: 'Error al obtener listado de citas' });
  }
};