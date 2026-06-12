import { useState, useEffect } from 'react'
import type { UsuarioAutenticado } from '../types'

export const useAuth = () => {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Al cargar la app, verifica si hay sesión guardada
    const usuarioGuardado = localStorage.getItem('usuario')
    const token = localStorage.getItem('token')

    if (usuarioGuardado && token) {
      try {
        setUsuario(JSON.parse(usuarioGuardado))
      } catch {
        localStorage.removeItem('usuario')
        localStorage.removeItem('token')
      }
    }
    setCargando(false)
  }, [])

  const login = (token: string, usuarioData: UsuarioAutenticado) => {
    localStorage.setItem('token',   token)
    localStorage.setItem('usuario', JSON.stringify(usuarioData))
    setUsuario(usuarioData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  const estaAutenticado = !!usuario
  const rol = usuario?.rol || null

  return { usuario, cargando, login, logout, estaAutenticado, rol }
}