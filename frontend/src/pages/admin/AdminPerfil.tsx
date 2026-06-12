import { useState, useEffect } from 'react'
import { getMiPerfilService, cambiarContrasenaService } from '../../services/perfil.service'
import type { PerfilPaciente } from '../../services/perfil.service'
import {
  getMensajesService,
  marcarMensajeLeidoService
} from '../../services/admin.service'
import type { MensajeContacto } from '../../services/admin.service'
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi'

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFechaHora = (fecha: string) =>
  new Date(fecha).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

// ── Componentes base (patrón AdminMedica) ─────────────────────────────────

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
        backgroundColor: props.disabled ? '#F0F4F8' : '#FFFFFF',
        outline: 'none', boxSizing: 'border-box' as const,
        boxShadow: focused ? '0 0 0 3px rgba(14,165,200,0.18)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => { if (!props.disabled) setFocused(true); props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A6275', marginBottom: '5px' }}>
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

const BtnPrimary = ({ children, type = 'button', disabled, onClick }: {
  children: React.ReactNode; type?: 'button' | 'submit';
  disabled?: boolean; onClick?: () => void
}) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    style={{
      width: '100%', padding: '10px 20px',
      backgroundColor: disabled ? '#8FA3B1' : '#0EA5C8',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '13px', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      transition: 'background 0.2s'
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0B85A3' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? '#8FA3B1' : '#0EA5C8' }}
  >
    {children}
  </button>
)

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{
    fontSize: '11px', fontWeight: 600, padding: '3px 10px',
    borderRadius: '20px', whiteSpace: 'nowrap' as const, ...style
  }}>
    {children}
  </span>
)

// ── Componente principal ──────────────────────────────────────────────────

