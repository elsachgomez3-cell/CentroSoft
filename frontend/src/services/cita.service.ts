import api from './api'
import type { CitaDetalle, SlotDisponible, Horario } from '../types'

// Obtener slots disponibles para una fecha y horario
export const getDisponibilidadService = async (
  id_horario: number,
  fecha:      string
): Promise<SlotDisponible[]> => {
  const res = await api.get('/citas/disponibilidad', {
    params: { id_horario, fecha }
  })
  return res.data
}

// Obtener horarios disponibles filtrando por especialidad
export const getHorariosPorEspecialidadService = async (
  id_especialidad: number
): Promise<Horario[]> => {
  const res = await api.get('/admin/horarios')
  return res.data.filter(
    (h: Horario) => h.id_especialidad === id_especialidad && h.activo
  )
}

// Agendar una nueva cita
export const agendarCitaService = async (data: {
  id_horario: number
  fecha:      string
  hora:       string
  motivo?:    string
}): Promise<void> => {
  await api.post('/citas', data)
}

// Mis citas completas (historial)
export const getMisCitasService = async (): Promise<CitaDetalle[]> => {
  const res = await api.get('/citas/mis-citas')
  return res.data
}

// Solo citas programadas (para reprogramar y cancelar)
export const getMisCitasProgramadasService = async (): Promise<CitaDetalle[]> => {
  const res = await api.get('/citas/mis-citas-programadas')
  return res.data
}

// Reprogramar una cita existente
export const reprogramarCitaService = async (
  id_cita: number,
  data: {
    id_horario:     number
    fecha:          string
    hora:           string
    motivo_cambio?: string
  }
): Promise<void> => {
  await api.put(`/citas/${id_cita}/reprogramar`, data)
}

// Cancelar una cita
export const cancelarCitaService = async (
  id_cita:           number,
  motivo_cancelacion: string
): Promise<void> => {
  await api.patch(`/citas/${id_cita}/estado`, {
    estado: 'cancelada',
    motivo_cancelacion
  })
}