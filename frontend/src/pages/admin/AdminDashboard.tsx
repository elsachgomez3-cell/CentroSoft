import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import AdminDashboardHome from "./AdminDashboardHome";
import AdminUsuarios from "./AdminUsuarios";
import AdminMedica from "./AdminMedica";
import AdminCitas from "./AdminCitas";
import AdminPerfil from "./AdminPerfil";
import AdminNotificaciones from './AdminNotificaciones'
import AdminAuditoria    from './AdminAuditoria'

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        {/* Ruta por defecto del admin */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardHome />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="medica" element={<AdminMedica />} />
        <Route path="citas" element={<AdminCitas />} />
        <Route path="configuracion" element={<AdminPerfil />} />
        <Route path="auditoria" element={<AdminAuditoria />} />
        <Route path="notificaciones" element={<AdminNotificaciones />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
