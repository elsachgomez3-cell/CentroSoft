// ─── Tipos de datos que vienen del backend ───────────────────

export type EstadoCita =
  | 'programada'
  | 'en_espera'
  | 'atendida'
  | 'cancelada'
  | 'inasistente'

export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido'

// Lo que devuelve el login
export interface LoginResponse {
  token: string
  usuario: {
    id_usuario:  number
    nom_usuario: string
    rol:         string
    nombre:      string
    foto_url:    string | null
  }
}

// Usuario guardado en el contexto de la app
export interface UsuarioAutenticado {
  id_usuario:  number
  nom_usuario: string
  rol:         string
  nombre:      string
  foto_url:    string | null
}

export interface Especialidad {
  id_especialidad: number
  nombre:          string
  descripcion:     string | null
  activa:          boolean
}

export interface Personal {
  id_personal:    number
  nombre:         string
  primer_nombre:  string
  apellido_pat:   string
  apellido_mat:   string | null
  email:          string | null
  telefono:       string | null
  rol:            string
  estado:         EstadoUsuario
  especialidades: string
}

export interface Paciente {
  id_paciente:    number
  nombre:         string
  primer_nombre:  string
  apellido_pat:   string
  apellido_mat:   string | null
  ci:             string | null
  email:          string | null
  telefono:       string | null
  direccion:      string | null
  fecha_nac:      string | null
  edad:           number | null
  estado:         EstadoUsuario
}

export interface Horario {
  id_horario:           number
  id_personal:          number
  medico:               string
  id_especialidad:      number
  especialidad:         string
  hora_inicio_manana:   string | null
  hora_fin_manana:      string | null
  hora_inicio_tarde:    string | null
  hora_fin_tarde:       string | null
  duracion_cita_min:    number
  activo:               boolean
  dias:                 number[]
}

export interface CitaDetalle {
  id_cita:            number
  fecha:              string
  hora:               string
  motivo:             string | null
  estado:             EstadoCita
  motivo_cancelacion: string | null
  paciente:           string
  medico:             string
  especialidad:       string
}

// Cita de la agenda del médico — incluye datos del paciente
export interface AgendaCita {
  id_cita:            number
  fecha:              string
  hora:               string
  motivo:             string | null
  estado:             EstadoCita
  paciente:           string
  paciente_ci:        string | null
  paciente_telefono:  string | null
  paciente_fecha_nac: string | null
  paciente_edad:      number | null
  especialidad:       string
}

export interface SlotDisponible {
  hora:       string
  disponible: boolean
}

// Para los reportes del gerente
export interface ReporteCitas {
  totales: {
    total:        string
    atendidas:    string
    canceladas:   string
    inasistentes: string
    programadas:  string
    en_espera:    string
  }
  detalle: CitaDetalle[]
}

export interface ReporteDoctor {
  id_personal:              number
  nombre:                   string
  total_citas:              string
  atendidas:                string
  inasistentes:             string
  canceladas:               string
  porcentaje_rendimiento:   string
  porcentaje_inasistencia:  string
}

export interface ReporteEdad {
  rango:      string
  categoria:  string
  cantidad:   string
  porcentaje: string
}

export interface ReporteEspecialidad {
  id_especialidad:  number
  especialidad:     string
  cantidad:         string
  doctores_activos: string
  porcentaje:       string
}