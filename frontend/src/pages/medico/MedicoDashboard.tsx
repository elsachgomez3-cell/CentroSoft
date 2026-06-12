import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout    from '../../layouts/DashboardLayout'
import MedicoAgenda       from './MedicoAgenda'
import MedicoAtencion     from './MedicoAtencion'
import MedicoNotificaciones from './MedicoNotificaciones'
import MedicoPerfil       from './MedicoPerfil'

const MedicoDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="agenda" replace />} />
        <Route path="agenda"          element={<MedicoAgenda />} />
        <Route path="atencion"        element={<MedicoAtencion />} />
        <Route path="notificaciones"  element={<MedicoNotificaciones />} />
        <Route path="configuracion"   element={<MedicoPerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default MedicoDashboard