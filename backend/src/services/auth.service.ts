import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUsuarioByNombreUsuario,
  updateUltimoAcceso,
  createUsuarioPaciente,
} from "../repositories/auth.repository";
import pool from "../config/database";
import { LoginInput, LoginResponse, RegistroPacienteInput } from "../models";

// ─── LOGIN ───────────────────────────────────────────────────
export const loginService = async (
  data: LoginInput,
): Promise<LoginResponse> => {
  // Paso 1: buscar el usuario en la BD
  const usuario = await findUsuarioByNombreUsuario(data.nom_usuario);

  if (!usuario) {
    // Mensaje genérico intencionalmente — no decimos si el usuario
    // no existe o si la contraseña está mal (seguridad)
    throw new Error("Credenciales incorrectas");
  }

  // Paso 2: verificar la contraseña con bcrypt
  // bcrypt.compare compara el texto plano con el hash
  const contrasenaValida = await bcrypt.compare(
    data.contrasena,
    usuario.contrasena_hash,
  );

  if (!contrasenaValida) {
    throw new Error("Credenciales incorrectas");
  }

  // Paso 3: obtener el nombre completo según el rol
  const nombreCompleto = await getNombreCompleto(
    usuario.id_usuario,
    (usuario as any).rol_nombre,
  );

  // Paso 4: generar el token JWT
  // El token contiene información básica del usuario
  // que el frontend puede usar sin consultar la BD
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no configurado en .env");

  const token = jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      nom_usuario: usuario.nom_usuario,
      rol: (usuario as any).rol_nombre,
    },
    secret,
    { expiresIn: "8h" },
  );
  // Paso 5: actualizar último acceso
  await updateUltimoAcceso(usuario.id_usuario);

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nom_usuario: usuario.nom_usuario,
      rol: (usuario as any).rol_nombre,
      nombre: nombreCompleto.nombre,
      foto_url: nombreCompleto.foto_url,
    },
  };
};

// ─── REGISTRO DE PACIENTE ────────────────────────────────────
export const registroPacienteService = async (
  data: RegistroPacienteInput,
): Promise<{ mensaje: string }> => {
  // Verificar que el nombre de usuario no exista
  const usuarioExistente = await findUsuarioByNombreUsuario(data.nom_usuario);
  if (usuarioExistente) {
    throw new Error("El nombre de usuario ya está en uso");
  }

  // Verificar que el CI no esté registrado
  const ciResult = await pool.query(
    `SELECT id_paciente FROM Paciente WHERE ci = $1`,
    [data.ci],
  );
  if (ciResult.rows.length > 0) {
    throw new Error("El carnet de identidad ya está registrado");
  }

  // Verificar que el email no esté registrado
  const emailResult = await pool.query(
    `SELECT id_paciente FROM Paciente WHERE email = $1`,
    [data.email],
  );
  if (emailResult.rows.length > 0) {
    throw new Error("El correo electrónico ya está registrado");
  }

  // Obtener id del rol 'paciente'
  const rolResult = await pool.query(
    `SELECT id_rol FROM Rol WHERE nombre = 'paciente'`,
  );
  const id_rol = rolResult.rows[0].id_rol;

  // Hashear la contraseña — NUNCA guardar texto plano
  // El número 10 es el "cost factor" de bcrypt:
  // más alto = más seguro pero más lento
  const contrasena_hash = await bcrypt.hash(data.contrasena, 10);

  // Crear usuario y paciente en una transacción
  await createUsuarioPaciente({
    id_rol,
    nom_usuario: data.nom_usuario,
    contrasena_hash,
    primer_nombre: data.primer_nombre,
    apellido_pat: data.apellido_pat,
    apellido_mat: data.apellido_mat,
    ci: data.ci,
    email: data.email,
    telefono: data.telefono,
    direccion: data.direccion,
    fecha_nac: data.fecha_nac,
  });

  return { mensaje: "Paciente registrado exitosamente" };
};

// ─── HELPER INTERNO ─────────────────────────────────────────
// Obtiene el nombre completo y foto según el rol del usuario
const getNombreCompleto = async (
  id_usuario: number,
  rol: string,
): Promise<{ nombre: string; foto_url: string | null }> => {
  if (rol === "paciente") {
    const result = await pool.query(
      `SELECT primer_nombre || ' ' || apellido_pat AS nombre, foto_url
       FROM Paciente WHERE id_usuario = $1`,
      [id_usuario],
    );
    return result.rows[0] || { nombre: "Paciente", foto_url: null };
  }

  // Para todos los demás roles (personal del centro)
  const result = await pool.query(
    `SELECT primer_nombre || ' ' || apellido_pat AS nombre, foto_url
     FROM Personal WHERE id_usuario = $1`,
    [id_usuario],
  );
  return result.rows[0] || { nombre: "Usuario", foto_url: null };
};
