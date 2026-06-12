import axios from 'axios'

// URL base del backend
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de petición:
// Antes de enviar cualquier petición, agrega el token JWT
// automáticamente si existe en localStorage.
// Así no tienes que agregarlo manualmente en cada llamada.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de respuesta:
// Si el backend devuelve 401 (token expirado o inválido),
// limpia el localStorage y redirige al login automáticamente.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api