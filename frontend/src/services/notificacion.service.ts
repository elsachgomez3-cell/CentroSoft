import api from "./api";

export interface Notificacion {
  id_notificacion: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_envio: string;
  id_cita: number | null;
}

export const getMisNotificacionesService = async (): Promise<
  Notificacion[]
> => {
  const res = await api.get("/notificaciones");
  return res.data;
};

export const marcarLeidaService = async (id: number): Promise<void> => {
  await api.patch(`/notificaciones/${id}/leer`);
  // Disparar evento para actualizar contador inmediatamente
  window.dispatchEvent(new CustomEvent("notif-leida"));
};

export const marcarTodasLeidasService = async (): Promise<void> => {
  await api.patch("/notificaciones/leer-todas");
  // Disparar evento para actualizar contador inmediatamente
  window.dispatchEvent(new CustomEvent("notif-leida"));
};
