import pool from '../config/database'

interface RegistroAuditoria {
  id_usuario_resp:    number
  nombre_usuario:     string
  tabla_afectada:     string
  accion:             'INSERT' | 'UPDATE' | 'DELETE'
  id_registro?:       number
  valores_anteriores?: object
  valores_nuevos?:     object
}

// Función centralizada para registrar acciones en AuditoriaLog.
// Se llama al final de cada operación crítica del sistema.
// Si falla, NO interrumpe el flujo principal.
export const registrarAuditoria = async (
  data: RegistroAuditoria
): Promise<void> => {
  try {
    await pool.query(`
      INSERT INTO AuditoriaLog
        (id_usuario_resp, nombre_usuario, tabla_afectada,
         accion, id_registro, valores_anteriores, valores_nuevos)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.id_usuario_resp,
      data.nombre_usuario,
      data.tabla_afectada,
      data.accion,
      data.id_registro    || null,
      data.valores_anteriores
        ? JSON.stringify(data.valores_anteriores)
        : null,
      data.valores_nuevos
        ? JSON.stringify(data.valores_nuevos)
        : null
    ])
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
  }
}