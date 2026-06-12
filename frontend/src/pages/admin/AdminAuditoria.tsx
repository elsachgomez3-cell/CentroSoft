import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineExclamationCircle,
} from 'react-icons/hi'

interface RegistroAuditoria {
  id_auditoria:       number
  tabla_afectada:     string
  accion:             string
  nombre_usuario:     string
  id_registro:        number | null
  valores_anteriores: any
  valores_nuevos:     any
  fecha:              string
}

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

const BADGE_ACCION: Record<string, { bg: string; color: string }> = {
  INSERT: { bg: '#E8F5E9', color: '#2E7D32' },
  UPDATE: { bg: '#FFF8E1', color: '#F57F17' },
  DELETE: { bg: '#FFEBEE', color: '#C62828' },
}

// ── Componentes base (patrón AdminMedica) ─────────────────────────────────

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{
    fontSize: '11px', fontWeight: 700, padding: '3px 9px',
    borderRadius: '20px', whiteSpace: 'nowrap' as const,
    letterSpacing: '0.03em', ...style
  }}>
    {children}
  </span>
)

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      style={{
        padding: '8px 12px',
        border: `1.5px solid ${focused ? '#0EA5C8' : '#D1E3EE'}`,
        borderRadius: '8px', fontSize: '13px',
        fontFamily: "'Inter', sans-serif", color: '#1A2B3C',
        backgroundColor: '#FFFFFF', outline: 'none',
        boxSizing: 'border-box' as const,
        boxShadow: focused ? '0 0 0 3px rgba(14,165,200,0.18)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onFocus={e => { setFocused(true);  props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A6275', marginBottom: '5px' }}>
    {children}
  </label>
)

const BtnPrimary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '8px 18px', backgroundColor: '#0EA5C8',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0B85A3'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0EA5C8'}
  >
    {children}
  </button>
)

const BtnGhost = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
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

const thStyle: React.CSSProperties = {
  padding: '11px 14px', fontSize: '11px', fontWeight: 600,
  color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em',
  backgroundColor: '#F8FBFD', borderBottom: '1px solid #D1E3EE',
  whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 1,
}
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: '13px', color: '#1A2B3C',
  borderBottom: '1px solid #EEF4F8', verticalAlign: 'middle',
}

// ── Componente principal ──────────────────────────────────────────────────

