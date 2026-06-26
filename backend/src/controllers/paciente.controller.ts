import { Response } from "express";
import { RequestConUsuario } from "../middlewares/authenticate";
import * as pacienteRepo from "../repositories/paciente.repository";
import { registroPacienteService } from "../services/auth.service";

// ─── BUSCAR PACIENTE POR CI (recepcionista) ──────────────────
// GET /pacientes/buscar?ci=12345
export const buscarPorCI = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { ci } = req.query;

    if (!ci) {
      res.status(400).json({ error: "Se requiere el parámetro ci" });
      return;
    }

    const paciente = await pacienteRepo.findPacienteByCI(ci as string);

    if (!paciente) {
      res.status(404).json({ error: "No se encontró un paciente con esa cédula" });
      return;
    }

    res.json(paciente);
  } catch {
    res.status(500).json({ error: "Error al buscar el paciente" });
  }
};

// ─── REGISTRAR PACIENTE (recepcionista) ──────────────────────
// POST /pacientes
// Reutiliza el mismo servicio que usa el registro público,
// solo que esta ruta está protegida y la usa el personal de recepción.
export const registrarPacienteDesdeRecepcion = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const {
      primer_nombre,
      apellido_pat,
      apellido_mat,
      ci,
      email,
      telefono,
      direccion,
      fecha_nac,
      nom_usuario,
      contrasena,
    } = req.body;

    if (
      !primer_nombre ||
      !apellido_pat ||
      !ci ||
      !email ||
      !nom_usuario ||
      !contrasena
    ) {
      res.status(400).json({
        error:
          "Faltan campos obligatorios: primer_nombre, apellido_pat, ci, email, nom_usuario, contrasena",
      });
      return;
    }

    const resultado = await registroPacienteService({
      primer_nombre,
      apellido_pat,
      apellido_mat,
      ci,
      email,
      telefono,
      direccion,
      fecha_nac,
      nom_usuario,
      contrasena,
    });

    res.status(201).json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al registrar el paciente";
    res.status(400).json({ error: mensaje });
  }
};