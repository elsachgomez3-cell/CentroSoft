import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout         from '../../layouts/DashboardLayout'
import AuxiliarHorarios        from './AuxiliarHorarios'
import AuxiliarCitas           from './AuxiliarCitas'
import AuxiliarNotificaciones  from './AuxiliarNotificaciones'
import AuxiliarPerfil          from './AuxiliarPerfil'

const AuxiliarDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="horarios" replace />} />
        <Route path="horarios"      element={<AuxiliarHorarios />} />
        <Route path="citas"         element={<AuxiliarCitas />} />
        <Route path="notificaciones" element={<AuxiliarNotificaciones />} />
        <Route path="configuracion" element={<AuxiliarPerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default AuxiliarDashboard