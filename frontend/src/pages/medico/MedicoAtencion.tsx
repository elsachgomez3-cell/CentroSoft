import { useState, useEffect } from 'react'
import {
  HiCheckCircle,
  HiXCircle,
  HiSearch,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineFilter,
} from 'react-icons/hi'
import {
  getAgendaHoyService,
  cambiarEstadoCitaService,
  getMisEspecialidadesService,
} from '../../services/medico.service'
import type { CitaMedico, Especialidad } from '../../services/medico.service'

const MedicoAtencion = () => {
  const hoyDate = new Date()
  const hoy = `${hoyDate.getFullYear()}-${String(hoyDate.getMonth() + 1).padStart(2, '0')}-${String(hoyDate.getDate()).padStart(2, '0')}`

  const [tab,       setTab]       = useState<'atendidos' | 'inasistentes'>('atendidos')
  const [citas,     setCitas]     = useState<CitaMedico[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const [seleccionados, setSeleccionados] = useState<number[]>([])

  const [especialidades,  setEspecialidades]  = useState<Especialidad[]>([])
  const [espSeleccionada, setEspSeleccionada] = useState<number | undefined>(undefined)

  const [busqueda, setBusqueda] = useState('')

  const citasFiltradas = citas
    .filter(c => espSeleccionada === undefined || c.id_especialidad === espSeleccionada)
    .filter(c => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return (
        c.paciente.toLowerCase().includes(q) ||
        (c.paciente_ci ?? '').toLowerCase().includes(q)
      )
    })

  useEffect(() => {
    getMisEspecialidadesService()
      .then(data => setEspecialidades(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    cargarCitas()
  }, [tab])

  const cargarCitas = async () => {
    setCargando(true)
    setSeleccionados([])
    try {
      const todas = await getAgendaHoyService(hoy)
      if (tab === 'atendidos') {
        setCitas(todas.filter(c => c.estado === 'programada' || c.estado === 'en_espera'))
      } else {
        const ahora = new Date()
        setCitas(todas.filter(c => {
          if (c.estado !== 'programada') return false
          const [h, m] = c.hora.substring(0, 5).split(':').map(Number)
          const horaCita = new Date()
          horaCita.setHours(h, m, 0, 0)
          return horaCita < ahora
        }))
      }
    } catch {
      setError('Error al cargar las citas')
    } finally {
      setCargando(false)
    }
  }

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const mostrarExito = (msg: string) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  const handleGuardar = async () => {
    if (seleccionados.length === 0) {
      setError('Selecciona al menos una cita')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const nuevoEstado = tab === 'atendidos' ? 'atendida' : 'inasistente'
      await Promise.all(
        seleccionados.map(id => cambiarEstadoCitaService(id, nuevoEstado))
      )
      mostrarExito(
        tab === 'atendidos'
          ? `${seleccionados.length} paciente(s) marcado(s) como atendido(s)`
          : `${seleccionados.length} paciente(s) marcado(s) como inasistente(s)`
      )
      await cargarCitas()
    } catch {
      setError('Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  /* ─── Badge de estado ─────────────────────────────────────────── */
  const badgeEstado = (estado: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      programada: { bg: '#E0F7FC', color: '#0B85A3', label: 'Programada' },
      en_espera:  { bg: '#FFF8E1', color: '#F57F17', label: 'En espera'  },
    }
    const s = map[estado] ?? { bg: '#F0F4F8', color: '#4A6275', label: estado }
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: s.bg,
        color: s.color,
      }}>
        {s.label}
      </span>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-main, Inter, sans-serif)' }}>

      {/* ── Título ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <HiOutlineCalendar size={22} color="var(--cs-primary, #0EA5C8)" />
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cs-text-primary, #1A2B3C)', margin: 0 }}>
          Atención del día
        </h4>
      </div>

      {/* ── Alertas ───────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'var(--cs-danger-bg, #FFEBEE)',
          color: 'var(--cs-danger-text, #C62828)',
          borderLeft: '4px solid var(--cs-danger-text, #C62828)',
          fontSize: '14px',
        }}>
          <HiXCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}
      {exito && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'var(--cs-success-bg, #E8F5E9)',
          color: 'var(--cs-success-text, #2E7D32)',
          borderLeft: '4px solid var(--cs-success-text, #2E7D32)',
          fontSize: '14px',
        }}>
          <HiCheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          {exito}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid var(--cs-border, #D1E3EE)',
        marginBottom: '24px',
      }}>
        {([
          { key: 'atendidos',    Icon: HiCheckCircle, label: 'Marcar atendidos'    },
          { key: 'inasistentes', Icon: HiXCircle,     label: 'Marcar inasistentes' },
        ] as const).map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === key
                ? '2px solid var(--cs-primary, #0EA5C8)'
                : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key
                ? 'var(--cs-primary, #0EA5C8)'
                : 'var(--cs-text-secondary, #4A6275)',
              transition: 'color 0.15s',
              borderRadius: '0',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon
              size={16}
              color={
                key === 'atendidos'
                  ? (tab === key ? 'var(--cs-primary, #0EA5C8)' : '#8FA3B1')
                  : (tab === key ? '#C62828' : '#8FA3B1')
              }
            />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filtro de especialidad ────────────────────────────────── */}
      {especialidades.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'var(--cs-primary-light, #E0F7FC)',
          border: '1px solid var(--cs-border, #D1E3EE)',
        }}>
          <HiOutlineFilter size={15} color="var(--cs-text-secondary, #4A6275)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cs-text-secondary, #4A6275)', marginRight: '4px' }}>
            Especialidad:
          </span>
          <button
            onClick={() => setEspSeleccionada(undefined)}
            style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', border: '1.5px solid var(--cs-primary, #0EA5C8)',
              background: espSeleccionada === undefined ? 'var(--cs-primary, #0EA5C8)' : 'transparent',
              color:      espSeleccionada === undefined ? '#fff' : 'var(--cs-primary, #0EA5C8)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            Todas
          </button>
          {especialidades.map(e => (
            <button
              key={e.id_especialidad}
              onClick={() => setEspSeleccionada(e.id_especialidad)}
              style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer', border: '1.5px solid var(--cs-primary, #0EA5C8)',
                background: espSeleccionada === e.id_especialidad ? 'var(--cs-primary, #0EA5C8)' : 'transparent',
                color:      espSeleccionada === e.id_especialidad ? '#fff' : 'var(--cs-primary, #0EA5C8)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {e.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ── Buscador ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }}>
        <HiSearch
          size={15}
          color="var(--cs-text-muted, #8FA3B1)"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o CI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 14px 9px 34px',
            border: '1.5px solid var(--cs-border, #D1E3EE)',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'inherit',
            color: 'var(--cs-text-primary, #1A2B3C)',
            background: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--cs-primary, #0EA5C8)'
            e.target.style.boxShadow   = '0 0 0 3px rgba(14,165,200,0.2)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--cs-border, #D1E3EE)'
            e.target.style.boxShadow   = 'none'
          }}
        />
      </div>

      {/* ── Card principal ────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid var(--cs-border, #D1E3EE)',
        boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
        overflow: 'hidden',
      }}>

        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--cs-border, #D1E3EE)',
          background: 'var(--cs-bg-base, #F0F4F8)',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--cs-text-muted, #8FA3B1)' }}>
            {tab === 'atendidos'
              ? 'Citas programadas para hoy — selecciona los pacientes ya atendidos'
              : 'Pacientes cuya hora ya pasó — selecciona los que no se presentaron'
            }
          </span>
          {citasFiltradas.length !== citas.length && (
            <span style={{
              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
              background: 'var(--cs-primary-light, #E0F7FC)',
              color: 'var(--cs-info-text, #0B85A3)',
            }}>
              {citasFiltradas.length} de {citas.length}
            </span>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: 0 }}>
          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
              <div style={{
                width: '32px', height: '32px',
                border: '3px solid var(--cs-border, #D1E3EE)',
                borderTopColor: 'var(--cs-primary, #0EA5C8)',
                borderRadius: '50%',
                animation: 'cs-spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
            </div>

          ) : citasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--cs-text-muted, #8FA3B1)' }}>
              <div style={{ marginBottom: '12px', color: 'var(--cs-border, #D1E3EE)' }}>
                {busqueda || espSeleccionada
                  ? <HiSearch size={48} />
                  : tab === 'atendidos'
                  ? <HiCheckCircle size={48} />
                  : <HiOutlineClock size={48} />
                }
              </div>
              <p style={{ fontSize: '14px', color: 'var(--cs-text-secondary, #4A6275)' }}>
                {busqueda || espSeleccionada
                  ? 'No hay resultados para los filtros aplicados'
                  : tab === 'atendidos'
                  ? 'No hay citas programadas para hoy'
                  : 'No hay pacientes inasistentes registrados'
                }
              </p>
            </div>

          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--cs-bg-base, #F0F4F8)' }}>
                    <th style={thStyle('#')}></th>
                    <th style={thStyle()}>Hora</th>
                    <th style={thStyle()}>Paciente</th>
                    <th style={thStyle()}>Edad</th>
                    <th style={thStyle()}>Teléfono</th>
                    <th style={thStyle()}>Especialidad</th>
                    <th style={thStyle()}>Motivo</th>
                    <th style={thStyle()}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((c, idx) => {
                    const selected = seleccionados.includes(c.id_cita)
                    return (
                      <tr
                        key={c.id_cita}
                        onClick={() => toggleSeleccion(c.id_cita)}
                        style={{
                          cursor: 'pointer',
                          background: selected
                            ? 'var(--cs-primary-light, #E0F7FC)'
                            : idx % 2 === 0 ? '#fff' : '#FAFCFE',
                          borderLeft: selected
                            ? '3px solid var(--cs-primary, #0EA5C8)'
                            : '3px solid transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => {
                          if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--cs-primary-light, #E0F7FC)'
                        }}
                        onMouseLeave={e => {
                          if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#FAFCFE'
                        }}
                      >
                        <td style={tdStyle({ width: '40px' })}>
                          <input
                            type="checkbox"
                            readOnly
                            checked={selected}
                            style={{ accentColor: 'var(--cs-primary, #0EA5C8)', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={tdStyle()}>
                          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--cs-text-primary, #1A2B3C)' }}>
                            {c.hora.substring(0, 5)}
                          </span>
                        </td>
                        <td style={tdStyle()}>
                          <div style={{ fontWeight: 500, color: 'var(--cs-text-primary, #1A2B3C)' }}>{c.paciente}</div>
                          {c.paciente_ci && (
                            <div style={{ fontSize: '11px', color: 'var(--cs-text-muted, #8FA3B1)', marginTop: '2px' }}>
                              CI: {c.paciente_ci}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle()}>
                          <span style={{ color: 'var(--cs-text-secondary, #4A6275)' }}>
                            {c.paciente_edad ? `${c.paciente_edad} a.` : '—'}
                          </span>
                        </td>
                        <td style={tdStyle()}>
                          {c.paciente_telefono
                            ? (
                              <a
                                href={`tel:${c.paciente_telefono}`}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--cs-primary, #0EA5C8)',
                                  textDecoration: 'none',
                                }}
                              >
                                {c.paciente_telefono}
                              </a>
                            )
                            : <span style={{ color: 'var(--cs-text-muted, #8FA3B1)' }}>—</span>
                          }
                        </td>
                        <td style={tdStyle()}>
                          <span style={{ fontSize: '12px', color: 'var(--cs-text-secondary, #4A6275)' }}>{c.especialidad}</span>
                        </td>
                        <td style={tdStyle()}>
                          <span style={{ fontSize: '12px', color: 'var(--cs-text-muted, #8FA3B1)' }}>{c.motivo || '—'}</span>
                        </td>
                        <td style={tdStyle()}>
                          {badgeEstado(c.estado)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card footer */}
        {citasFiltradas.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid var(--cs-border, #D1E3EE)',
            background: 'var(--cs-bg-base, #F0F4F8)',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--cs-text-muted, #8FA3B1)' }}>
              {seleccionados.length} seleccionado(s) de {citasFiltradas.length}
            </span>
            <button
              onClick={handleGuardar}
              disabled={guardando || seleccionados.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: guardando || seleccionados.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'background 0.2s, opacity 0.2s',
                opacity: seleccionados.length === 0 ? 0.5 : 1,
                background: tab === 'atendidos'
                  ? 'var(--cs-success-text, #2E7D32)'
                  : 'var(--cs-danger-text, #C62828)',
                color: '#fff',
              }}
            >
              {tab === 'atendidos'
                ? <HiCheckCircle size={15} />
                : <HiXCircle size={15} />
              }
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helpers de estilo ──────────────────────────────────────────── */
const thStyle = (_?: string): React.CSSProperties => ({
  padding: '11px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--cs-text-secondary, #4A6275)',
  borderBottom: '1px solid var(--cs-border, #D1E3EE)',
  whiteSpace: 'nowrap',
})

const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: '12px 16px',
  fontSize: '13px',
  color: 'var(--cs-text-primary, #1A2B3C)',
  borderBottom: '1px solid var(--cs-border, #D1E3EE)',
  verticalAlign: 'middle',
  ...extra,
})

export default MedicoAtencion