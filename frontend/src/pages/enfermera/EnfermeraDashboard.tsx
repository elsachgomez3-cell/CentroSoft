import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout        from '../../layouts/DashboardLayout'
import EnfermeraEspera        from './EnfermeraEspera'
import EnfermeraAgenda        from './EnfermeraAgenda'
import EnfermeraNotificaciones from './EnfermeraNotificaciones'
import EnfermeraPerfil        from './EnfermeraPerfil'

const EnfermeraDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="espera" replace />} />
        <Route path="espera"        element={<EnfermeraEspera />} />
        <Route path="agenda"        element={<EnfermeraAgenda />} />
        <Route path="notificaciones" element={<EnfermeraNotificaciones />} />
        <Route path="configuracion" element={<EnfermeraPerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default EnfermeraDashboard