import { useState, useEffect } from 'react'
import {
  getMisNotificacionesService,
  marcarLeidaService,
  marcarTodasLeidasService
} from '../../services/notificacion.service'
import type { Notificacion } from '../../services/notificacion.service'
import {
  HiOutlineBell,
  HiOutlineCalendar,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCheck,
} from 'react-icons/hi'

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFechaHora = (fecha: string) =>
  new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const IconoPorTipo = ({ tipo }: { tipo: string }) => {
  const mapa: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    cita_agendada:     { icon: <HiOutlineCalendar  style={{ fontSize: '20px' }} />, bg: '#E0F7FC', color: '#0B85A3' },
    cita_cancelada:    { icon: <HiOutlineXCircle   style={{ fontSize: '20px' }} />, bg: '#FFEBEE', color: '#C62828' },
    cita_reprogramada: { icon: <HiOutlineRefresh   style={{ fontSize: '20px' }} />, bg: '#FFF8E1', color: '#F57F17' },
    recordatorio:      { icon: <HiOutlineClock     style={{ fontSize: '20px' }} />, bg: '#EDE7F6', color: '#4527A0' },
    sistema:           { icon: <HiOutlineBell      style={{ fontSize: '20px' }} />, bg: '#F0F4F8', color: '#4A6275' },
  }
  const cfg = mapa[tipo] ?? mapa['sistema']
  return (
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
      backgroundColor: cfg.bg, color: cfg.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {cfg.icon}
    </div>
  )
}

// ── Componentes base (patrón AdminMedica) ─────────────────────────────────

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{
    fontSize: '11px', fontWeight: 600, padding: '3px 9px',
    borderRadius: '20px', whiteSpace: 'nowrap' as const, ...style
  }}>
    {children}
  </span>
)

const BtnGhost = ({ children, onClick }: {
  children: React.ReactNode; onClick: () => void
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '8px 16px', backgroundColor: 'transparent',
      color: '#4A6275', border: '1.5px solid #D1E3EE',
      borderRadius: '8px', fontSize: '13px', fontWeight: 500,
      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F4F8'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    {children}
  </button>
)

const BtnMarcar = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '5px 12px', backgroundColor: 'transparent',
      color: '#0EA5C8', border: '1.5px solid #0EA5C8',
      borderRadius: '7px', fontSize: '12px', fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      flexShrink: 0, transition: 'background 0.2s, color 0.2s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = '#E0F7FC'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <HiOutlineCheck style={{ fontSize: '13px' }} />
    Marcar leída
  </button>
)

// ── Componente principal ──────────────────────────────────────────────────

const AdminNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargando,       setCargando]       = useState(true)
  const [filtro,         setFiltro]         = useState<'todas' | 'no_leidas'>('todas')

  useEffect(() => {
    cargarNotificaciones()
  }, [])

  const cargarNotificaciones = async () => {
    setCargando(true)
    try {
      const data = await getMisNotificacionesService()
      setNotificaciones(data)
    } catch {
      console.error('Error al cargar notificaciones')
    } finally {
      setCargando(false)
    }
  }

  const handleMarcarLeida = async (id: number) => {
    try {
      await marcarLeidaService(id)
      setNotificaciones(prev =>
        prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
      )
    } catch {
      console.error('Error al marcar como leída')
    }
  }

  const handleMarcarTodasLeidas = async () => {
    try {
      await marcarTodasLeidasService()
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    } catch {
      console.error('Error al marcar todas como leídas')
    }
  }

  const notificacionesFiltradas = notificaciones.filter(n =>
    filtro === 'no_leidas' ? !n.leida : true
  )

  const cantidadNoLeidas = notificaciones.filter(n => !n.leida).length

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #D1E3EE', borderTopColor: '#0EA5C8',
        borderRadius: '50%', animation: 'cs-spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0, display: 'flex', alignItems: 'center', gap: '9px' }}>
            <HiOutlineBell style={{ fontSize: '22px', color: '#0EA5C8' }} />
            Notificaciones
          </h4>
          {cantidadNoLeidas > 0 && (
            <Badge style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
              {cantidadNoLeidas} nuevas
            </Badge>
          )}
        </div>
        {cantidadNoLeidas > 0 && (
          <BtnGhost onClick={handleMarcarTodasLeidas}>
            <HiOutlineCheckCircle style={{ fontSize: '15px' }} />
            Marcar todas como leídas
          </BtnGhost>
        )}
      </div>

      {/* Tabs de filtro — mismo patrón que AdminMedica */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #D1E3EE' }}>
        {([
          { key: 'todas',     label: `Todas (${notificaciones.length})` },
          { key: 'no_leidas', label: `No leídas (${cantidadNoLeidas})`  },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setFiltro(t.key)}
            style={{
              padding: '9px 18px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'transparent',
              color: filtro === t.key ? '#0EA5C8' : '#4A6275',
              borderBottom: filtro === t.key ? '2px solid #0EA5C8' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'color 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Estado vacío */}
      {notificacionesFiltradas.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          padding: '60px 24px', textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#F0F4F8', marginBottom: '14px'
          }}>
            <HiOutlineBell style={{ fontSize: '26px', color: '#8FA3B1' }} />
          </div>
          <p style={{ fontSize: '14px', color: '#8FA3B1', margin: 0 }}>
            No hay notificaciones
          </p>
        </div>
      ) : (
        /* Lista de notificaciones */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notificacionesFiltradas.map(n => (
            <div
              key={n.id_notificacion}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #D1E3EE',
                borderLeft: `4px solid ${n.leida ? '#D1E3EE' : '#0EA5C8'}`,
                boxShadow: '0 1px 3px rgba(15,47,69,0.06)',
                padding: '16px 20px',
                opacity: n.leida ? 0.75 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>

                {/* Ícono + contenido */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <IconoPorTipo tipo={n.tipo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B3C' }}>
                        {n.titulo}
                      </span>
                      {!n.leida && (
                        <span style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          backgroundColor: '#0EA5C8', flexShrink: 0,
                          display: 'inline-block'
                        }} />
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#4A6275', margin: '0 0 6px', lineHeight: 1.5 }}>
                      {n.mensaje}
                    </p>
                    <span style={{ fontSize: '11px', color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>
                      {formatFechaHora(n.fecha_envio)}
                    </span>
                  </div>
                </div>

                {/* Botón marcar leída */}
                {!n.leida && (
                  <BtnMarcar onClick={() => handleMarcarLeida(n.id_notificacion)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminNotificaciones