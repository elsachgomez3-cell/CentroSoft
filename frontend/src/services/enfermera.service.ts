import api from "./api";

// ─── CITAS DE HOY (lista de espera + agenda) ──────────────────
// Reutiliza el mismo endpoint que usa recepcionista (GET /citas/hoy)
export interface CitaHoyEnfermera {
  id_cita: number;
  fecha: string;
  hora: string;
  motivo: string | null;
  estado: string;
  paciente: string;
  paciente_ci: string | null;
  paciente_telefono: string | null;
  paciente_edad: number | null;
  medico: string;
  especialidad: string;
}

export const getCitasHoyService = async (): Promise<CitaHoyEnfermera[]> => {
  const res = await api.get("/citas/hoy");
  return res.data;
};