const AdminPerfil = () => {
  const [tab, setTab] = useState<'perfil' | 'contrasena' | 'mensajes'>('perfil')

  const [perfil,   setPerfil]   = useState<PerfilPaciente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState('')

  const [formPass, setFormPass] = useState({
    contrasena_actual: '', contrasena_nueva: '', confirmar: ''
  })
  const [guardando, setGuardando] = useState(false)

  const [mensajes,    setMensajes]    = useState<MensajeContacto[]>([])
  const [cargandoMsj, setCargandoMsj] = useState(false)
  const [mensajeSel,  setMensajeSel]  = useState<MensajeContacto | null>(null)

  useEffect(() => {
    getMiPerfilService()
      .then(res => setPerfil(res.datos as any))
      .catch(() => setError('Error al cargar el perfil'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (tab === 'mensajes') cargarMensajes()
  }, [tab])

  const cargarMensajes = async () => {
    setCargandoMsj(true)
    try {
      const data = await getMensajesService()
      setMensajes(data)
    } catch {
      setError('Error al cargar mensajes')
    } finally {
      setCargandoMsj(false)
    }
  }

  const mostrarExito = (msg: string) => {
    setExito(msg)
    setTimeout(() => setExito(''), 4000)
  }

  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formPass.contrasena_nueva !== formPass.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (formPass.contrasena_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setGuardando(true)
    try {
      await cambiarContrasenaService({
        contrasena_actual: formPass.contrasena_actual,
        contrasena_nueva:  formPass.contrasena_nueva
      })
      setFormPass({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' })
      mostrarExito('Contraseña actualizada correctamente')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  const handleVerMensaje = async (msj: MensajeContacto) => {
    setMensajeSel(msj)
    if (!msj.leido) {
      await marcarMensajeLeidoService(msj.id_mensaje)
      setMensajes(prev =>
        prev.map(m => m.id_mensaje === msj.id_mensaje ? { ...m, leido: true } : m)
      )
    }
  }

  const noLeidos = mensajes.filter(m => !m.leido).length

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

  // Definición de tabs
  const TABS = [
    { key: 'perfil',     label: 'Mi perfil',          icon: <HiOutlineUser     style={{ fontSize: '16px' }} /> },
    { key: 'contrasena', label: 'Cambiar contraseña',  icon: <HiOutlineLockClosed style={{ fontSize: '16px' }} /> },
    { key: 'mensajes',   label: 'Mensajes',            icon: <HiOutlineMail     style={{ fontSize: '16px' }} />, badge: noLeidos },
  ] as const

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Título */}
      <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>
        Configuración
      </h4>

      {/* Tabs — patrón AdminMedica */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #D1E3EE' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(''); setExito('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: 'transparent',
              color: tab === t.key ? '#0EA5C8' : '#4A6275',
              borderBottom: tab === t.key ? '2px solid #0EA5C8' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'color 0.15s'
            }}
          >
            {t.icon}
            {t.label}
            {'badge' in t && t.badge > 0 && (
              <span style={{
                backgroundColor: '#FFEBEE', color: '#C62828',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '20px',
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* ── MI PERFIL ── */}
      {tab === 'perfil' && perfil && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          padding: '32px 28px', maxWidth: '480px'
        }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5C8, #1A4B6B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <span style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700 }}>
                {(perfil as any).primer_nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', margin: '0 0 6px' }}>
              {(perfil as any).primer_nombre} {(perfil as any).apellido_pat}
            </h5>
            <Badge style={{ backgroundColor: '#F3E5F5', color: '#6A1B9A' }}>
              administrador
            </Badge>
          </div>

          {/* Datos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Usuario',  value: perfil.nom_usuario   },
              { label: 'Correo',   value: perfil.email || '—'  },
              { label: 'Teléfono', value: perfil.telefono || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid #EEF4F8'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </span>
                <span style={{ fontSize: '13px', color: '#1A2B3C', fontWeight: 500 }}>
                  {value}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Estado
              </span>
              <Badge style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                {perfil.estado}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMBIAR CONTRASEÑA ── */}
      {tab === 'contrasena' && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          padding: '28px', maxWidth: '420px'
        }}>
          <form onSubmit={handleCambiarContrasena}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Lbl>Contraseña actual</Lbl>
                <CsInput
                  type="password"
                  value={formPass.contrasena_actual}
                  onChange={e => setFormPass({ ...formPass, contrasena_actual: e.target.value })}
                  required
                />
              </div>
              <div>
                <Lbl>Nueva contraseña</Lbl>
                <CsInput
                  type="password"
                  value={formPass.contrasena_nueva}
                  onChange={e => setFormPass({ ...formPass, contrasena_nueva: e.target.value })}
                  required
                />
              </div>
              <div>
                <Lbl>Confirmar nueva contraseña</Lbl>
                <CsInput
                  type="password"
                  value={formPass.confirmar}
                  onChange={e => setFormPass({ ...formPass, confirmar: e.target.value })}
                  required
                />
              </div>
              <div style={{ marginTop: '4px' }}>
                <BtnPrimary type="submit" disabled={guardando}>
                  <HiOutlineCheckCircle style={{ fontSize: '15px' }} />
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </BtnPrimary>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── MENSAJES DE CONTACTO ── */}
      {tab === 'mensajes' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 340px) 1fr',
          gap: '16px',
          alignItems: 'start',
        }}>

          {/* Lista */}
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '12px',
            border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '13px 16px', borderBottom: '1px solid #EEF4F8',
              fontSize: '13px', fontWeight: 600, color: '#4A6275'
            }}>
              Mensajes recibidos ({mensajes.length})
            </div>

            {cargandoMsj ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <div style={{
                  width: '28px', height: '28px',
                  border: '3px solid #D1E3EE', borderTopColor: '#0EA5C8',
                  borderRadius: '50%', animation: 'cs-spin 0.7s linear infinite'
                }} />
              </div>
            ) : mensajes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#8FA3B1', fontSize: '13px' }}>
                No hay mensajes
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {mensajes.map(m => {
                  const seleccionado = mensajeSel?.id_mensaje === m.id_mensaje
                  return (
                    <button
                      key={m.id_mensaje}
                      onClick={() => handleVerMensaje(m)}
                      style={{
                        background: seleccionado ? '#E0F7FC' : 'none',
                        border: 'none',
                        borderBottom: '1px solid #EEF4F8',
                        borderLeft: `4px solid ${!m.leido ? '#0EA5C8' : 'transparent'}`,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.backgroundColor = '#F8FBFD' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = seleccionado ? '#E0F7FC' : 'transparent' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3C' }}>
                          {m.nombre}
                        </span>
                        {!m.leido && (
                          <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            backgroundColor: '#0EA5C8', flexShrink: 0,
                            display: 'inline-block'
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px', color: '#4A6275',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '240px', marginBottom: '4px'
                      }}>
                        {m.asunto}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>
                        {formatFechaHora(m.fecha_envio)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Detalle del mensaje */}
          {mensajeSel ? (
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '12px',
              border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #EEF4F8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
              }}>
                <h6 style={{ fontSize: '14px', fontWeight: 700, color: '#1A2B3C', margin: 0, flex: 1 }}>
                  {mensajeSel.asunto}
                </h6>
                <button
                  onClick={() => setMensajeSel(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#8FA3B1', display: 'flex', alignItems: 'center',
                    padding: '4px', borderRadius: '6px', flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1A2B3C'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8FA3B1'}
                >
                  <HiOutlineX style={{ fontSize: '18px' }} />
                </button>
              </div>

              {/* Metadatos */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF4F8', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'De',    value: mensajeSel.nombre },
                  { label: 'Correo', value: mensajeSel.email },
                  { label: 'Fecha',  value: formatFechaHora(mensajeSel.fecha_envio) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex', gap: '16px',
                    padding: '8px 0', borderBottom: '1px solid #EEF4F8'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#8FA3B1', width: '80px', flexShrink: 0 }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '13px', color: '#1A2B3C' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '16px', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#8FA3B1', width: '80px', flexShrink: 0 }}>
                    Correo
                  </span>
                  <Badge style={
                    mensajeSel.correo_enviado
                      ? { backgroundColor: '#E8F5E9', color: '#2E7D32' }
                      : { backgroundColor: '#FFF8E1', color: '#F57F17' }
                  }>
                    {mensajeSel.correo_enviado
                      ? <><HiOutlineCheck style={{ display: 'inline', marginRight: '3px' }} />Enviado</>
                      : <><HiOutlineX     style={{ display: 'inline', marginRight: '3px' }} />No enviado</>
                    }
                  </Badge>
                </div>
              </div>

              {/* Cuerpo del mensaje */}
              <div style={{ padding: '20px' }}>
                <p style={{
                  fontSize: '13px', color: '#1A2B3C',
                  lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0
                }}>
                  {mensajeSel.mensaje}
                </p>
              </div>
            </div>
          ) : (
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
                <HiOutlineMail style={{ fontSize: '24px', color: '#8FA3B1' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#8FA3B1', margin: 0 }}>
                Selecciona un mensaje para verlo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPerfil