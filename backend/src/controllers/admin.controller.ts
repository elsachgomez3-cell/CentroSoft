import { Response } from "express";
import { RequestConUsuario } from "../middlewares/authenticate";
import bcrypt from "bcryptjs";
import * as personalRepo from "../repositories/personal.repository";
import * as pacienteRepo from "../repositories/paciente.repository";
import * as especialidadRepo from "../repositories/especialidad.repository";
import * as horarioRepo from "../repositories/horario.repository";
import pool from "../config/database";

// ════════════════════════════════════════════════════════════
// PERSONAL
// ════════════════════════════════════════════════════════════

export const getPersonal = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const personal = await personalRepo.findAllPersonal();
    res.json(personal);
  } catch {
    res.status(500).json({ error: "Error al obtener el personal" });
  }
};

export const createPersonal = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const {
      primer_nombre,
      apellido_pat,
      apellido_mat,
      email,
      telefono,
      nom_usuario,
      contrasena,
      id_rol,
    } = req.body;

    if (
      !primer_nombre ||
      !apellido_pat ||
      !nom_usuario ||
      !contrasena ||
      !id_rol
    ) {
      res.status(400).json({ error: "Faltan campos obligatorios" });
      return;
    }

    // Verificar que el usuario no exista
    const existe = await pool.query(
      `SELECT id_usuario FROM Usuario WHERE nom_usuario = $1`,
      [nom_usuario],
    );
    if (existe.rows.length > 0) {
      res.status(400).json({ error: "El nombre de usuario ya existe" });
      return;
    }

    const contrasena_hash = await bcrypt.hash(contrasena, 10);

    const personal = await personalRepo.createPersonal({
      id_rol,
      nom_usuario,
      contrasena_hash,
      primer_nombre,
      apellido_pat,
      apellido_mat,
      email,
      telefono,
    });

    res.status(201).json(personal);
  } catch {
    res.status(500).json({ error: "Error al crear el personal" });
  }
};

export const updatePersonal = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const personal = await personalRepo.updatePersonal(id, req.body);
    if (!personal) {
      res.status(404).json({ error: "Personal no encontrado" });
      return;
    }
    res.json(personal);
  } catch {
    res.status(500).json({ error: "Error al actualizar el personal" });
  }
};

export const deletePersonal = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await personalRepo.deletePersonal(id);
    res.json({ mensaje: "Personal desactivado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar el personal" });
  }
};

// ════════════════════════════════════════════════════════════
// PACIENTES
// ════════════════════════════════════════════════════════════

export const getPacientes = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const pacientes = await pacienteRepo.findAllPacientes();
    res.json(pacientes);
  } catch {
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

export const updatePaciente = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const paciente = await pacienteRepo.updatePaciente(id, req.body);
    if (!paciente) {
      res.status(404).json({ error: "Paciente no encontrado" });
      return;
    }
    res.json(paciente);
  } catch {
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
};

export const deletePaciente = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await pacienteRepo.deletePaciente(id);
    res.json({ mensaje: "Paciente desactivado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar paciente" });
  }
};

// ════════════════════════════════════════════════════════════
// ESPECIALIDADES
// ════════════════════════════════════════════════════════════

export const getEspecialidades = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const especialidades = await especialidadRepo.findAllEspecialidades();
    res.json(especialidades);
  } catch {
    res.status(500).json({ error: "Error al obtener especialidades" });
  }
};

export const createEspecialidad = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      res.status(400).json({ error: "El nombre es requerido" });
      return;
    }
    const especialidad = await especialidadRepo.createEspecialidad({
      nombre,
      descripcion,
    });
    res.status(201).json(especialidad);
  } catch {
    res.status(500).json({ error: "Error al crear especialidad" });
  }
};

export const updateEspecialidad = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const especialidad = await especialidadRepo.updateEspecialidad(
      id,
      req.body,
    );
    res.json(especialidad);
  } catch {
    res.status(500).json({ error: "Error al actualizar especialidad" });
  }
};

export const deleteEspecialidad = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await especialidadRepo.deleteEspecialidad(id);
    res.json({ mensaje: "Especialidad desactivada correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar especialidad" });
  }
};

// ════════════════════════════════════════════════════════════
// HORARIOS
// ════════════════════════════════════════════════════════════

export const getHorarios = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const horarios = await horarioRepo.findAllHorarios();
    res.json(horarios);
  } catch {
    res.status(500).json({ error: "Error al obtener horarios" });
  }
};

export const createHorario = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const {
      id_personal,
      id_especialidad,
      hora_inicio_manana,
      hora_fin_manana,
      hora_inicio_tarde,
      hora_fin_tarde,
      duracion_cita_min,
      dias,
    } = req.body;

    if (
      !id_personal ||
      !id_especialidad ||
      !duracion_cita_min ||
      !dias ||
      dias.length === 0
    ) {
      res.status(400).json({
        error:
          "Faltan campos: id_personal, id_especialidad, duracion_cita_min, dias",
      });
      return;
    }

    const horario = await horarioRepo.createHorario({
      id_personal,
      id_especialidad,
      hora_inicio_manana,
      hora_fin_manana,
      hora_inicio_tarde,
      hora_fin_tarde,
      duracion_cita_min,
      dias,
    });

    res.status(201).json(horario);
  } catch {
    res.status(500).json({ error: "Error al crear horario" });
  }
};

export const updateHorario = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const horario = await horarioRepo.updateHorario(id, req.body);
    res.json(horario);
  } catch {
    res.status(500).json({ error: "Error al actualizar horario" });
  }
};

export const deleteHorario = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await horarioRepo.deleteHorario(id);
    res.json({ mensaje: "Horario desactivado correctamente" });
  } catch {
    res.status(500).json({ error: "Error al eliminar horario" });
  }
};
// Obtener todos los roles (para el formulario de registro de personal)
export const getRoles = async (
  _req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id_rol, nombre, descripcion FROM Rol ORDER BY nombre`,
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener roles" });
  }
};
