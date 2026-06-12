import { useState, useEffect } from 'react'
import {
  getCitasAdminService,
  cambiarEstadoCitaAdminService,
  eliminarCitaAdminService
} from '../../services/admin.service'
import type { CitaAdmin } from '../../services/admin.service'
import {
  HiOutlinePencil,
  HiOutlineXCircle,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineRefresh,
} from 'react-icons/hi'

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
  })

const ESTADOS = ['programada', 'en_espera', 'atendida', 'cancelada', 'inasistente']

const BADGE_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  programada:  { bg: '#E0F7FC', color: '#0B85A3', label: 'Programada'  },
  en_espera:   { bg: '#FFF8E1', color: '#F57F17', label: 'En espera'   },
  atendida:    { bg: '#E8F5E9', color: '#2E7D32', label: 'Atendida'    },
  cancelada:   { bg: '#FFEBEE', color: '#C62828', label: 'Cancelada'   },
  inasistente: { bg: '#F0F4F8', color: '#4A6275', label: 'Inasistente' },
}

// ── Componentes base (mismo patrón que AdminMedica) ───────────────────────

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{
    fontSize: '11px', fontWeight: 600, padding: '3px 11px',
    borderRadius: '20px', whiteSpace: 'nowrap' as const,
    textTransform: 'capitalize' as const, ...style
  }}>
    {children}
  </span>
)

const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '9px 13px',
        border: `1.5px solid ${focused ? '#0EA5C8' : '#D1E3EE'}`,
        borderRadius: '8px', fontSize: '13px',
        fontFamily: "'Inter', sans-serif", color: '#1A2B3C',
        backgroundColor: props.readOnly || props.disabled ? '#F0F4F8' : '#FFFFFF',
        outline: 'none', boxSizing: 'border-box' as const,
        boxShadow: focused ? '0 0 0 3px rgba(14,165,200,0.18)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => { if (!props.readOnly && !props.disabled) setFocused(true); props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      style={{
        width: '100%', padding: '9px 13px',
        border: `1.5px solid ${focused ? '#0EA5C8' : '#D1E3EE'}`,
        borderRadius: '8px', fontSize: '13px',
        fontFamily: "'Inter', sans-serif", color: '#1A2B3C',
        backgroundColor: '#FFFFFF', outline: 'none',
        boxSizing: 'border-box' as const,
        boxShadow: focused ? '0 0 0 3px rgba(14,165,200,0.18)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => { setFocused(true);  props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: '#4A6275', marginBottom: '5px'
  }}>
    {children}
  </label>
)

const Alerta = ({ tipo, children }: { tipo: 'danger' | 'success'; children: React.ReactNode }) => {
  const s = tipo === 'danger'
    ? { bg: '#FFEBEE', color: '#C62828', border: '#C62828', Icon: HiOutlineExclamationCircle }
    : { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32', Icon: HiOutlineCheckCircle }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', borderRadius: '8px',
      backgroundColor: s.bg, color: s.color,
      borderLeft: `4px solid ${s.border}`,
      fontSize: '13px', marginBottom: '16px'
    }}>
      <s.Icon style={{ fontSize: '17px', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

const Modal = ({ onClose, children, maxWidth = 520 }: {
  onClose: () => void; children: React.ReactNode; maxWidth?: number
}) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15,47,69,0.5)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px',
        width: '100%', maxWidth,
        boxShadow: '0 20px 60px rgba(15,47,69,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {children}
    </div>
  </div>
)

const ModalHeader = ({ title, onClose, danger }: {
  title: string; onClose: () => void; danger?: boolean
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #EEF4F8'
  }}>
    <h5 style={{
      fontSize: '17px', fontWeight: 700,
      color: danger ? '#C62828' : '#1A2B3C', margin: 0,
      display: 'flex', alignItems: 'center', gap: '8px'
    }}>
      {title}
    </h5>
    <button
      onClick={onClose}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#8FA3B1', display: 'flex', alignItems: 'center',
        padding: '4px', borderRadius: '6px'
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#1A2B3C'}
      onMouseLeave={e => e.currentTarget.style.color = '#8FA3B1'}
    >
      <HiOutlineX style={{ fontSize: '20px' }} />
    </button>
  </div>
)

