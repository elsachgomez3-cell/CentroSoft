import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute'

// Páginas de autenticación
import LoginPage    from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'

// Dashboards por rol
import AdminDashboard    from '../pages/admin/AdminDashboard'
import PacienteDashboard from '../pages/paciente/PacienteDashboard'
import MedicoDashboard   from '../pages/medico/MedicoDashboard'
import GerenteDashboard  from '../pages/gerente/GerenteDashboard'

// Página de acceso denegado
import SinAcceso from '../pages/auth/SinAcceso'
import HomePage from '../pages/auth/HomePage'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta raíz redirige al login */}
      <Route path="/"      element={<HomePage />} />

      {/* Rutas públicas */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sin-acceso" element={<SinAcceso />} />

      {/* Rutas protegidas por rol */}
      <Route path="/admin/*" element={
        <ProtectedRoute rolesPermitidos={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/paciente/*" element={
        <ProtectedRoute rolesPermitidos={['paciente']}>
          <PacienteDashboard />
        </ProtectedRoute>
      } />

      <Route path="/medico/*" element={
        <ProtectedRoute rolesPermitidos={['medico']}>
          <MedicoDashboard />
        </ProtectedRoute>
      } />

      <Route path="/gerente/*" element={
        <ProtectedRoute rolesPermitidos={['gerente']}>
          <GerenteDashboard />
        </ProtectedRoute>
      } />

      {/* Cualquier ruta no encontrada redirige al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes