import { useState, useEffect } from "react";
import api from "../services/api";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.png";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlinePhone,
  HiOutlinePlusCircle,
  HiOutlineRefresh,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineClipboard,
  HiOutlineChartBar,
  HiOutlineUserCircle,
  HiOutlineLogout,
  HiOutlineMenuAlt2,
  HiOutlineChevronLeft,
  HiOutlineExclamation,
} from "react-icons/hi";

// ── Tipos ──────────────────────────────────────────────────────────────────
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// ── Mapa de íconos react-icons por módulo ──────────────────────────────────
const menusPorRol: Record<string, MenuItem[]> = {
  admin: [
    { label: "Dashboard",          path: "/admin/dashboard",      icon: <HiOutlineHome /> },
    { label: "Gestión de usuarios",path: "/admin/usuarios",       icon: <HiOutlineUsers /> },
    { label: "Gestión médica",     path: "/admin/medica",         icon: <HiOutlineUserCircle /> },
    { label: "Gestión de citas",   path: "/admin/citas",          icon: <HiOutlineCalendar /> },
    { label: "Notificaciones",     path: "/admin/notificaciones", icon: <HiOutlineBell /> },
    { label: "Auditoría",          path: "/admin/auditoria",      icon: <HiOutlineSearch /> },
    { label: "Configuración",      path: "/admin/configuracion",  icon: <HiOutlineCog /> },
  ],
  paciente: [
    { label: "Mis citas",          path: "/paciente/citas",          icon: <HiOutlineCalendar /> },
    { label: "Mi historial",       path: "/paciente/historial",      icon: <HiOutlineClipboardList /> },
    { label: "Notificaciones",     path: "/paciente/notificaciones", icon: <HiOutlineBell /> },
    { label: "Contacto",           path: "/paciente/contacto",       icon: <HiOutlinePhone /> },
    { label: "Configuración",      path: "/paciente/configuracion",  icon: <HiOutlineCog /> },
  ],
  medico: [
    { label: "Mi agenda",          path: "/medico/agenda",          icon: <HiOutlineCalendar /> },
    { label: "Atención",           path: "/medico/atencion",        icon: <HiOutlineClipboard /> },
    { label: "Notificaciones",     path: "/medico/notificaciones",  icon: <HiOutlineBell /> },
    { label: "Configuración",      path: "/medico/configuracion",   icon: <HiOutlineCog /> },
  ],
  gerente: [
    { label: "Reportes",           path: "/gerente/reportes",       icon: <HiOutlineChartBar /> },
    { label: "Ver listados",       path: "/gerente/listados",       icon: <HiOutlineClipboardList /> },
    { label: "Configuración",      path: "/gerente/configuracion",  icon: <HiOutlineCog /> },
  ],
  recepcionista: [
    { label: "Citas de hoy",        path: "/recepcionista/hoy",          icon: <HiOutlineCalendar /> },
    { label: "Gestión de pacientes",path: "/recepcionista/pacientes",     icon: <HiOutlineUsers /> },
    { label: "Agendar citas",       path: "/recepcionista/agendar",      icon: <HiOutlinePlusCircle /> },
    { label: "Reprogramar cita",    path: "/recepcionista/reprogramar",  icon: <HiOutlineRefresh /> },
    { label: "Cancelar cita",       path: "/recepcionista/cancelar",     icon: <HiOutlineXCircle /> },
    { label: "Gestión de horarios", path: "/recepcionista/horarios",     icon: <HiOutlineClock /> },
    { label: "Configuración",       path: "/recepcionista/configuracion",icon: <HiOutlineCog /> },
  ],
  enfermera: [
    { label: "Listado de espera",  path: "/enfermera/espera",         icon: <HiOutlineClipboardList /> },
    { label: "Ver agenda",         path: "/enfermera/agenda",         icon: <HiOutlineCalendar /> },
    { label: "Notificaciones",     path: "/enfermera/notificaciones", icon: <HiOutlineBell /> },
    { label: "Configuración",      path: "/enfermera/configuracion",  icon: <HiOutlineCog /> },
  ],
  auxiliar: [
    { label: "Ver horarios",       path: "/auxiliar/horarios",        icon: <HiOutlineClock /> },
    { label: "Citas disponibles",  path: "/auxiliar/citas",           icon: <HiOutlineCalendar /> },
    { label: "Notificaciones",     path: "/auxiliar/notificaciones",  icon: <HiOutlineBell /> },
    { label: "Configuración",      path: "/auxiliar/configuracion",   icon: <HiOutlineCog /> },
  ],
};