const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
    {children}
  </div>
)

const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: 'flex', justifyContent: 'flex-end', gap: '10px',
    padding: '16px 24px', borderTop: '1px solid #EEF4F8'
  }}>
    {children}
  </div>
)

const BtnPrimary = ({ children, onClick, type = 'button', disabled }: {
  children: React.ReactNode; onClick?: () => void;
  type?: 'button' | 'submit'; disabled?: boolean
}) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    style={{
      padding: '9px 20px',
      backgroundColor: disabled ? '#8FA3B1' : '#0EA5C8',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '13px', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0B85A3' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? '#8FA3B1' : '#0EA5C8' }}
  >
    {children}
  </button>
)

const BtnSecondary = ({ children, onClick }: {
  children: React.ReactNode; onClick: () => void
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '9px 20px', backgroundColor: 'transparent',
      color: '#0EA5C8', border: '1.5px solid #0EA5C8',
      borderRadius: '8px', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E0F7FC'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    {children}
  </button>
)

const BtnDanger = ({ children, onClick }: {
  children: React.ReactNode; onClick: () => void
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      padding: '9px 20px', backgroundColor: '#C62828',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B71C1C'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C62828'}
  >
    {children}
  </button>
)

const BtnTabla = ({ onClick, color, children }: {
  onClick: () => void; color: 'edit' | 'danger'; children: React.ReactNode
}) => {
  const hoverColor = color === 'edit' ? '#0EA5C8' : '#C62828'
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: '1.5px solid #D1E3EE',
        borderRadius: '7px', padding: '5px 11px', cursor: 'pointer',
        color: '#4A6275', fontSize: '12px', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        fontFamily: "'Inter', sans-serif",
        transition: 'border-color 0.15s, color 0.15s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = hoverColor
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#D1E3EE'
        e.currentTarget.style.color = '#4A6275'
      }}
    >
      {children}
    </button>
  )
}

// Estilos de tabla (mismo patrón AdminMedica)
const thStyle: React.CSSProperties = {
  padding: '11px 16px', fontSize: '11px', fontWeight: 600,
  color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em',
  backgroundColor: '#F8FBFD', borderBottom: '1px solid #D1E3EE',
  whiteSpace: 'nowrap'
}
const tdStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: '13px', color: '#1A2B3C',
  borderBottom: '1px solid #EEF4F8', verticalAlign: 'middle'
}

// ── Componente principal ──────────────────────────────────────────────────

