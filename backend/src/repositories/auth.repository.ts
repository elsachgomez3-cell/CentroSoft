import pool from "../config/database";
import { notificarAdmins } from "../services/notificacion.service";
import { Usuario } from "../models";

// Busca un usuario por su nombre de usuario.
// Devuelve el usuario completo incluyendo el hash
// de la contraseña (necesario para verificarla).
export const findUsuarioByNombreUsuario = async (
  nom_usuario: string,
): Promise<Usuario | null> => {
  const query = `
    SELECT u.*, r.nombre AS rol_nombre
    FROM Usuario u
    JOIN Rol r ON r.id_rol = u.id_rol
    WHERE u.nom_usuario = $1
      AND u.estado = 'activo'
    LIMIT 1
  `;
  const result = await pool.query(query, [nom_usuario]);
  return result.rows[0] || null;
};

// Busca un usuario por su ID.
// Se usa para verificar el JWT en rutas protegidas.
export const findUsuarioById = async (
  id_usuario: number,
): Promise<Usuario | null> => {
  const query = `
    SELECT u.*, r.nombre AS rol_nombre
    FROM Usuario u
    JOIN Rol r ON r.id_rol = u.id_rol
    WHERE u.id_usuario = $1
      AND u.estado = 'activo'
    LIMIT 1
  `;
  const result = await pool.query(query, [id_usuario]);
  return result.rows[0] || null;
};

// Actualiza la fecha del último acceso del usuario.
// Se llama después de un login exitoso.
export const updateUltimoAcceso = async (id_usuario: number): Promise<void> => {
  await pool.query(
    `UPDATE Usuario SET ultimo_acceso = NOW() WHERE id_usuario = $1`,
    [id_usuario],
  );
};

// Crea un nuevo usuario y su paciente en una sola transacción.
// Una transacción significa que si algo falla a mitad,
// todo se revierte — no quedan datos a medias.
export const createUsuarioPaciente = async (data: {
  id_rol: number;
  nom_usuario: string;
  contrasena_hash: string;
  primer_nombre: string;
  apellido_pat: string;
  apellido_mat?: string;
  ci: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_nac?: string;
}): Promise<{ id_usuario: number; id_paciente: number }> => {
  // Obtenemos un cliente del pool para manejar la transacción
  const client = await pool.connect();

  try {
    // Inicio de la transacción
    await client.query("BEGIN");

    // Paso 1: crear el usuario
    const usuarioResult = await client.query(
      `INSERT INTO Usuario (id_rol, nom_usuario, contrasena_hash)
       VALUES ($1, $2, $3)
       RETURNING id_usuario`,
      [data.id_rol, data.nom_usuario, data.contrasena_hash],
    );
    const id_usuario = usuarioResult.rows[0].id_usuario;

    // Paso 2: crear el paciente ligado al usuario
    const pacienteResult = await client.query(
      `INSERT INTO Paciente
         (id_usuario, primer_nombre, apellido_pat, apellido_mat,
          ci, email, telefono, direccion, fecha_nac)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id_paciente`,
      [
        id_usuario,
        data.primer_nombre,
        data.apellido_pat,
        data.apellido_mat || null,
        data.ci,
        data.email,
        data.telefono || null,
        data.direccion || null,
        data.fecha_nac || null,
      ],
    );
    const id_paciente = pacienteResult.rows[0].id_paciente;

    // Si todo salió bien, confirma los cambios
    await client.query("COMMIT");

    await notificarAdmins({
      titulo: "Nuevo paciente registrado",
      mensaje: `El paciente se registró exitosamente en el sistema.`,
      tipo: "sistema",
    });

    return { id_usuario, id_paciente };
  } catch (error) {
    // Si algo falló, revierte TODO — ni el usuario ni el paciente quedan creados
    await client.query("ROLLBACK");
    throw error;
  } finally {
    // Siempre devolver el cliente al pool
    client.release();
  }
};
