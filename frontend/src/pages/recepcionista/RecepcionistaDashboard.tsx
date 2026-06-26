import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout         from '../../layouts/DashboardLayout'
import RecepcionistaHoy        from './RecepcionistaHoy'
import RecepcionistaPacientes  from './RecepcionistaPacientes'
import RecepcionistaAgendar    from './RecepcionistaAgendar'
import RecepcionistaReprogramar from './RecepcionistaReprogramar'
import RecepcionistaCancelar   from './RecepcionistaCancelar'
import RecepcionistaHorarios   from './RecepcionistaHorarios'
import RecepcionistaPerfil     from './RecepcionistaPerfil'

const RecepcionistaDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="hoy" replace />} />
        <Route path="hoy"            element={<RecepcionistaHoy />} />
        <Route path="pacientes"      element={<RecepcionistaPacientes />} />
        <Route path="agendar"        element={<RecepcionistaAgendar />} />
        <Route path="reprogramar"    element={<RecepcionistaReprogramar />} />
        <Route path="cancelar"       element={<RecepcionistaCancelar />} />
        <Route path="horarios"       element={<RecepcionistaHorarios />} />
        <Route path="configuracion"  element={<RecepcionistaPerfil />} />
      </Routes>
    </DashboardLayout>
  )
}

export default RecepcionistaDashboard