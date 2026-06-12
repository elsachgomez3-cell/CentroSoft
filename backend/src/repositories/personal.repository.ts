import pool from "../config/database";
import { registrarAuditoria } from "../services/auditoria.service";
import { notificarAdmins } from "../services/notificacion.service";

// ─── LISTAR TODO EL PERSONAL ────────────────────────────────
// Devuelve el personal con su rol y especialidades
export const findAllPersonal = async () => {
  const result = await pool.query(`
    SELECT
      p.id_personal,
      p.primer_nombre || ' ' || p.apellido_pat ||
        COALESCE(' ' || p.apellido_mat, '') AS nombre,
      p.primer_nombre,
      p.apellido_pat,
      p.apellido_mat,
      p.email,
      p.telefono,
      p.foto_url,
      u.id_usuario,
      u.nom_usuario,
      u.estado,
      r.nombre AS rol,
      r.id_rol,
      COALESCE(
        STRING_AGG(e.nombre, ', ' ORDER BY e.nombre),
        'Sin especialidad'
      ) AS especialidades
    FROM Personal p
    JOIN Usuario u ON u.id_usuario = p.id_usuario
    JOIN Rol r ON r.id_rol = u.id_rol
    LEFT JOIN PersonalEspecialidad pe ON pe.id_personal = p.id_personal
    LEFT JOIN Especialidad e ON e.id_especialidad = pe.id_especialidad
    GROUP BY
      p.id_personal, p.primer_nombre, p.apellido_pat,
      p.apellido_mat, p.email, p.telefono, p.foto_url,
      u.id_usuario, u.nom_usuario, u.estado, r.nombre, r.id_rol
    ORDER BY p.primer_nombre
  `);
  return result.rows;
};

// ─── BUSCAR PERSONAL POR ID ──────────────────────────────────
export const findPersonalById = async (id_personal: number) => {
  const result = await pool.query(
    `
    SELECT
      p.*,
      u.nom_usuario,
      u.estado,
      r.nombre AS rol,
      r.id_rol
    FROM Personal p
    JOIN Usuario u ON u.id_usuario = p.id_usuario
    JOIN Rol r ON r.id_rol = u.id_rol
    WHERE p.id_personal = $1
  `,
    [id_personal],
  );
  return result.rows[0] || null;
};

// ─── CREAR PERSONAL ──────────────────────────────────────────
// Crea el usuario y el personal en una sola transacción
export const createPersonal = async (data: {
  id_rol: number;
  nom_usuario: string;
  contrasena_hash: string;
  primer_nombre: string;
  apellido_pat: string;
  apellido_mat?: string;
  email?: string;
  telefono?: string;
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Crear usuario
    const usuarioResult = await client.query(
      `
      INSERT INTO Usuario (id_rol, nom_usuario, contrasena_hash)
      VALUES ($1, $2, $3)
      RETURNING id_usuario
    `,
      [data.id_rol, data.nom_usuario, data.contrasena_hash],
    );

    const id_usuario = usuarioResult.rows[0].id_usuario;

    // Crear personal
    const personalResult = await client.query(
      `
      INSERT INTO Personal
        (id_usuario, primer_nombre, apellido_pat, apellido_mat, email, telefono)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        id_usuario,
        data.primer_nombre,
        data.apellido_pat,
        data.apellido_mat || null,
        data.email || null,
        data.telefono || null,
      ],
    );

    await client.query("COMMIT");
    await notificarAdmins({
      titulo: "Nuevo personal registrado",
      mensaje: `Se registró a ${data.primer_nombre} ${data.apellido_pat} en el sistema.`,
      tipo: "sistema",
    });
    await registrarAuditoria({
      id_usuario_resp: data.id_rol,
      nombre_usuario: data.nom_usuario,
      tabla_afectada: "Personal",
      accion: "INSERT",
      id_registro: personalResult.rows[0].id_personal,
      valores_nuevos: {
        nom_usuario: data.nom_usuario,
        primer_nombre: data.primer_nombre,
        apellido_pat: data.apellido_pat,
      },
    });
    return personalResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── ACTUALIZAR PERSONAL ─────────────────────────────────────
export const updatePersonal = async (
  id_personal: number,
  data: {
    primer_nombre?: string;
    apellido_pat?: string;
    apellido_mat?: string;
    email?: string;
    telefono?: string;
    estado?: string;
    nom_usuario?: string;
    contrasena?: string;
    id_rol?: number;
  },
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE Personal SET
        primer_nombre = COALESCE($1, primer_nombre),
        apellido_pat  = COALESCE($2, apellido_pat),
        apellido_mat  = COALESCE($3, apellido_mat),
        email         = COALESCE($4, email),
        telefono      = COALESCE($5, telefono)
      WHERE id_personal = $6
    `,
      [
        data.primer_nombre || null,
        data.apellido_pat || null,
        data.apellido_mat || null,
        data.email || null,
        data.telefono || null,
        id_personal,
      ],
    );

    // Actualizar datos de Usuario si se enviaron
    if (data.estado || data.nom_usuario || data.contrasena || data.id_rol) {
      // Hash de contraseña si se envió una nueva
      let contrasena_hash = null;
      if (data.contrasena) {
        const bcrypt = require("bcryptjs");
        contrasena_hash = await bcrypt.hash(data.contrasena, 10);
      }

      await client.query(
        `
        UPDATE Usuario u SET
          estado          = COALESCE($1::estado_usuario, estado),
          nom_usuario     = COALESCE($2, nom_usuario),
          contrasena_hash = COALESCE($3, contrasena_hash),
          id_rol          = COALESCE($4, id_rol)
        FROM Personal p
        WHERE p.id_usuario = u.id_usuario
          AND p.id_personal = $5
      `,
        [
          data.estado || null,
          data.nom_usuario || null,
          contrasena_hash,
          data.id_rol || null,
          id_personal,
        ],
      );
    }

    await client.query("COMMIT");
    return await findPersonalById(id_personal);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── ELIMINAR PERSONAL ───────────────────────────────────────
// Desactiva el usuario en lugar de borrarlo
// para preservar el historial de citas
export const deletePersonal = async (id_personal: number) => {
  await pool.query(
    `
    UPDATE Usuario u SET estado = 'inactivo'
    FROM Personal p
    WHERE p.id_usuario = u.id_usuario
      AND p.id_personal = $1
  `,
    [id_personal],
  );
};