const AdminCitas = () => {
  const [citas,    setCitas]    = useState<CitaAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState('')

  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroBuscar, setFiltroBuscar] = useState('')

  const [modalEditar,   setModalEditar]   = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [citaSel,       setCitaSel]       = useState<CitaAdmin | null>(null)
  const [nuevoEstado,   setNuevoEstado]   = useState('')
  const [motivoCancel,  setMotivoCancel]  = useState('')

  useEffect(() => { cargarCitas() }, [])

  const cargarCitas = async (filtros?: {
    desde?: string; hasta?: string; estado?: string
  }) => {
    setCargando(true)
    try {
      const data = await getCitasAdminService(filtros)
      setCitas(data)
    } catch {
      setError('Error al cargar las citas')
    } finally {
      setCargando(false)
    }
  }

  const mostrarExito = (msg: string) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  const handleFiltrar = () => {
    cargarCitas({
      desde:  filtroDesde  || undefined,
      hasta:  filtroHasta  || undefined,
      estado: filtroEstado || undefined,
    })
  }

  const handleLimpiarFiltros = () => {
    setFiltroDesde('')
    setFiltroHasta('')
    setFiltroEstado('')
    setFiltroBuscar('')
    cargarCitas()
  }

  const handleEditarEstado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!citaSel || !nuevoEstado) return
    try {
      await cambiarEstadoCitaAdminService(
        citaSel.id_cita,
        nuevoEstado,
        nuevoEstado === 'cancelada' ? motivoCancel : undefined
      )
      setModalEditar(false)
      setCitaSel(null)
      setNuevoEstado('')
      setMotivoCancel('')
      await cargarCitas()
      mostrarExito('Estado actualizado correctamente')
    } catch {
      setError('Error al actualizar el estado')
    }
  }

  const handleEliminar = async () => {
    if (!citaSel) return
    try {
      await eliminarCitaAdminService(citaSel.id_cita)
      setModalEliminar(false)
      setCitaSel(null)
      await cargarCitas()
      mostrarExito('Cita cancelada correctamente')
    } catch {
      setError('Error al cancelar la cita')
    }
  }

  const citasFiltradas = citas.filter(c => {
    if (!filtroBuscar) return true
    const busq = filtroBuscar.toLowerCase()
    return (
      c.paciente.toLowerCase().includes(busq) ||
      c.medico.toLowerCase().includes(busq)
    )
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
        tr:hover td { background-color: #F8FBFD; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0, display: 'flex', alignItems: 'center', gap: '9px' }}>
          
          Gestión de Citas
        </h4>
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* ── Filtros ── */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
        padding: '16px 20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '14px', alignItems: 'end'
        }}>
          <div>
            <Lbl>Desde</Lbl>
            <CsInput
              type="date"
              value={filtroDesde}
              onChange={e => setFiltroDesde(e.target.value)}
            />
          </div>
          <div>
            <Lbl>Hasta</Lbl>
            <CsInput
              type="date"
              value={filtroHasta}
              onChange={e => setFiltroHasta(e.target.value)}
            />
          </div>
          <div>
            <Lbl>Estado</Lbl>
            <CsSelect
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              {ESTADOS.map(e => (
                <option key={e} value={e}>{BADGE_ESTADO[e]?.label ?? e}</option>
              ))}
            </CsSelect>
          </div>
          <div>
            <Lbl>Paciente o doctor</Lbl>
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch style={{
                position: 'absolute', left: '11px', top: '50%',
                transform: 'translateY(-50%)', color: '#8FA3B1', fontSize: '15px'
              }} />
              <CsInput
                style={{ paddingLeft: '32px' } as React.CSSProperties}
                placeholder="Buscar nombre..."
                value={filtroBuscar}
                onChange={e => setFiltroBuscar(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <BtnPrimary onClick={handleFiltrar}>
              <HiOutlineFilter style={{ fontSize: '14px' }} /> Filtrar
            </BtnPrimary>
            <button
              onClick={handleLimpiarFiltros}
              style={{
                padding: '9px 14px', backgroundColor: 'transparent',
                color: '#4A6275', border: '1.5px solid #D1E3EE',
                borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: "'Inter', sans-serif", transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F0F4F8'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <HiOutlineRefresh style={{ fontSize: '14px' }} /> Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '12px',
        border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
        overflow: 'hidden'
      }}>
        {/* Header del card */}
        <div style={{
          padding: '13px 20px', borderBottom: '1px solid #EEF4F8',
          display: 'flex', alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4A6275' }}>
            {citasFiltradas.length} cita{citasFiltradas.length !== 1 ? 's' : ''} encontrada{citasFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Fecha', 'Hora', 'Paciente', 'Doctor', 'Especialidad', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>
                    No se encontraron citas
                  </td>
                </tr>
              ) : citasFiltradas.map(c => {
                const badge = BADGE_ESTADO[c.estado] ?? { bg: '#F0F4F8', color: '#4A6275', label: c.estado }
                return (
                  <tr key={c.id_cita}>
                    <td style={{ ...tdStyle, color: '#8FA3B1', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                      #{c.id_cita}
                    </td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {formatFecha(c.fecha)}
                    </td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                      {c.hora.substring(0, 5)}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{c.paciente}</td>
                    <td style={tdStyle}>{c.medico}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275' }}>{c.especialidad}</td>
                    <td style={tdStyle}>
                      <Badge style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </Badge>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <BtnTabla color="edit" onClick={() => {
                        setCitaSel(c)
                        setNuevoEstado(c.estado)
                        setModalEditar(true)
                      }}>
                        <HiOutlinePencil /> Editar
                      </BtnTabla>
                      {' '}
                      {c.estado !== 'cancelada' && (
                        <BtnTabla color="danger" onClick={() => {
                          setCitaSel(c)
                          setModalEliminar(true)
                        }}>
                          <HiOutlineXCircle /> Cancelar
                        </BtnTabla>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ MODAL EDITAR ESTADO ══ */}
      {modalEditar && citaSel && (
        <Modal onClose={() => setModalEditar(false)}>
          <ModalHeader title="Editar estado de cita" onClose={() => setModalEditar(false)} />
          <form onSubmit={handleEditarEstado}>
            <ModalBody>
              <p style={{ fontSize: '13px', color: '#4A6275', lineHeight: 1.6, margin: 0 }}>
                Cita de <strong style={{ color: '#1A2B3C' }}>{citaSel.paciente}</strong>{' '}
                con <strong style={{ color: '#1A2B3C' }}>{citaSel.medico}</strong>{' '}
                el {formatFecha(citaSel.fecha)} a las {citaSel.hora.substring(0, 5)}
              </p>
              <div>
                <Lbl>Nuevo estado</Lbl>
                <CsSelect
                  value={nuevoEstado}
                  onChange={e => setNuevoEstado(e.target.value)}
                  required
                >
                  {ESTADOS.map(e => (
                    <option key={e} value={e}>{BADGE_ESTADO[e]?.label ?? e}</option>
                  ))}
                </CsSelect>
              </div>
              {nuevoEstado === 'cancelada' && (
                <div>
                  <Lbl>Motivo de cancelación <span style={{ color: '#C62828' }}>*</span></Lbl>
                  <CsInput
                    placeholder="Ingresa el motivo"
                    value={motivoCancel}
                    onChange={e => setMotivoCancel(e.target.value)}
                    required
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalEditar(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit">
                <HiOutlineCheckCircle style={{ fontSize: '15px' }} /> Guardar cambios
              </BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL CANCELAR CITA ══ */}
      {modalEliminar && citaSel && (
        <Modal onClose={() => setModalEliminar(false)} maxWidth={380}>
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: '#FFEBEE', marginBottom: '16px'
            }}>
              <HiOutlineExclamation style={{ fontSize: '28px', color: '#C62828' }} />
            </div>
            <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', marginBottom: '8px' }}>
              Cancelar cita
            </h5>
            <p style={{ fontSize: '14px', color: '#4A6275', lineHeight: 1.6, marginBottom: '6px' }}>
              ¿Confirmas la cancelación de la cita de{' '}
              <strong style={{ color: '#1A2B3C' }}>{citaSel.paciente}</strong>{' '}
              el {formatFecha(citaSel.fecha)} a las {citaSel.hora.substring(0, 5)}?
            </p>
            <p style={{ fontSize: '12px', color: '#8FA3B1', marginBottom: '24px' }}>
              El motivo será: "Cancelada por administrador"
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <BtnSecondary onClick={() => setModalEliminar(false)}>Volver</BtnSecondary>
              <BtnDanger onClick={handleEliminar}>
                <HiOutlineXCircle style={{ fontSize: '15px' }} /> Confirmar cancelación
              </BtnDanger>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminCitas