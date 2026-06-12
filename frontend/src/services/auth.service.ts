import api from './api'
import type { LoginResponse } from '../types'

export const loginService = async (
  nom_usuario: string,
  contrasena:  string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', {
    nom_usuario,
    contrasena
  })
  return response.data
}

export const registrarPacienteService = async (data: {
  primer_nombre: string
  apellido_pat:  string
  apellido_mat?: string
  ci:            string
  email:         string
  telefono?:     string
  direccion?:    string
  fecha_nac?:    string
  nom_usuario:   string
  contrasena:    string
}): Promise<{ mensaje: string }> => {
  const response = await api.post('/auth/register', data)
  return response.data
}