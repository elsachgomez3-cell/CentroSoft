import api from "./api";

export interface CitaMedico {
  id_cita: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo: string | null;
  paciente: string;
  paciente_ci: string | null;
  paciente_telefono: string | null;
  paciente_edad: number | null;
  especialidad: string;
  id_especialidad: number;
}

export interface ResumenCalendario {
  fecha: string;
  total: number;
  atendidas: number;
  disponibles: number;
  trabaja: boolean;
}

export interface Especialidad {
  id_especialidad: number;
  nombre: string;
}

export interface HorarioMedico {
  id_horario: number;
  id_especialidad: number;
  especialidad: string;
  hora_inicio_manana: string | null;
  hora_fin_manana: string | null;
  hora_inicio_tarde: string | null;
  hora_fin_tarde: string | null;
  duracion_cita_min: number;
  dias: number[];
}

// Agenda del día del médico autenticado
export const getAgendaHoyService = async (
  fecha?: string,
  id_especialidad?: number,
): Promise<CitaMedico[]> => {
  const params: Record<string, any> = {};
  if (fecha) params.fecha = fecha;
  if (id_especialidad) params.id_especialidad = id_especialidad;
  const res = await api.get("/citas/agenda", { params });
  return res.data;
};

// Cambiar estado de una cita
export const cambiarEstadoCitaService = async (
  id_cita: number,
  estado: string,
  motivo_cancelacion?: string,
): Promise<void> => {
  await api.patch(`/citas/${id_cita}/estado`, {
    estado,
    motivo_cancelacion,
  });
};

// Resumen mensual para el calendario
export const getResumenMensualService = async (
  mes: number,
  anio: number,
  id_especialidad?: number,
): Promise<{
  diasTrabaja: number[];
  citas: { fecha: string; total: string; atendidas: string }[];
}> => {
  const params: Record<string, any> = { mes, anio };
  if (id_especialidad) params.id_especialidad = id_especialidad;
  const res = await api.get("/citas/resumen-mensual", { params });
  return res.data;
};

// Especialidades propias del médico autenticado
export const getMisEspecialidadesService = async (): Promise<Especialidad[]> => {
  const res = await api.get("/citas/mis-especialidades");
  return res.data;
};

// Horarios del médico, opcionalmente filtrado por especialidad
export const getHorariosMedicoService = async (
  id_especialidad?: number,
): Promise<HorarioMedico[]> => {
  const params: Record<string, any> = {};
  if (id_especialidad) params.id_especialidad = id_especialidad;
  const res = await api.get("/citas/horarios-medico", { params });
  return res.data;
};