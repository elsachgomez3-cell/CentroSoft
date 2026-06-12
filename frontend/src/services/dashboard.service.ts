import api from './api'

export interface KPIs {
  citasHoy: {
    total:        string
    programadas:  string
    en_espera:    string
    atendidas:    string
    canceladas:   string
    inasistentes: string
  }
  totales: {
    pacientes_activos:  string
    personal_activo:    string
    mensajes_no_leidos: string
    citas_hoy:          string
  }
  citasSemana: {
    dia:       string
    total:     string
    atendidas: string
    canceladas:string
  }[]
  proximasCitas: {
    hora:         string
    paciente:     string
    medico:       string
    especialidad: string
    estado:       string
  }[]
  actividadReciente: {
    tabla_afectada: string
    accion:         string
    nombre_usuario: string
    id_registro:    number | null
    fecha:          string
    detalle:        string
  }[]
  usuariosActivos: {
    nom_usuario:   string
    rol:           string
    ultimo_acceso: string
  }[]
};
export const getKPIsService = async (): Promise<KPIs> => {
  const res = await api.get('/dashboard/kpis')
  return res.data
};