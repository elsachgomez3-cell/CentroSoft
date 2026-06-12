import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import { getKPIsService } from '../../services/dashboard.service'
import type { KPIs } from '../../services/dashboard.service'
import {
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineClipboard,
  HiOutlineCheckCircle,
} from 'react-icons/hi'

// ── Colores de estado de citas (design guide) ──────────────────────────────
const estadoBadge: Record<string, React.CSSProperties> = {
  programada:  { backgroundColor: '#E0F7FC', color: '#0B85A3' },
  en_espera:   { backgroundColor: '#FFF8E1', color: '#F57F17' },
  atendida:    { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  cancelada:   { backgroundColor: '#FFEBEE', color: '#C62828' },
  inasistente: { backgroundColor: '#F0F4F8', color: '#4A6275' },
}

// ── KPICard ────────────────────────────────────────────────────────────────
const KPICard = ({
  icono, titulo, valor, bgColor, iconColor, subtitulo
}: {
  icono:      React.ReactNode
  titulo:     string
  valor:      string | number
  bgColor:    string
  iconColor:  string
  subtitulo?: string
}) => (
  <div style={{
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #D1E3EE',
    boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
    padding: '20px',
    height: '100%',
    fontFamily: "'Inter', sans-serif",
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      {/* Ícono */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px',
        backgroundColor: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: iconColor, fontSize: '22px',
      }}>
        {icono}
      </div>
      {/* Texto */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          {titulo}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#1A2B3C', lineHeight: 1 }}>
          {valor}
        </div>
        {subtitulo && (
          <div style={{ fontSize: '11px', color: '#8FA3B1', marginTop: '3px' }}>{subtitulo}</div>
        )}
      </div>
    </div>
  </div>
)

// ── Card contenedor reutilizable ───────────────────────────────────────────
const Panel = ({ title, extra, children, noPad = false }: {
  title: string; extra?: React.ReactNode; children: React.ReactNode; noPad?: boolean
}) => (
  <div style={{
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #D1E3EE',
    boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
    overflow: 'hidden',
    height: '100%',
    fontFamily: "'Inter', sans-serif",
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid #EEF4F8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B3C' }}>{title}</span>
      {extra}
    </div>
    <div style={{ flex: 1, padding: noPad ? 0 : '20px', overflow: 'hidden' }}>
      {children}
    </div>
  </div>
)

// ── Avatar inicial ─────────────────────────────────────────────────────────
const AvatarInicial = ({ texto }: { texto: string }) => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5C8, #1A4B6B)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 600, color: '#fff', flexShrink: 0,
  }}>
    {texto.charAt(0).toUpperCase()}
  </div>
)

// ── Componente principal ───────────────────────────────────────────────────
const AdminDashboardHome = () => {
  const [kpis,     setKpis]     = useState<KPIs | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    getKPIsService()
      .then(data => setKpis(data))
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #D1E3EE',
        borderTopColor: '#0EA5C8',
        borderRadius: '50%',
        animation: 'cs-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 16px', borderRadius: '10px',
      backgroundColor: '#FFEBEE', color: '#C62828',
      borderLeft: '4px solid #C62828', fontSize: '14px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {error}
    </div>
  )

  if (!kpis) return null

  // Datos del gráfico — convertir strings a números
  const datosGrafico = kpis.citasSemana.map(d => ({
    dia:        d.dia,
    Total:      parseInt(d.total),
    Atendidas:  parseInt(d.atendidas),
    Canceladas: parseInt(d.canceladas)
  }))

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  // Ícono de acción en auditoría
  const iconAccion: Record<string, React.ReactNode> = {
    INSERT: <HiOutlinePlus   style={{ fontSize: '15px', color: '#2E7D32' }} />,
    UPDATE: <HiOutlinePencil style={{ fontSize: '15px', color: '#F57F17' }} />,
    DELETE: <HiOutlineTrash  style={{ fontSize: '15px', color: '#C62828' }} />,
  }
  const colorAccion: Record<string, string> = {
    INSERT: '#2E7D32',
    UPDATE: '#F57F17',
    DELETE: '#C62828',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>
            Bienvenido, Administrador
          </h4>
          <p style={{ fontSize: '13px', color: '#8FA3B1', marginTop: '4px', textTransform: 'capitalize' }}>
            {hoy}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          backgroundColor: '#E8F5E9', color: '#2E7D32',
          fontSize: '12px', fontWeight: 600,
          padding: '5px 12px', borderRadius: '20px',
        }}>
          <HiOutlineCheckCircle style={{ fontSize: '14px' }} />
          Sistema activo
        </span>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}
           className="cs-kpi-grid">
        <KPICard icono={<HiOutlineUser />}     titulo="Pacientes activos"  valor={kpis.totales.pacientes_activos}  bgColor="#E8F5E9" iconColor="#2E7D32" />
        <KPICard icono={<HiOutlineUsers />}    titulo="Personal activo"    valor={kpis.totales.personal_activo}    bgColor="#E0F7FC" iconColor="#0B85A3" />
        <KPICard icono={<HiOutlineCalendar />} titulo="Citas hoy"          valor={kpis.totales.citas_hoy}          bgColor="#FFF8E1" iconColor="#F57F17" />
        <KPICard icono={<HiOutlineMail />}     titulo="Mensajes sin leer"  valor={kpis.totales.mensajes_no_leidos} bgColor="#FFEBEE" iconColor="#C62828" />
      </div>

      {/* ── Estado de citas de hoy ──────────────────────────────────────── */}
      <Panel title="Estado de citas — Hoy">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', textAlign: 'center' }}
             className="cs-estado-grid">
          {[
            { label: 'Total',        valor: kpis.citasHoy.total,        color: '#1A4B6B' },
            { label: 'Programadas',  valor: kpis.citasHoy.programadas,  color: '#0B85A3' },
            { label: 'En espera',    valor: kpis.citasHoy.en_espera,    color: '#F57F17' },
            { label: 'Atendidas',    valor: kpis.citasHoy.atendidas,    color: '#2E7D32' },
            { label: 'Canceladas',   valor: kpis.citasHoy.canceladas,   color: '#C62828' },
            { label: 'Inasistentes', valor: kpis.citasHoy.inasistentes, color: '#4A6275' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: item.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {item.valor}
              </div>
              <div style={{ fontSize: '12px', color: '#8FA3B1', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Gráfico + Próximas citas ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}
           className="cs-chart-grid">

        {/* Gráfico */}
        <div style={{ gridColumn: 'span 7' }}>
          <Panel title="Citas de los últimos 7 días">
            {datosGrafico.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8FA3B1', padding: '32px 0', fontSize: '14px' }}>
                No hay datos de la semana actual
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={datosGrafico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF4F8" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#4A6275', fontFamily: 'Inter' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#4A6275', fontFamily: 'Inter' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #D1E3EE', fontSize: '13px', fontFamily: 'Inter' }}
                    cursor={{ fill: 'rgba(14,165,200,0.06)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }} />
                  <Bar dataKey="Total"      fill="#0EA5C8" radius={[4,4,0,0]} />
                  <Bar dataKey="Atendidas"  fill="#2E7D32" radius={[4,4,0,0]} />
                  <Bar dataKey="Canceladas" fill="#C62828" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* Próximas citas */}
        <div style={{ gridColumn: 'span 5' }}>
          <Panel title="Próximas citas de hoy" noPad>
            {kpis.proximasCitas.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8FA3B1', padding: '32px 16px' }}>
                <HiOutlineCalendar style={{ fontSize: '36px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px' }}>No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div>
                {kpis.proximasCitas.map((c, i) => (
                  <div key={i} style={{
                    padding: '12px 20px',
                    borderBottom: i < kpis.proximasCitas.length - 1 ? '1px solid #EEF4F8' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.paciente}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8FA3B1', marginTop: '2px' }}>
                        {c.medico} · {c.especialidad}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A2B3C', fontVariantNumeric: 'tabular-nums' }}>
                        {c.hora.substring(0, 5)}
                      </div>
                      <span style={{
                        ...(estadoBadge[c.estado] || estadoBadge['programada']),
                        fontSize: '10px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '20px',
                        display: 'inline-block', marginTop: '3px',
                        textTransform: 'capitalize',
                      }}>
                        {c.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Actividad reciente + Usuarios activos ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}
           className="cs-activity-grid">

        {/* Actividad reciente */}
        <div style={{ gridColumn: 'span 7' }}>
          <Panel title="Actividad reciente del sistema" noPad>
            {kpis.actividadReciente.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8FA3B1', padding: '32px 16px', fontSize: '13px' }}>
                No hay actividad registrada aún
              </div>
            ) : (
              <div>
                {kpis.actividadReciente.map((a, i) => {
                  const fecha = new Date(a.fecha).toLocaleString('es-BO', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })
                  return (
                    <div key={i} style={{
                      padding: '11px 20px',
                      borderBottom: i < kpis.actividadReciente.length - 1 ? '1px solid #EEF4F8' : 'none',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      {/* Ícono acción */}
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        backgroundColor: a.accion === 'INSERT' ? '#E8F5E9' : a.accion === 'UPDATE' ? '#FFF8E1' : '#FFEBEE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {iconAccion[a.accion] || <HiOutlineClipboard style={{ fontSize: '15px', color: '#4A6275' }} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: colorAccion[a.accion] || '#4A6275' }}>
                            {a.accion}
                          </span>
                          <span style={{ color: '#4A6275' }}> en </span>
                          <span style={{ fontWeight: 500, color: '#1A2B3C' }}>{a.tabla_afectada}</span>
                          {a.id_registro && (
                            <span style={{ color: '#8FA3B1' }}> (ID: {a.id_registro})</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8FA3B1', marginTop: '2px' }}>
                          por {a.nombre_usuario}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#8FA3B1', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {fecha}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Usuarios activos */}
        <div style={{ gridColumn: 'span 5' }}>
          <Panel
            title="Usuarios activos"
            extra={<span style={{ fontSize: '11px', color: '#8FA3B1' }}>Últimas 2 horas</span>}
            noPad
          >
            {kpis.usuariosActivos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8FA3B1', padding: '32px 16px' }}>
                <HiOutlineUser style={{ fontSize: '36px', display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px' }}>No hay usuarios activos</p>
              </div>
            ) : (
              <div>
                {kpis.usuariosActivos.map((u, i) => {
                  const hace = Math.round(
                    (Date.now() - new Date(u.ultimo_acceso).getTime()) / 60000
                  )
                  return (
                    <div key={i} style={{
                      padding: '11px 20px',
                      borderBottom: i < kpis.usuariosActivos.length - 1 ? '1px solid #EEF4F8' : 'none',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <AvatarInicial texto={u.nom_usuario} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3C' }}>
                          {u.nom_usuario}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8FA3B1', textTransform: 'capitalize' }}>
                          {u.rol}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {/* Punto verde activo */}
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          backgroundColor: '#2E7D32',
                          boxShadow: '0 0 0 2px #E8F5E9',
                        }} />
                        <span style={{ fontSize: '11px', color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>
                          hace {hace} min
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Responsive grid overrides */}
      <style>{`
        @media (min-width: 768px) {
          .cs-kpi-grid    { grid-template-columns: repeat(4, 1fr) !important; }
          .cs-estado-grid { grid-template-columns: repeat(6, 1fr) !important; }
          .cs-chart-grid    { display: grid !important; grid-template-columns: 7fr 5fr !important; }
          .cs-activity-grid { display: grid !important; grid-template-columns: 7fr 5fr !important; }
          .cs-chart-grid    > div, .cs-activity-grid > div { grid-column: span 1 !important; }
        }
        @media (max-width: 767px) {
          .cs-kpi-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .cs-estado-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboardHome