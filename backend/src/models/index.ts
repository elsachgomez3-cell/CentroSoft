// ============================================================
// TIPOS CENTRALES DE CENTROSOFT
// Estos tipos representan exactamente las tablas de la BD.
// Se usan en controllers, services y repositories.
// ============================================================


// ─── ENUMs ──────────────────────────────────────────────────
// Deben coincidir exactamente con los ENUMs de PostgreSQL

export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

export type EstadoCita =
  | 'programada'
  | 'en_espera'
  | 'atendida'
  | 'cancelada'
  | 'inasistente';

export type TipoNotificacion =
  | 'cita_agendada'
  | 'cita_cancelada'
  | 'cita_reprogramada'
  | 'recordatorio'
  | 'sistema';


// ─── ENTIDADES PRINCIPALES ──────────────────────────────────

export interface Rol {
  id_rol:      number;
  nombre:      string;
  descripcion: string | null;
}

export interface Usuario {
  id_usuario:      number;
  id_rol:          number;
  nom_usuario:     string;
  contrasena_hash: string;
  estado:          EstadoUsuario;
  fecha_creacion:  Date;
  ultimo_acceso:   Date | null;
}

export interface Personal {
  id_personal:    number;
  id_usuario:     number;
  primer_nombre:  string;
  apellido_pat:   string;
  apellido_mat:   string | null;
  email:          string | null;
  telefono:       string | null;
  foto_url:       string | null;
  fecha_creacion: Date;
}

export interface Paciente {
  id_paciente:    number;
  id_usuario:     number;
  primer_nombre:  string;
  apellido_pat:   string;
  apellido_mat:   string | null;
  ci:             string | null;
  email:          string | null;
  telefono:       string | null;
  direccion:      string | null;
  fecha_nac:      Date | null;
  foto_url:       string | null;
  fecha_registro: Date;
}

export interface Especialidad {
  id_especialidad: number;
  nombre:          string;
  descripcion:     string | null;
  activa:          boolean;
}

export interface Horario {
  id_horario:           number;
  id_personal:          number;
  id_especialidad:      number;
  hora_inicio_manana:   string | null;
  hora_fin_manana:      string | null;
  hora_inicio_tarde:    string | null;
  hora_fin_tarde:       string | null;
  duracion_cita_min:    number;
  activo:               boolean;
}

export interface HorarioDetalle {
  id_horario_det: number;
  id_horario:     number;
  dia_semana:     number; // 0=Lunes ... 6=Domingo
}

export interface Cita {
  id_cita:            number;
  id_paciente:        number;
  id_horario:         number;
  fecha:              Date;
  hora:               string;
  motivo:             string | null;
  estado:             EstadoCita;
  motivo_cancelacion: string | null;
  fecha_creacion:     Date;
}

export interface Notificacion {
  id_notificacion: number;
  id_usuario:      number;
  id_cita:         number | null;
  titulo:          string;
  mensaje:         string;
  tipo:            TipoNotificacion;
  leida:           boolean;
  fecha_envio:     Date;
}

export interface HistorialCita {
  id_historial:     number;
  id_cita:          number;
  id_usuario_resp:  number;
  fecha_anterior:   Date | null;
  hora_anterior:    string | null;
  fecha_nueva:      Date | null;
  hora_nueva:       string | null;
  estado_anterior:  EstadoCita | null;
  estado_nuevo:     EstadoCita | null;
  motivo_cambio:    string | null;
  fecha_cambio:     Date;
}


// ─── TIPOS PARA RESPUESTAS DEL API ──────────────────────────
// Estos no son tablas — son los objetos que el backend
// devuelve al frontend, que combinan datos de varias tablas.

// Lo que devuelve el login exitoso
export interface LoginResponse {
  token:   string;
  usuario: {
    id_usuario:  number;
    nom_usuario: string;
    rol:         string;
    nombre:      string; // primer_nombre + apellido_pat
    foto_url:    string | null;
  };
}

// Cita con toda la información legible (para mostrar en tablas)
export interface CitaDetalle {
  id_cita:            number;
  fecha:              Date;
  hora:               string;
  motivo:             string | null;
  estado:             EstadoCita;
  motivo_cancelacion: string | null;
  // Datos del paciente
  paciente_nombre:    string;
  paciente_ci:        string | null;
  paciente_telefono:  string | null;
  // Datos del médico
  medico_nombre:      string;
  especialidad:       string;
}

// Médico con sus especialidades (para listas del admin)
export interface PersonalConRol {
  id_personal:   number;
  nombre:        string;
  email:         string | null;
  telefono:      string | null;
  rol:           string;
  estado:        EstadoUsuario;
  especialidades: string[];
}

// Slot de tiempo disponible para agendar una cita
export interface SlotDisponible {
  hora:         string;
  disponible:   boolean;
  id_horario:   number;
  medico_nombre: string;
}


// ─── TIPOS PARA ENTRADAS DEL API ────────────────────────────
// Lo que el frontend envía al backend en cada petición.

export interface LoginInput {
  nom_usuario: string;
  contrasena:  string;
}

export interface RegistroPacienteInput {
  primer_nombre: string;
  apellido_pat:  string;
  apellido_mat?: string;
  ci:            string;
  email:         string;
  telefono?:     string;
  direccion?:    string;
  fecha_nac?:    string;
  nom_usuario:   string;
  contrasena:    string;
}

export interface CrearCitaInput {
  id_horario:  number;
  fecha:       string; // formato YYYY-MM-DD
  hora:        string; // formato HH:MM
  motivo?:     string;
}

export interface ReprogramarCitaInput {
  id_horario: number;
  fecha:      string;
  hora:       string;
  motivo_cambio?: string;
}

export interface CambiarEstadoCitaInput {
  estado:             EstadoCita;
  motivo_cancelacion?: string;
}

export interface CrearPersonalInput {
  primer_nombre: string;
  apellido_pat:  string;
  apellido_mat?: string;
  email?:        string;
  telefono?:     string;
  nom_usuario:   string;
  contrasena:    string;
  id_rol:        number;
}