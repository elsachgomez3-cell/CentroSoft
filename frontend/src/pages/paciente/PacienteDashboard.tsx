import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout      from '../../layouts/DashboardLayout'
import PacienteCitas        from './PacienteCitas'
import PacienteHistorial    from './PacienteHistorial'
import PacientePerfil       from './PacientePerfil'
import PacienteContacto     from './PacienteContacto'
import PacienteNotificaciones from './PacienteNotificaciones'

const PacienteDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="citas" replace />} />
        <Route path="citas"           element={<PacienteCitas />} />
        <Route path="historial"       element={<PacienteHistorial />} />
        <Route path="notificaciones"  element={<PacienteNotificaciones />} />
        <Route path="contacto"        element={<PacienteContacto />} />
        <Route path="configuracion"   element={<PacientePerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default PacienteDashboard