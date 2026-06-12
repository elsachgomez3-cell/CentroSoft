import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout    from '../../layouts/DashboardLayout'
import GerenteReportes    from './GerenteReportes'
import GerenteListados    from './GerenteListados'
import GerentePerfil      from './GerentePerfil'

const GerenteDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="reportes" replace />} />
        <Route path="reportes"      element={<GerenteReportes />} />
        <Route path="listados"      element={<GerenteListados />} />
        <Route path="configuracion" element={<GerentePerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default GerenteDashboard