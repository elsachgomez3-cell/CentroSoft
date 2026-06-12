import { Response } from "express";
import { RequestConUsuario } from "../middlewares/authenticate";
import * as citaRepo from "../repositories/cita.repository";
import * as pacienteRepo from "../repositories/paciente.repository";
import pool from "../config/database";

// ─── DISPONIBILIDAD ──────────────────────────────────────────
export const getDisponibilidad = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { id_horario, fecha } = req.query;

    if (!id_horario || !fecha) {
      res.status(400).json({
        error: "Se requieren id_horario y fecha",
      });
      return;
    }

    const slots = await citaRepo.findDisponibilidad(
      parseInt(id_horario as string),
      fecha as string,
    );

    res.json(slots);
  } catch {
    res.status(500).json({ error: "Error al obtener disponibilidad" });
  }
};

// ─── AGENDAR CITA ────────────────────────────────────────────
export const crearCita = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { id_horario, fecha, hora, motivo } = req.body;

    if (!id_horario || !fecha || !hora) {
      res.status(400).json({
        error: "Se requieren id_horario, fecha y hora",
      });
      return;
    }

    // Obtener id_paciente del usuario autenticado
    const pacienteResult = await pool.query(
      `SELECT id_paciente FROM Paciente WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    if (pacienteResult.rows.length === 0) {
      res.status(400).json({ error: "No se encontró el paciente" });
      return;
    }

    const id_paciente = pacienteResult.rows[0].id_paciente;

    const cita = await citaRepo.createCita({
      id_paciente,
      id_horario,
      fecha,
      hora,
      motivo,
    });

    res.status(201).json(cita);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al crear la cita";
    res.status(400).json({ error: mensaje });
  }
};

// ─── MIS CITAS (paciente autenticado) ────────────────────────
export const getMisCitas = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const pacienteResult = await pool.query(
      `SELECT id_paciente FROM Paciente WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    if (pacienteResult.rows.length === 0) {
      res.json([]);
      return;
    }

    const id_paciente = pacienteResult.rows[0].id_paciente;
    const citas = await citaRepo.findCitasByPaciente(id_paciente);
    res.json(citas);
  } catch {
    res.status(500).json({ error: "Error al obtener las citas" });
  }
};

// ─── CITAS PROGRAMADAS (para reprogramar o cancelar) ─────────
export const getMisCitasProgramadas = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const pacienteResult = await pool.query(
      `SELECT id_paciente FROM Paciente WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    const id_paciente = pacienteResult.rows[0]?.id_paciente;
    if (!id_paciente) {
      res.json([]);
      return;
    }

    const citas = await citaRepo.findCitasProgramadasByPaciente(id_paciente);
    res.json(citas);
  } catch {
    res.status(500).json({ error: "Error al obtener las citas" });
  }
};

// ─── AGENDA DEL MÉDICO ───────────────────────────────────────
export const getAgendaMedico = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const fecha =
      (req.query.fecha as string) || new Date().toISOString().split("T")[0];
    const id_especialidad = req.query.id_especialidad
      ? parseInt(req.query.id_especialidad as string)
      : undefined;

    const personalResult = await pool.query(
      `SELECT id_personal FROM Personal WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    if (personalResult.rows.length === 0) {
      res.status(400).json({ error: "No se encontró el médico" });
      return;
    }

    const id_personal = personalResult.rows[0].id_personal;
    const agenda = await citaRepo.findAgendaMedico(id_personal, fecha, id_especialidad);
    res.json(agenda);
  } catch {
    res.status(500).json({ error: "Error al obtener la agenda" });
  }
};

// ─── CITAS DE HOY (recepcionista y enfermera) ────────────────
export const getCitasHoy = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const citas = await citaRepo.findCitasHoy();
    res.json(citas);
  } catch {
    res.status(500).json({ error: "Error al obtener citas de hoy" });
  }
};

// ─── REPROGRAMAR CITA ────────────────────────────────────────
export const reprogramarCita = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id_cita = parseInt(req.params.id as string);
    const { id_horario, fecha, hora, motivo_cambio } = req.body;

    if (!id_horario || !fecha || !hora) {
      res.status(400).json({
        error: "Se requieren id_horario, fecha y hora",
      });
      return;
    }

    const resultado = await citaRepo.reprogramarCita(
      id_cita,
      req.usuario!.id_usuario,
      { id_horario, fecha, hora, motivo_cambio },
    );

    res.json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al reprogramar";
    res.status(400).json({ error: mensaje });
  }
};

// ─── CAMBIAR ESTADO ──────────────────────────────────────────
export const cambiarEstado = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id_cita = parseInt(req.params.id as string);
    const { estado, motivo_cancelacion } = req.body;

    if (!estado) {
      res.status(400).json({ error: "El estado es requerido" });
      return;
    }

    const resultado = await citaRepo.cambiarEstadoCita(
      id_cita,
      req.usuario!.id_usuario,
      estado,
      motivo_cancelacion,
    );

    res.json(resultado);
  } catch {
    res.status(500).json({ error: "Error al cambiar el estado" });
  }
};
// ─── TODAS LAS CITAS PARA EL ADMIN ──────────────────────────
export const getAllCitas = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { desde, hasta, estado } = req.query;
    const citas = await citaRepo.findAllCitas({
      desde: desde as string,
      hasta: hasta as string,
      estado: estado as string,
    });
    res.json(citas);
  } catch {
    res.status(500).json({ error: "Error al obtener las citas" });
  }
};

// ─── RESUMEN MENSUAL PARA CALENDARIO ────────────────────────
export const getResumenMensual = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { mes, anio } = req.query;
    const id_especialidad = req.query.id_especialidad
      ? parseInt(req.query.id_especialidad as string)
      : undefined;

    const personalResult = await pool.query(
      `SELECT id_personal FROM Personal WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    if (personalResult.rows.length === 0) {
      res.status(400).json({ error: "No se encontró el médico" });
      return;
    }

    const id_personal = personalResult.rows[0].id_personal;
    const resumen = await citaRepo.findResumenMensual(
      id_personal,
      parseInt(mes as string) || new Date().getMonth() + 1,
      parseInt(anio as string) || new Date().getFullYear(),
      id_especialidad,
    );

    res.json(resumen);
  } catch {
    res.status(500).json({ error: "Error al obtener el resumen mensual" });
  }
};

// ─── ESPECIALIDADES DEL MÉDICO AUTENTICADO ───────────────────
export const getMisEspecialidades = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const personalResult = await pool.query(
      `SELECT id_personal FROM Personal WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );
    if (personalResult.rows.length === 0) {
      res.status(400).json({ error: "No se encontró el médico" });
      return;
    }
    const id_personal = personalResult.rows[0].id_personal;
    const especialidades = await citaRepo.findMisEspecialidades(id_personal);
    res.json(especialidades);
  } catch {
    res.status(500).json({ error: "Error al obtener especialidades" });
  }
};

// ─── HORARIOS DEL MÉDICO POR ESPECIALIDAD ────────────────────
export const getHorariosMedico = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id_especialidad = req.query.id_especialidad
      ? parseInt(req.query.id_especialidad as string)
      : undefined;

    const personalResult = await pool.query(
      `SELECT id_personal FROM Personal WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );
    if (personalResult.rows.length === 0) {
      res.status(400).json({ error: "No se encontró el médico" });
      return;
    }
    const id_personal = personalResult.rows[0].id_personal;
    const horarios = await citaRepo.findHorariosMedico(id_personal, id_especialidad);
    res.json(horarios);
  } catch {
    res.status(500).json({ error: "Error al obtener horarios del médico" });
  }
};