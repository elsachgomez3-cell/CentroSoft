import nodemailer from 'nodemailer'

// Configuración del transportador de Gmail
// Lee las credenciales desde el archivo .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Interfaz que define los datos del mensaje de contacto
export interface DatosCorreoContacto {
  nombre:  string
  email:   string
  asunto:  string
  mensaje: string
}

export const enviarCorreoContacto = async (
  datos: DatosCorreoContacto
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from:    `"CentroSoft Contacto" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_USER, // Se envía al mismo correo de CentroSoft
      subject: `[Contacto Web] ${datos.asunto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a73e8; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">CentroSoft — Nuevo mensaje de contacto</h2>
          </div>
          <div style="padding: 24px; background-color: #f8f9fa; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">
                  Nombre:
                </td>
                <td style="padding: 8px 0; color: #333;">
                  ${datos.nombre}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">
                  Correo:
                </td>
                <td style="padding: 8px 0; color: #333;">
                  ${datos.email}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">
                  Asunto:
                </td>
                <td style="padding: 8px 0; color: #333;">
                  ${datos.asunto}
                </td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
            <p style="font-weight: bold; color: #555; margin-bottom: 8px;">Mensaje:</p>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">
              ${datos.mensaje}
            </p>
          </div>
          <div style="padding: 12px; text-align: center; color: #999; font-size: 12px;">
            CentroSoft © 2026 — Sistema de Gestión Médica
          </div>
        </div>
      `
    })
    return true
  } catch (error) {
    // Si el envío falla, solo registramos el error en consola
    // pero NO lanzamos excepción para no interrumpir el flujo
    console.error('Error al enviar correo:', error)
    return false
  }
}
// ─── CORREO DE RECORDATORIO DE CITA ──────────────────────────
// Llamado por el cron de recordatorios. Retorna true/false
// igual que enviarCorreoContacto — un fallo no interrumpe el proceso.
export interface DatosCorreoRecordatorio {
  to:              string   // email del paciente
  nombre_paciente: string
  nombre_medico:   string
  fecha:           string   // DD/MM/YYYY
  hora:            string   // HH:MM
  tipo:            '1dia' | '30min'
}

export const enviarCorreoRecordatorio = async (
  datos: DatosCorreoRecordatorio
): Promise<boolean> => {
  try {
    const encabezado = datos.tipo === '1dia'
      ? `Tu cita médica es <strong>mañana</strong>`
      : `Tu cita médica es en <strong>aproximadamente 30 minutos</strong>`

    const asunto = datos.tipo === '1dia'
      ? `Recordatorio: tu cita médica es mañana — ${datos.fecha}`
      : `Recordatorio: tu cita médica es en 30 minutos — ${datos.hora}`

    await transporter.sendMail({
      from:    `"CentroSoft" <${process.env.EMAIL_USER}>`,
      to:      datos.to,
      subject: asunto,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background-color:#1a2332;padding:20px;text-align:center;">
            <h2 style="color:white;margin:0;">🏥 CentroSoft — Recordatorio de cita</h2>
          </div>
          <div style="padding:24px;background-color:#f8f9fa;border:1px solid #e0e0e0;">
            <p style="font-size:16px;color:#333;">Hola <strong>${datos.nombre_paciente}</strong>,</p>
            <p style="font-size:15px;color:#555;">${encabezado}:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#555;width:30%;">Médico:</td>
                <td style="padding:8px 0;color:#333;">Dr. ${datos.nombre_medico}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#555;">Fecha:</td>
                <td style="padding:8px 0;color:#333;">${datos.fecha}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:bold;color:#555;">Hora:</td>
                <td style="padding:8px 0;color:#333;">${datos.hora}</td>
              </tr>
            </table>
            <p style="color:#888;font-size:13px;">
              Si necesitas cancelar o reprogramar tu cita, ingresa al sistema con anticipación.
            </p>
          </div>
          <div style="padding:12px;text-align:center;color:#999;font-size:12px;">
            CentroSoft © ${new Date().getFullYear()} — Sistema de Gestión Médica
          </div>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('[enviarCorreoRecordatorio] Error:', error)
    return false
  }
}