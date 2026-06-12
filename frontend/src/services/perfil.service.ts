import api from './api'

export interface PerfilPaciente {
  id_paciente:    number
  primer_nombre:  string
  apellido_pat:   string
  apellido_mat:   string | null
  ci:             string | null
  email:          string | null
  telefono:       string | null
  direccion:      string | null
  fecha_nac:      string | null
  edad:           number | null
  nom_usuario:    string
  estado:         string
}

export const getMiPerfilService = async (): Promise<{
  tipo:  string
  datos: PerfilPaciente
}> => {
  const res = await api.get('/auth/perfil')
  return res.data
}

export const cambiarContrasenaService = async (data: {
  contrasena_actual: string
  contrasena_nueva:  string
}): Promise<{ mensaje: string }> => {
  const res = await api.post('/auth/cambiar-contrasena', data)
  return res.data
}