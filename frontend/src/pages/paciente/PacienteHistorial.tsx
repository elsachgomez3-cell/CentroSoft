import { useState, useEffect } from 'react'
import type { CitaDetalle } from '../../types'
import { getMisCitasService } from '../../services/cita.service'
import {
  HiOutlineClipboardList,
  HiOutlineSortAscending,
  HiOutlineSortDescending,
} from 'react-icons/hi'

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
  })

const BADGE_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  programada:  { bg: '#E0F7FC', color: '#0B85A3', label: 'Programada'  },
  en_espera:   { bg: '#FFF8E1', color: '#F57F17', label: 'En espera'   },
  atendida:    { bg: '#E8F5E9', color: '#2E7D32', label: 'Atendida'    },
  cancelada:   { bg: '#FFEBEE', color: '#C62828', label: 'Cancelada'   },
  inasistente: { bg: '#F0F4F8', color: '#4A6275', label: 'Inasistente' },
}

// ── Estilos de tabla ──────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '11px 16px', fontSize: '11px', fontWeight: 600,
  color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em',
  backgroundColor: '#F8FBFD', borderBottom: '1px solid #D1E3EE',
  whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: '13px', color: '#1A2B3C',
  borderBottom: '1px solid #EEF4F8', verticalAlign: 'middle',
}

// ── Badge ─────────────────────────────────────────────────────────────────

const Badge = ({ estado }: { estado: string }) => {
  const b = BADGE_ESTADO[estado] ?? { bg: '#F0F4F8', color: '#4A6275', label: estado }
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 11px',
      borderRadius: '20px', whiteSpace: 'nowrap',
      textTransform: 'capitalize',
      backgroundColor: b.bg, color: b.color,
    }}>
      {b.label}
    </span>
  )
}

// ── Botón de orden ────────────────────────────────────────────────────────

const BtnOrden = ({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '7px 14px',
      backgroundColor: active ? '#0EA5C8' : 'transparent',
      color: active ? '#FFFFFF' : '#4A6275',
      border: `1.5px solid ${active ? '#0EA5C8' : '#D1E3EE'}`,
      borderRadius: '8px',
      fontSize: '12px', fontWeight: 600,
      cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.borderColor = '#0EA5C8'
        e.currentTarget.style.color = '#0EA5C8'
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.borderColor = '#D1E3EE'
        e.currentTarget.style.color = '#4A6275'
      }
    }}
  >
    {children}
  </button>
)

// ── Componente principal ──────────────────────────────────────────────────

const PacienteHistorial = () => {
  const [citas,    setCitas]    = useState<CitaDetalle[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro,   setFiltro]   = useState<'reciente' | 'antigua'>('reciente')

  useEffect(() => {
    getMisCitasService()
      .then(data => setCitas(data))
      .finally(() => setCargando(false))
  }, [])

  const citasOrdenadas = [...citas].sort((a, b) => {
    const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    return filtro === 'reciente' ? -diff : diff
  })

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #D1E3EE', borderTopColor: '#0EA5C8',
        borderRadius: '50%', animation: 'cs-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        .cs-tr:hover td { background-color: #F8FBFD !important; }
      `}</style>

      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HiOutlineClipboardList style={{ fontSize: '22px', color: '#0EA5C8' }} />
          <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>
            Mi Historial de Citas
          </h4>
        </div>

        {/* Controles de orden */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <BtnOrden active={filtro === 'reciente'} onClick={() => setFiltro('reciente')}>
            <HiOutlineSortDescending style={{ fontSize: '14px' }} />
            Más reciente
          </BtnOrden>
          <BtnOrden active={filtro === 'antigua'} onClick={() => setFiltro('antigua')}>
            <HiOutlineSortAscending style={{ fontSize: '14px' }} />
            Más antigua
          </BtnOrden>
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
        overflow: 'hidden',
      }}>
        {/* Subheader con conteo */}
        <div style={{
          padding: '13px 20px', borderBottom: '1px solid #EEF4F8',
          backgroundColor: '#F8FBFD',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A6275' }}>
            {citasOrdenadas.length} cita{citasOrdenadas.length !== 1 ? 's' : ''} en el historial
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Fecha', 'Hora', 'Doctor', 'Especialidad', 'Estado'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    ...tdStyle, textAlign: 'center',
                    color: '#8FA3B1', padding: '48px',
                  }}>
                    No tienes citas registradas
                  </td>
                </tr>
              ) : citasOrdenadas.map(c => (
                <tr key={c.id_cita} className="cs-tr">
                  <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                    {formatFecha(c.fecha)}
                  </td>
                  <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                    {c.hora.substring(0, 5)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.medico}</td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275' }}>
                    {c.especialidad}
                  </td>
                  <td style={tdStyle}>
                    <Badge estado={c.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PacienteHistorial