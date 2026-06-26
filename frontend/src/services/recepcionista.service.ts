import api from "./api";
import type { Paciente, Horario, SlotDisponible } from "../types";
import type { CitaAdmin } from "./admin.service";

// ─── CITAS DE HOY ─────────────────────────────────────────────
export interface CitaHoy {
  id_cita: number;
  fecha: string;
  hora: string;
  motivo: string | null;
  estado: string;
  paciente: string;
  paciente_ci: string | null;
  paciente_telefono: string | null;
  medico: string;
  especialidad: string;
}

export const getCitasHoyService = async (): Promise<CitaHoy[]> => {
  const res = await api.get("/citas/hoy");
  return res.data;
};

// ─── CAMBIAR ESTADO DE UNA CITA ──────────────────────────────
export const cambiarEstadoCitaService = async (
  id_cita: number,
  estado: string,
  motivo_cancelacion?: string,
): Promise<void> => {
  await api.patch(`/citas/${id_cita}/estado`, { estado, motivo_cancelacion });
};

// ─── BUSCAR PACIENTE POR CI ───────────────────────────────────
export const buscarPacientePorCIService = async (
  ci: string,
): Promise<Paciente> => {
  const res = await api.get("/pacientes/buscar", { params: { ci } });
  return res.data;
};

// ─── REGISTRAR PACIENTE DESDE RECEPCIÓN ──────────────────────
export const registrarPacienteService = async (data: {
  primer_nombre: string;
  apellido_pat: string;
  apellido_mat?: string;
  ci: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_nac?: string;
  nom_usuario: string;
  contrasena: string;
}): Promise<{ mensaje: string }> => {
  const res = await api.post("/pacientes", data);
  return res.data;
};

// ─── TODAS LAS CITAS (vista general + reprogramar/cancelar) ──
export const getTodasLasCitasService = async (filtros?: {
  desde?: string;
  hasta?: string;
  estado?: string;
}): Promise<CitaAdmin[]> => {
  const res = await api.get("/citas/todas", { params: filtros });
  return res.data;
};

export const getCitasProgramadasService = async (): Promise<CitaAdmin[]> => {
  return getTodasLasCitasService({ estado: "programada" });
};

// ─── ESPECIALIDADES Y HORARIOS (para agendar) ────────────────
export const getHorariosPorEspecialidadService = async (
  id_especialidad: number,
): Promise<Horario[]> => {
  const res = await api.get("/admin/horarios");
  return res.data.filter(
    (h: Horario) => h.id_especialidad === id_especialidad && h.activo,
  );
};

export const getDisponibilidadService = async (
  id_horario: number,
  fecha: string,
): Promise<SlotDisponible[]> => {
  const res = await api.get("/citas/disponibilidad", {
    params: { id_horario, fecha },
  });
  return res.data;
};

// ─── AGENDAR CITA A NOMBRE DE UN PACIENTE ────────────────────
export const agendarCitaParaPacienteService = async (data: {
  id_paciente: number;
  id_horario: number;
  fecha: string;
  hora: string;
  motivo?: string;
}): Promise<void> => {
  await api.post("/citas", data);
};

// ─── REPROGRAMAR CITA ─────────────────────────────────────────
export const reprogramarCitaService = async (
  id_cita: number,
  data: {
    id_horario: number;
    fecha: string;
    hora: string;
    motivo_cambio?: string;
  },
): Promise<void> => {
  await api.put(`/citas/${id_cita}/reprogramar`, data);
};

// ─── CANCELAR CITA ─────────────────────────────────────────────
export const cancelarCitaService = async (
  id_cita: number,
  motivo_cancelacion: string,
): Promise<void> => {
  await api.patch(`/citas/${id_cita}/estado`, {
    estado: "cancelada",
    motivo_cancelacion,
  });
};

// ─── GESTIÓN DE HORARIOS (igual que admin) ───────────────────
export const getHorariosService = async (): Promise<Horario[]> => {
  const res = await api.get("/admin/horarios");
  return res.data;
};

export const crearHorarioService = async (data: {
  id_personal: number;
  id_especialidad: number;
  hora_inicio_manana?: string;
  hora_fin_manana?: string;
  hora_inicio_tarde?: string;
  hora_fin_tarde?: string;
  duracion_cita_min: number;
  dias: number[];
}): Promise<void> => {
  await api.post("/admin/horarios", data);
};

export const editarHorarioService = async (
  id: number,
  data: Partial<Horario & { dias: number[] }>,
): Promise<void> => {
  await api.put(`/admin/horarios/${id}`, data);
};

export const eliminarHorarioService = async (id: number): Promise<void> => {
  await api.delete(`/admin/horarios/${id}`);
};