import { Request, Response } from "express";
import pool from "../config/database";
import { enviarCorreoContacto } from "../services/email.service";
import { notificarAdmins } from "../services/notificacion.service";

// POST /contacto — ruta pública, no requiere token
export const enviarMensaje = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !asunto || !mensaje) {
      res.status(400).json({
        error: "Todos los campos son obligatorios",
      });
      return;
    }

    // Paso 1: guardar en la base de datos
    // Esto ocurre SIEMPRE, independientemente del correo
    const result = await pool.query(
      `
      INSERT INTO MensajeContacto
        (nombre, email, asunto, mensaje)
      VALUES ($1, $2, $3, $4)
      RETURNING id_mensaje
    `,
      [nombre, email, asunto, mensaje],
    );

    const id_mensaje = result.rows[0].id_mensaje;

    // Paso 2: intentar enviar el correo
    const correoEnviado = await enviarCorreoContacto({
      nombre,
      email,
      asunto,
      mensaje,
    });

    // Paso 3: actualizar si el correo fue enviado
    if (correoEnviado) {
      await pool.query(
        `UPDATE MensajeContacto
         SET correo_enviado = TRUE
         WHERE id_mensaje = $1`,
        [id_mensaje],
      );
    }

    // Responder al frontend siempre con éxito
    // (el mensaje quedó guardado aunque el correo haya fallado)
    await notificarAdmins({
      titulo: "Nuevo mensaje de contacto",
      mensaje: `${nombre} (${email}) envió un mensaje: "${asunto}"`,
      tipo: "sistema",
    });
    res.status(201).json({
      mensaje:
        "Mensaje recibido correctamente. Nos comunicaremos contigo pronto.",
    });
  } catch {
    res.status(500).json({
      error: "Error al procesar el mensaje. Intenta nuevamente.",
    });
  }
};

// GET /admin/mensajes — solo para administradores
export const getMensajes = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        id_mensaje,
        nombre,
        email,
        asunto,
        mensaje,
        leido,
        correo_enviado,
        fecha_envio
      FROM MensajeContacto
      ORDER BY fecha_envio DESC
    `);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

// PATCH /admin/mensajes/:id/leer — marcar como leído
export const marcarMensajeLeido = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);

    await pool.query(
      `UPDATE MensajeContacto SET leido = TRUE WHERE id_mensaje = $1`,
      [id],
    );

    res.json({ mensaje: "Mensaje marcado como leído" });
  } catch {
    res.status(500).json({ error: "Error al actualizar el mensaje" });
  }
};
