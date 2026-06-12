import { useState } from 'react'
import {
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineTable,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiXCircle,
} from 'react-icons/hi'
import {
  getListadoDoctoresService,
  getListadoHorariosService,
  getListadoCitasService,
} from '../../services/gerente.service'
import { exportarPDF, exportarExcel } from '../../hooks/useExportReporte'

/* ─── Badge de estado ────────────────────────────────────────────── */
const BadgeEstado = ({ estado }: { estado: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    activo:      { bg: '#E8F5E9', color: '#2E7D32' },
    inactivo:    { bg: '#F0F4F8', color: '#4A6275' },
    atendida:    { bg: '#E8F5E9', color: '#2E7D32' },
    cancelada:   { bg: '#FFEBEE', color: '#C62828' },
    programada:  { bg: '#E0F7FC', color: '#0B85A3' },
    en_espera:   { bg: '#FFF8E1', color: '#F57F17' },
    inasistente: { bg: '#F0F4F8', color: '#4A6275' },
  }
  const s = map[estado] ?? { bg: '#F0F4F8', color: '#4A6275' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      borderRadius: '4px', fontSize: '11px', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {estado}
    </span>
  )
}

/* ─── Estilos de tabla ───────────────────────────────────────────── */
const TH: React.CSSProperties = {
  padding: '11px 16px', fontSize: '11px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--cs-text-secondary, #4A6275)',
  background: 'var(--cs-bg-base, #F0F4F8)',
  borderBottom: '1px solid var(--cs-border, #D1E3EE)',
  whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = {
  padding: '11px 16px', fontSize: '13px',
  color: 'var(--cs-text-primary, #1A2B3C)',
  borderBottom: '1px solid var(--cs-border, #D1E3EE)',
  verticalAlign: 'middle',
}

/* ══════════════════════════════════════════════════════════════════ */
const GerenteListados = () => {
  const [tab,          setTab]          = useState<'doctores' | 'horarios' | 'citas'>('doctores')
  const [datos,        setDatos]        = useState<any[]>([])
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')
  const [exportando,   setExportando]   = useState<'pdf' | 'excel' | null>(null)

  /* ── handleVer (lógica intacta) ─────────────────────────────── */
  const handleVer = async () => {
    setError(''); setCargando(true)
    try {
      if (tab === 'doctores') {
        setDatos(await getListadoDoctoresService({ estado: filtroEstado || undefined }))
      } else if (tab === 'horarios') {
        setDatos(await getListadoHorariosService())
      } else {
        setDatos(await getListadoCitasService({
          desde:  filtroDesde  || undefined,
          hasta:  filtroHasta  || undefined,
          estado: filtroEstado || undefined,
        }))
      }
    } catch {
      setError('Error al obtener el listado')
    } finally {
      setCargando(false)
    }
  }

  /* ── handleExportar (lógica intacta) ────────────────────────── */
  const handleExportar = (formato: 'pdf' | 'excel') => {
    if (!datos.length) { setError('Primero carga el listado antes de exportar.'); return }
    setError(''); setExportando(formato)
    try {
      const base = { desde: filtroDesde || '', hasta: filtroHasta || '' }
      if (tab === 'doctores') {
        const payload = { tipo: 'listado_doctores' as const, datos, filtroEstado: filtroEstado || undefined, ...base }
        formato === 'pdf' ? exportarPDF(payload) : exportarExcel(payload)
      } else if (tab === 'horarios') {
        const payload = { tipo: 'listado_horarios' as const, datos, ...base }
        formato === 'pdf' ? exportarPDF(payload) : exportarExcel(payload)
      } else {
        const payload = { tipo: 'listado_citas' as const, datos, filtroEstado: filtroEstado || undefined, ...base }
        formato === 'pdf' ? exportarPDF(payload) : exportarExcel(payload)
      }
    } catch {
      setError('Error al exportar. Intenta nuevamente.')
    } finally {
      setExportando(null)
    }
  }

  /* ── Tabs config ─────────────────────────────────────────────── */
  const TABS = [
    { key: 'doctores', Icon: HiOutlineUserCircle, label: 'Doctores' },
    { key: 'horarios', Icon: HiOutlineClock,      label: 'Horarios' },
    { key: 'citas',    Icon: HiOutlineCalendar,   label: 'Citas'    },
  ] as const

  /* ── Input style helpers ─────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1.5px solid var(--cs-border, #D1E3EE)',
    borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit',
    color: 'var(--cs-text-primary, #1A2B3C)', background: '#fff',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#0EA5C8'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,200,0.2)'
  }
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#D1E3EE'; e.target.style.boxShadow = 'none'
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--cs-text-secondary, #4A6275)',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  return (
    <div style={{ fontFamily: 'var(--font-main, Inter, sans-serif)' }}>

      {/* ── Título ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <HiOutlineClipboardList size={22} color="var(--cs-primary, #0EA5C8)" />
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cs-text-primary, #1A2B3C)', margin: 0 }}>
          Ver Listados
        </h4>
      </div>

      {/* ── Alerta ────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--cs-danger-bg, #FFEBEE)',
          color: 'var(--cs-danger-text, #C62828)',
          borderLeft: '4px solid var(--cs-danger-text, #C62828)',
          fontSize: '14px',
        }}>
          <HiXCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '4px',
        borderBottom: '2px solid var(--cs-border, #D1E3EE)',
        marginBottom: '24px',
      }}>
        {TABS.map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setDatos([]) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 18px', background: 'transparent', border: 'none',
              borderBottom: tab === key ? '2px solid var(--cs-primary, #0EA5C8)' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer', fontSize: '14px',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--cs-primary, #0EA5C8)' : 'var(--cs-text-secondary, #4A6275)',
              transition: 'color 0.15s', whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} color={tab === key ? 'var(--cs-primary, #0EA5C8)' : '#8FA3B1'} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Panel de filtros ──────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '10px',
        border: '1px solid var(--cs-border, #D1E3EE)',
        boxShadow: '0 1px 3px rgba(15,47,69,0.06)',
        padding: '16px 20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <HiOutlineFilter size={14} color="var(--cs-text-muted, #8FA3B1)" />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cs-text-muted, #8FA3B1)' }}>
            Filtros
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

          {/* Filtro estado — doctores y citas */}
          {(tab === 'doctores' || tab === 'citas') && (
            <div>
              <label style={labelStyle}>Estado</label>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                onFocus={focusIn} onBlur={focusOut}
                style={{ ...inputStyle, minWidth: '150px', paddingRight: '28px', appearance: 'auto' }}
              >
                <option value="">Todos</option>
                {tab === 'doctores'
                  ? ['activo', 'inactivo'].map(e => <option key={e} value={e}>{e}</option>)
                  : ['programada', 'en_espera', 'atendida', 'cancelada', 'inasistente'].map(e => <option key={e} value={e}>{e}</option>)
                }
              </select>
            </div>
          )}

          {/* Filtros fecha — solo citas */}
          {tab === 'citas' && (
            <>
              {['Desde', 'Hasta'].map(lbl => {
                const val     = lbl === 'Desde' ? filtroDesde : filtroHasta
                const handler = lbl === 'Desde'
                  ? (e: React.ChangeEvent<HTMLInputElement>) => setFiltroDesde(e.target.value)
                  : (e: React.ChangeEvent<HTMLInputElement>) => setFiltroHasta(e.target.value)
                return (
                  <div key={lbl}>
                    <label style={labelStyle}>{lbl}</label>
                    <input
                      type="date" value={val} onChange={handler}
                      onFocus={focusIn} onBlur={focusOut}
                      style={inputStyle}
                    />
                  </div>
                )
              })}
            </>
          )}

          <button
            onClick={handleVer}
            disabled={cargando}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: cargando ? 'var(--cs-border, #D1E3EE)' : 'var(--cs-primary, #0EA5C8)',
              color: cargando ? 'var(--cs-text-muted)' : '#fff',
              fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
              cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {cargando
              ? <><HiOutlineRefresh size={15} style={{ animation: 'cs-spin 0.7s linear infinite' }} /> Cargando...</>
              : <><HiOutlineClipboardList size={15} /> Ver</>
            }
            <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </div>

      {/* ── Botones exportar ──────────────────────────────────── */}
      {datos.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          padding: '14px 18px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--cs-primary-light, #E0F7FC)',
          border: '1px solid var(--cs-border, #D1E3EE)',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cs-text-secondary, #4A6275)' }}>
            Exportar:
          </span>
          <button
            onClick={() => handleExportar('pdf')}
            disabled={exportando !== null}
            title="Descargar como PDF"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: '#C62828', color: '#fff',
              fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
              cursor: exportando !== null ? 'not-allowed' : 'pointer',
              opacity: exportando !== null ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            <HiOutlineDocumentText size={14} />
            {exportando === 'pdf' ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={() => handleExportar('excel')}
            disabled={exportando !== null}
            title="Exportar como Excel / XLSX"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: '#1d6f42', color: '#fff',
              fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
              cursor: exportando !== null ? 'not-allowed' : 'pointer',
              opacity: exportando !== null ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            <HiOutlineTable size={14} />
            {exportando === 'excel' ? 'Generando...' : 'Excel / XLSX'}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--cs-text-muted, #8FA3B1)', marginLeft: '4px' }}>
            Se exportan los {datos.length} registro{datos.length !== 1 ? 's' : ''} cargados
          </span>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {datos.length === 0 && !cargando ? (
        <div style={{ textAlign: 'center', padding: '64px 20px' }}>
          <HiOutlineClipboardList size={52} style={{ color: 'var(--cs-border, #D1E3EE)', marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', color: 'var(--cs-text-secondary, #4A6275)' }}>
            Haz clic en "Ver" para cargar el listado
          </p>
        </div>
      ) : datos.length > 0 && (

        /* ── Card tabla ───────────────────────────────────────── */
        <div style={{
          background: '#fff', borderRadius: '12px',
          border: '1px solid var(--cs-border, #D1E3EE)',
          boxShadow: '0 1px 3px rgba(15,47,69,0.08)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px',
            background: 'var(--cs-bg-base, #F0F4F8)',
            borderBottom: '1px solid var(--cs-border, #D1E3EE)',
            fontSize: '13px', fontWeight: 600,
            color: 'var(--cs-text-primary, #1A2B3C)',
          }}>
            {datos.length} registro{datos.length !== 1 ? 's' : ''} encontrado{datos.length !== 1 ? 's' : ''}
          </div>

          <div style={{ overflowX: 'auto' }}>

            {/* ── Tabla doctores ──────────────────────────────── */}
            {tab === 'doctores' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Nombre','Especialidades','Email','Teléfono','Estado'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((d, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFCFE' }}>
                      <td style={{ ...TD, fontWeight: 500 }}>{d.nombre}</td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--cs-text-secondary)' }}>{d.especialidades || '—'}</td>
                      <td style={{ ...TD, fontSize: '12px' }}>{d.email || '—'}</td>
                      <td style={TD}>{d.telefono || '—'}</td>
                      <td style={TD}><BadgeEstado estado={d.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Tabla horarios ──────────────────────────────── */}
            {tab === 'horarios' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Médico','Especialidad','Días','Turno mañana','Turno tarde','Duración'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((h, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFCFE' }}>
                      <td style={{ ...TD, fontWeight: 500 }}>{h.medico}</td>
                      <td style={TD}>{h.especialidad}</td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--cs-text-secondary)' }}>{h.dias}</td>
                      <td style={{ ...TD, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                        {h.hora_inicio_manana && h.hora_fin_manana
                          ? `${h.hora_inicio_manana.substring(0, 5)} – ${h.hora_fin_manana.substring(0, 5)}`
                          : <span style={{ color: 'var(--cs-text-muted)' }}>—</span>
                        }
                      </td>
                      <td style={{ ...TD, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
                        {h.hora_inicio_tarde && h.hora_fin_tarde
                          ? `${h.hora_inicio_tarde.substring(0, 5)} – ${h.hora_fin_tarde.substring(0, 5)}`
                          : <span style={{ color: 'var(--cs-text-muted)' }}>—</span>
                        }
                      </td>
                      <td style={TD}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px',
                          fontSize: '11px', fontWeight: 600,
                          background: 'var(--cs-primary-light, #E0F7FC)',
                          color: 'var(--cs-info-text, #0B85A3)',
                        }}>
                          {h.duracion_cita_min} min
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Tabla citas ─────────────────────────────────── */}
            {tab === 'citas' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha','Hora','Paciente','Doctor','Especialidad','Estado'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((c, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFCFE' }}>
                      <td style={{ ...TD, fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(c.fecha).toLocaleDateString('es-BO', { timeZone: 'UTC' })}
                      </td>
                      <td style={{ ...TD, fontVariantNumeric: 'tabular-nums' }}>{c.hora.substring(0, 5)}</td>
                      <td style={{ ...TD, fontWeight: 500 }}>{c.paciente}</td>
                      <td style={TD}>{c.medico}</td>
                      <td style={{ ...TD, fontSize: '12px', color: 'var(--cs-text-secondary)' }}>{c.especialidad}</td>
                      <td style={TD}><BadgeEstado estado={c.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

export default GerenteListados