import api from './api'
import type {
  ReporteCitas,
  ReporteDoctor,
  ReporteEdad,
  ReporteEspecialidad
} from '../types'

// ─── REPORTES ────────────────────────────────────────────────

export const getReporteCitasService = async (filtros?: {
  desde?:           string
  hasta?:           string
  id_personal?:     number
  id_especialidad?: number
  estado?:          string
}): Promise<ReporteCitas> => {
  const res = await api.get('/gerente/reportes/citas', { params: filtros })
  return res.data
}

export const getReporteDoctoresService = async (filtros?: {
  desde?:       string
  hasta?:       string
  id_personal?: number
}): Promise<{ doctores: ReporteDoctor[]; totales: any }> => {
  const res = await api.get('/gerente/reportes/doctores', { params: filtros })
  return res.data
}

export const getReporteEspecialidadesService = async (filtros?: {
  desde?:           string
  hasta?:           string
  id_especialidad?: number
}): Promise<{ especialidades: ReporteEspecialidad[]; total: number }> => {
  const res = await api.get('/gerente/reportes/especialidades', { params: filtros })
  return res.data
}

export const getReporteEdadesService = async (filtros?: {
  desde?: string
  hasta?: string
}): Promise<{ rangos: ReporteEdad[]; total: number }> => {
  const res = await api.get('/gerente/reportes/edades', { params: filtros })
  return res.data
}

// ─── LISTADOS ────────────────────────────────────────────────

export const getListadoDoctoresService = async (filtros?: {
  id_especialidad?: number
  estado?:          string
}): Promise<any[]> => {
  const res = await api.get('/gerente/listados/doctores', { params: filtros })
  return res.data
}

export const getListadoHorariosService = async (filtros?: {
  id_personal?: number
  dia_semana?:  number
}): Promise<any[]> => {
  const res = await api.get('/gerente/listados/horarios', { params: filtros })
  return res.data
}

export const getListadoCitasService = async (filtros?: {
  desde?:  string
  hasta?:  string
  estado?: string
}): Promise<any[]> => {
  const res = await api.get('/gerente/listados/citas', { params: filtros })
  return res.data
}