// ── Badge de rol (colores por rol del design guide) ────────────────────────
const rolBadgeStyle: Record<string, React.CSSProperties> = {
  admin:         { backgroundColor: '#F3E5F5', color: '#6A1B9A' },
  paciente:      { backgroundColor: '#E0F7FC', color: '#0B85A3' },
  medico:        { backgroundColor: '#EDE7F6', color: '#4527A0' },
  gerente:       { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  recepcionista: { backgroundColor: '#FFF8E1', color: '#F57F17' },
  enfermera:     { backgroundColor: '#FFEBEE', color: '#C62828' },
  auxiliar:      { backgroundColor: '#F0F4F8', color: '#4A6275' },
}

// ── Avatar con iniciales ───────────────────────────────────────────────────
const Avatar = ({ nombre, size = 36 }: { nombre?: string; size?: number }) => {
  const iniciales = nombre
    ? nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #0EA5C8, #1A4B6B)',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
      fontFamily: "'Inter', sans-serif",
    }}>
      {iniciales}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [notifNoLeidas, setNotifNoLeidas]   = useState(0);
  const [showConfirm, setShowConfirm]       = useState(false);

  // Consulta notificaciones no leídas cada 30 segundos
  useEffect(() => {
    const cargarNotif = async () => {
      try {
        const res = await api.get("/notificaciones");
        const noLeidas = res.data.filter((n: any) => !n.leida).length;
        setNotifNoLeidas(noLeidas);
      } catch {
        // Si falla no interrumpimos el layout
      }
    };

    cargarNotif();
    const intervalo = setInterval(cargarNotif, 30000);
    window.addEventListener("notif-leida", cargarNotif);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("notif-leida", cargarNotif);
    };
  }, []);

  const menuItems = menusPorRol[usuario?.rol || ""] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const rol = usuario?.rol || ''
  const badgeStyle = rolBadgeStyle[rol] || rolBadgeStyle['auxiliar']

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{
        width: sidebarAbierto ? '240px' : '64px',
        minHeight: '100vh',
        backgroundColor: '#0F2F45',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

        {/* Logo + botón colapsar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarAbierto ? 'space-between' : 'center',
          padding: '0 16px',
          height: '60px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          {sidebarAbierto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <img src={logo} alt="CentroSoft" style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                Centro<span style={{ color: '#0EA5C8' }}>Soft</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#8FA3B1', padding: '6px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8FA3B1'; e.currentTarget.style.background = 'none' }}
          >
            {sidebarAbierto
              ? <HiOutlineChevronLeft style={{ fontSize: '18px' }} />
              : <HiOutlineMenuAlt2   style={{ fontSize: '18px' }} />
            }
          </button>
        </div>

        {/* Info del usuario */}
        {sidebarAbierto && (
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: '10px',
            flexShrink: 0,
          }}>
            <Avatar nombre={usuario?.nombre} size={36} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: '#fff', fontWeight: 600, fontSize: '13px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {usuario?.nombre}
              </div>
              <div style={{
                fontSize: '11px', color: '#8FA3B1',
                textTransform: 'capitalize', marginTop: '2px',
              }}>
                {usuario?.rol}
              </div>
            </div>
          </div>
        )}

        {/* Avatar colapsado */}
        {!sidebarAbierto && (
          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <Avatar nombre={usuario?.nombre} size={32} />
          </div>
        )}

        {/* Ítems del menú */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: sidebarAbierto ? '10px 16px' : '12px 0',
                justifyContent: sidebarAbierto ? 'flex-start' : 'center',
                color: isActive ? '#FFFFFF' : '#8FA3B1',
                backgroundColor: isActive ? 'rgba(14, 165, 200, 0.15)' : 'transparent',
                textDecoration: 'none',
                fontSize: '13.5px',
                borderLeft: isActive ? '3px solid #0EA5C8' : '3px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.borderLeftColor.includes('0EA5C8'))
                  el.style.backgroundColor = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.borderLeftColor.includes('0EA5C8'))
                  el.style.backgroundColor = 'transparent'
              }}
            >
              {/* Ícono */}
              <span style={{ fontSize: '18px', flexShrink: 0, display: 'flex' }}>
                {item.icon}
              </span>

              {/* Label */}
              {sidebarAbierto && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {item.label}
                </span>
              )}

              {/* Badge notificaciones — expandido */}
              {sidebarAbierto && item.path.includes('notificaciones') && notifNoLeidas > 0 && (
                <span style={{
                  backgroundColor: '#C62828',
                  color: '#fff',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}>
                  {notifNoLeidas}
                </span>
              )}

              {/* Badge notificaciones — colapsado */}
              {!sidebarAbierto && item.path.includes('notificaciones') && notifNoLeidas > 0 && (
                <span style={{
                  backgroundColor: '#C62828',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '9px',
                  fontWeight: 700,
                  width: '14px',
                  height: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                }}>
                  {notifNoLeidas > 9 ? '9+' : notifNoLeidas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Botón cerrar sesión */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            onClick={() => setShowConfirm(true)}
            title="Cerrar sesión"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarAbierto ? 'flex-start' : 'center',
              gap: '8px',
              padding: sidebarAbierto ? '9px 12px' : '9px 0',
              backgroundColor: 'rgba(198, 40, 40, 0.12)',
              color: '#ef9a9a',
              border: '1px solid rgba(198, 40, 40, 0.25)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(198,40,40,0.22)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(198,40,40,0.12)'
              e.currentTarget.style.color = '#ef9a9a'
            }}
          >
            <HiOutlineLogout style={{ fontSize: '18px', flexShrink: 0 }} />
            {sidebarAbierto && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* ── Área de contenido ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Navbar superior */}
        <div style={{
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #D1E3EE',
          boxShadow: '0 1px 3px rgba(15, 47, 69, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#8FA3B1', letterSpacing: '0.06em' }}>
            CENTROSOFT
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Badge de rol */}
            <span style={{
              ...badgeStyle,
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {rol}
            </span>

            {/* Nombre + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#4A6275', fontWeight: 500 }}>
                {usuario?.nombre}
              </span>
              <Avatar nombre={usuario?.nombre} size={30} />
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <div style={{ flex: 1, padding: '24px', backgroundColor: '#F0F4F8', minWidth: 0 }}>
          {children}
        </div>
      </div>

      {/* ── Modal confirmación logout ──────────────────────────────────────── */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(15, 47, 69, 0.5)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: '0 20px 60px rgba(15, 47, 69, 0.18)',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ícono */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px', height: '60px',
              borderRadius: '50%',
              backgroundColor: '#FFEBEE',
              marginBottom: '16px',
            }}>
              <HiOutlineExclamation style={{ fontSize: '28px', color: '#C62828' }} />
            </div>

            <h5 style={{ fontSize: '18px', fontWeight: 700, color: '#1A2B3C', marginBottom: '8px' }}>
              ¿Cerrar sesión?
            </h5>
            <p style={{ fontSize: '14px', color: '#4A6275', marginBottom: '28px', lineHeight: 1.6 }}>
              ¿Estás seguro de que deseas cerrar sesión?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#0EA5C8',
                  border: '1.5px solid #0EA5C8',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E0F7FC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#C62828',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B71C1C'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C62828'}
              >
                <HiOutlineLogout style={{ fontSize: '16px' }} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;