const AdminAuditoria = () => {
  const [registros,    setRegistros]    = useState<RegistroAuditoria[]>([])
  const [cargando,     setCargando]     = useState(true)
  const [error,        setError]        = useState('')
  const [filtroTabla,  setFiltroTabla]  = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [detalleSel,   setDetalleSel]   = useState<RegistroAuditoria | null>(null)

  useEffect(() => { cargarAuditoria() }, [])

  const cargarAuditoria = async () => {
    setCargando(true)
    try {
      const res = await api.get('/auditoria')
      setRegistros(res.data)
    } catch {
      setError('Error al cargar el log de auditoría')
    } finally {
      setCargando(false)
    }
  }

  const tablas = [...new Set(registros.map(r => r.tabla_afectada))]

  const registrosFiltrados = registros.filter(r => {
    const matchTabla  = !filtroTabla  || r.tabla_afectada === filtroTabla
    const matchAccion = !filtroAccion || r.accion         === filtroAccion
    return matchTabla && matchAccion
  })

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
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0, display: 'flex', alignItems: 'center', gap: '9px' }}>
          <HiOutlineShieldCheck style={{ fontSize: '22px', color: '#0EA5C8' }} />
          Auditoría del sistema
        </h4>
        <BtnPrimary onClick={cargarAuditoria}>
          <HiOutlineRefresh style={{ fontSize: '15px' }} />
          Actualizar
        </BtnPrimary>
      </div>

      {/* Alerta de error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 14px', borderRadius: '8px',
          backgroundColor: '#FFEBEE', color: '#C62828',
          borderLeft: '4px solid #C62828', fontSize: '13px'
        }}>
          <HiOutlineExclamationCircle style={{ fontSize: '17px', flexShrink: 0, marginTop: '1px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <Lbl>Tabla</Lbl>
            <CsSelect
              style={{ minWidth: '160px' }}
              value={filtroTabla}
              onChange={e => setFiltroTabla(e.target.value)}
            >
              <option value="">Todas</option>
              {tablas.map(t => <option key={t} value={t}>{t}</option>)}
            </CsSelect>
          </div>
          <div>
            <Lbl>Acción</Lbl>
            <CsSelect
              style={{ minWidth: '130px' }}
              value={filtroAccion}
              onChange={e => setFiltroAccion(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </CsSelect>
          </div>
          <BtnGhost onClick={() => { setFiltroTabla(''); setFiltroAccion('') }}>
            Limpiar filtros
          </BtnGhost>
        </div>
      </div>

      {/* Layout tabla + detalle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: detalleSel ? '1fr 420px' : '1fr',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* Tabla de logs */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          overflow: 'hidden'
        }}>
          {/* Card header */}
          <div style={{
            padding: '13px 18px', borderBottom: '1px solid #EEF4F8',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A6275' }}>
              {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '11px', color: '#8FA3B1' }}>
              Clic en una fila para ver detalle
            </span>
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'Tabla', 'Acción', 'Usuario', 'Registro', 'Fecha'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>
                      No hay registros de auditoría aún
                    </td>
                  </tr>
                ) : registrosFiltrados.map(r => {
                  const seleccionada = detalleSel?.id_auditoria === r.id_auditoria
                  return (
                    <tr
                      key={r.id_auditoria}
                      onClick={() => setDetalleSel(seleccionada ? null : r)}
                      style={{ cursor: 'pointer', backgroundColor: seleccionada ? '#E0F7FC' : undefined }}
                      onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.backgroundColor = '#F8FBFD' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = seleccionada ? '#E0F7FC' : '' }}
                    >
                      <td style={{ ...tdStyle, color: '#8FA3B1', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                        #{r.id_auditoria}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275' }}>
                        {r.tabla_afectada}
                      </td>
                      <td style={tdStyle}>
                        <Badge style={BADGE_ACCION[r.accion] ?? { bg: '#F0F4F8', color: '#4A6275' }}>
                          {r.accion}
                        </Badge>
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px' }}>{r.nombre_usuario}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>
                        {r.id_registro ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatFecha(r.fecha)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de detalle */}
        {detalleSel && (
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '12px',
            border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '13px 18px', borderBottom: '1px solid #EEF4F8',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3C' }}>
                Registro #{detalleSel.id_auditoria}
              </span>
              <button
                onClick={() => setDetalleSel(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#8FA3B1', display: 'flex', alignItems: 'center',
                  padding: '4px', borderRadius: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#1A2B3C'}
                onMouseLeave={e => e.currentTarget.style.color = '#8FA3B1'}
              >
                <HiOutlineX style={{ fontSize: '18px' }} />
              </button>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Tabla de metadatos */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'Tabla',      value: detalleSel.tabla_afectada },
                    { label: 'Usuario',    value: detalleSel.nombre_usuario },
                    { label: 'ID registro',value: detalleSel.id_registro ?? '—' },
                    { label: 'Fecha',      value: formatFecha(detalleSel.fecha) },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td style={{ padding: '6px 0', fontSize: '12px', color: '#8FA3B1', fontWeight: 500, width: '100px', verticalAlign: 'top' }}>
                        {label}
                      </td>
                      <td style={{ padding: '6px 0', fontSize: '13px', color: '#1A2B3C' }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '6px 0', fontSize: '12px', color: '#8FA3B1', fontWeight: 500, verticalAlign: 'middle' }}>
                      Acción
                    </td>
                    <td style={{ padding: '6px 0' }}>
                      <Badge style={BADGE_ACCION[detalleSel.accion] ?? { backgroundColor: '#F0F4F8', color: '#4A6275' }}>
                        {detalleSel.accion}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Valores anteriores */}
              {detalleSel.valores_anteriores && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Valores anteriores
                  </p>
                  <pre style={{
                    backgroundColor: '#FFEBEE',
                    color: '#C62828',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    margin: 0,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.6,
                    border: '1px solid #FFCDD2',
                  }}>
                    {JSON.stringify(detalleSel.valores_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {/* Valores nuevos */}
              {detalleSel.valores_nuevos && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Valores nuevos
                  </p>
                  <pre style={{
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    margin: 0,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.6,
                    border: '1px solid #C8E6C9',
                  }}>
                    {JSON.stringify(detalleSel.valores_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAuditoria