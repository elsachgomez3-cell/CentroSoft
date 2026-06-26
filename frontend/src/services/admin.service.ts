import api from "./api";
import type { Personal, Paciente, Especialidad, Horario } from "../types";

// ─── PERSONAL ────────────────────────────────────────────────
export const getPersonalService = async (): Promise<Personal[]> => {
  const res = await api.get("/admin/personal");
  return res.data;
};

export const crearPersonalService = async (data: {
  primer_nombre: string;
  apellido_pat: string;
  apellido_mat?: string;
  email?: string;
  telefono?: string;
  nom_usuario: string;
  contrasena: string;
  id_rol: number;
}): Promise<void> => {
  await api.post("/admin/personal", data);
};

export const editarPersonalService = async (
  id: number,
  data: Partial<
    Personal & {
      estado: string;
      nom_usuario: string;
      contrasena: string;
      id_rol: number;
    }
  >,
): Promise<void> => {
  await api.put(`/admin/personal/${id}`, data);
};

export const eliminarPersonalService = async (id: number): Promise<void> => {
  await api.delete(`/admin/personal/${id}`);
};

// ─── PACIENTES ───────────────────────────────────────────────
export const getPacientesService = async (): Promise<Paciente[]> => {
  const res = await api.get("/admin/pacientes");
  return res.data;
};

export const editarPacienteService = async (
  id: number,
  data: Partial<
    Paciente & {
      nom_usuario: string;
      contrasena: string;
    }
  >,
): Promise<void> => {
  await api.put(`/admin/pacientes/${id}`, data);
};

export const eliminarPacienteService = async (id: number): Promise<void> => {
  await api.delete(`/admin/pacientes/${id}`);
};

// ─── ESPECIALIDADES ──────────────────────────────────────────
export const getEspecialidadesService = async (): Promise<Especialidad[]> => {
  const res = await api.get("/admin/especialidades");
  return res.data;
};

export const crearEspecialidadService = async (data: {
  nombre: string;
  descripcion?: string;
}): Promise<void> => {
  await api.post("/admin/especialidades", data);
};

export const editarEspecialidadService = async (
  id: number,
  data: { nombre?: string; descripcion?: string; activa?: boolean },
): Promise<void> => {
  await api.put(`/admin/especialidades/${id}`, data);
};

export const eliminarEspecialidadService = async (
  id: number,
): Promise<void> => {
  await api.delete(`/admin/especialidades/${id}`);
};

// ─── HORARIOS ────────────────────────────────────────────────
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

// ─── ROLES ───────────────────────────────────────────────────
export const getRolesService = async (): Promise<
  { id_rol: number; nombre: string }[]
> => {
  const res = await api.get("/admin/roles");
  return res.data;
};
// ─── MENSAJES DE CONTACTO ────────────────────────────────────
export interface MensajeContacto {
  id_mensaje: number;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  leido: boolean;
  correo_enviado: boolean;
  fecha_envio: string;
}

export const getMensajesService = async (): Promise<MensajeContacto[]> => {
  const res = await api.get("/contacto/admin");
  return res.data;
};

export const marcarMensajeLeidoService = async (id: number): Promise<void> => {
  await api.patch(`/contacto/admin/${id}/leer`);
};

// ─── CITAS ADMIN ─────────────────────────────────────────────
export interface CitaAdmin {
  id_cita: number;
  id_horario: number;
  id_paciente: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo: string | null;
  paciente: string;
  paciente_ci: string | null;
  medico: string;
  especialidad: string;
}

export const getCitasAdminService = async (filtros?: {
  desde?: string;
  hasta?: string;
  estado?: string;
}): Promise<CitaAdmin[]> => {
  const res = await api.get("/citas/todas", { params: filtros });
  return res.data;
};

export const cambiarEstadoCitaAdminService = async (
  id: number,
  estado: string,
  motivo_cancelacion?: string,
): Promise<void> => {
  await api.patch(`/citas/${id}/estado`, { estado, motivo_cancelacion });
};

export const eliminarCitaAdminService = async (id: number): Promise<void> => {
  await api.patch(`/citas/${id}/estado`, {
    estado: "cancelada",
    motivo_cancelacion: "Cancelada por administrador",
  });
};
