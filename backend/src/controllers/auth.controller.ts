import { Request, Response } from 'express'
import { RequestConUsuario } from '../middlewares/authenticate'
import pool from '../config/database'
import {
  loginService,
  registroPacienteService,
} from "../services/auth.service";

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom_usuario, contrasena } = req.body;

    // Validación básica de campos requeridos
    if (!nom_usuario || !contrasena) {
      res.status(400).json({
        error: "El nombre de usuario y la contraseña son requeridos",
      });
      return;
    }

    const resultado = await loginService({ nom_usuario, contrasena });

    res.status(200).json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el login";

    // 401 = No autorizado (credenciales incorrectas)
    res.status(401).json({ error: mensaje });
  }
};

// POST /auth/register
export const registrarPaciente = async (
  req: Request,
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

    // Validar campos obligatorios
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

    // 201 = Creado exitosamente
    res.status(201).json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error en el registro";
    res.status(400).json({ error: mensaje });
  }
};
// Obtener perfil del usuario autenticado
export const getMiPerfil = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    // Buscar en Paciente primero
    const pacienteResult = await pool.query(
      `
      SELECT
        p.*,
        DATE_PART('year', AGE(p.fecha_nac))::INT AS edad,
        u.nom_usuario,
        u.estado
      FROM Paciente p
      JOIN Usuario u ON u.id_usuario = p.id_usuario
      WHERE p.id_usuario = $1
    `,
      [req.usuario!.id_usuario],
    );

    if (pacienteResult.rows.length > 0) {
      res.json({ tipo: "paciente", datos: pacienteResult.rows[0] });
      return;
    }

    // Si no es paciente, buscar en Personal
    const personalResult = await pool.query(
      `
      SELECT
        p.*,
        u.nom_usuario,
        u.estado,
        r.nombre AS rol
      FROM Personal p
      JOIN Usuario u ON u.id_usuario = p.id_usuario
      JOIN Rol r ON r.id_rol = u.id_rol
      WHERE p.id_usuario = $1
    `,
      [req.usuario!.id_usuario],
    );

    if (personalResult.rows.length > 0) {
      res.json({ tipo: "personal", datos: personalResult.rows[0] });
      return;
    }

    res.status(404).json({ error: "Perfil no encontrado" });
  } catch {
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
};

// Cambiar contraseña
export const cambiarContrasena = async (
  req: RequestConUsuario,
  res: Response,
): Promise<void> => {
  try {
    const { contrasena_actual, contrasena_nueva } = req.body;

    if (!contrasena_actual || !contrasena_nueva) {
      res.status(400).json({
        error: "Se requieren la contraseña actual y la nueva",
      });
      return;
    }

    if (contrasena_nueva.length < 6) {
      res.status(400).json({
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    // Obtener el hash actual
    const usuarioResult = await pool.query(
      `SELECT contrasena_hash FROM Usuario WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );

    const usuario = usuarioResult.rows[0];
    if (!usuario) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Verificar que la contraseña actual es correcta
    const bcrypt = require("bcryptjs");
    const esValida = await bcrypt.compare(
      contrasena_actual,
      usuario.contrasena_hash,
    );

    if (!esValida) {
      res.status(400).json({ error: "La contraseña actual es incorrecta" });
      return;
    }

    // Guardar la nueva contraseña hasheada
    const nuevoHash = await bcrypt.hash(contrasena_nueva, 10);
    await pool.query(
      `UPDATE Usuario SET contrasena_hash = $1 WHERE id_usuario = $2`,
      [nuevoHash, req.usuario!.id_usuario],
    );

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch {
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
};
