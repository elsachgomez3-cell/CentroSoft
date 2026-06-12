import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children:        React.ReactNode
  rolesPermitidos: string[]
}

const ProtectedRoute = ({ children, rolesPermitidos }: Props) => {
  const { estaAutenticado, rol, cargando } = useAuth()

  // Mientras verifica si hay sesión guardada, no renderiza nada
  if (cargando) {
    return (
      <div className="d-flex justify-content-center
                       align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  // Si no está autenticado, va al login
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  // Si no tiene el rol correcto, va a una página de acceso denegado
  if (rol && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/sin-acceso" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute