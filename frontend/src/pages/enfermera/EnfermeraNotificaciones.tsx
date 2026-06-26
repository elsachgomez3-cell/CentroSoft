import PacienteNotificaciones from '../paciente/PacienteNotificaciones'

// Las notificaciones funcionan igual para todos los roles
// El backend filtra por id_usuario automáticamente
const EnfermeraNotificaciones = () => <PacienteNotificaciones />

export default EnfermeraNotificaciones