import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  getMiPerfilService,
  cambiarContrasenaService
} from '../../services/perfil.service'
import type { PerfilPaciente } from '../../services/perfil.service'
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineCog,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi'

const Alerta = ({
  tipo, children,
}: {
  tipo: 'danger' | 'success'; children: React.ReactNode
}) => {
  const s = tipo === 'danger'
    ? { bg: '#FFEBEE', color: '#C62828', border: '#C62828', Icon: HiOutlineExclamationCircle }
    : { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32', Icon: HiOutlineCheckCircle }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', borderRadius: '8px',
      backgroundColor: s.bg, color: s.color,
      borderLeft: `4px solid ${s.border}`,
      fontSize: '13px', marginBottom: '16px',
    }}>
      <s.Icon style={{ fontSize: '17px', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: '#4A6275', marginBottom: '5px',
  }}>
    {children}
  </label>
)

const PassInput = ({
  value, onChange, placeholder, visible, onToggle, required,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  visible: boolean
  onToggle: () => void
  required?: boolean
}) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '9px 42px 9px 13px',
          border: `1.5px solid ${focused ? '#0EA5C8' : '#D1E3EE'}`,
          borderRadius: '8px', fontSize: '13px',
          fontFamily: "'Inter', sans-serif", color: '#1A2B3C',
          backgroundColor: '#FFFFFF', outline: 'none',
          boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(14,165,200,0.18)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggle}
        style={{
          position: 'absolute', right: '10px', top: '50%',
          transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8FA3B1', display: 'flex', alignItems: 'center',
          padding: '2px',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#0EA5C8' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#8FA3B1' }}
      >
        {visible
          ? <HiOutlineEyeOff style={{ fontSize: '17px' }} />
          : <HiOutlineEye    style={{ fontSize: '17px' }} />
        }
      </button>
    </div>
  )
}

const BtnPrimary = ({ children, disabled }: {
  children: React.ReactNode; disabled?: boolean
}) => (
  <button
    type="submit"
    disabled={disabled}
    style={{
      width: '100%', padding: '10px 20px',
      backgroundColor: disabled ? '#8FA3B1' : '#0EA5C8',
      color: '#fff', border: 'none', borderRadius: '8px',
      fontSize: '13px', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      transition: 'background 0.2s',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0B85A3' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? '#8FA3B1' : '#0EA5C8' }}
  >
    {children}
  </button>
)

const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start',
    padding: '11px 0', borderBottom: '1px solid #EEF4F8',
    gap: '12px',
  }}>
    <span style={{
      fontSize: '12px', fontWeight: 500, color: '#8FA3B1',
      minWidth: '160px', flexShrink: 0, paddingTop: '1px',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {label}
    </span>
    <span style={{ fontSize: '13px', color: '#1A2B3C', fontWeight: 500 }}>
      {value}
    </span>
  </div>
)

const RecepcionistaPerfil = () => {
  useAuth()
  const [tab, setTab] = useState<'perfil' | 'contrasena'>('perfil')

  const [perfil,   setPerfil]   = useState<PerfilPaciente | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState('')

  const [formPass, setFormPass] = useState({
    contrasena_actual: '',
    contrasena_nueva:  '',
    confirmar:         '',
  })
  const [verActual,  setVerActual]  = useState(false)
  const [verNueva,   setVerNueva]   = useState(false)
  const [guardando,  setGuardando]  = useState(false)

  useEffect(() => { cargarPerfil() }, [])

  const cargarPerfil = async () => {
    setCargando(true)
    try {
      const res = await getMiPerfilService()
      setPerfil(res.datos)
    } catch {
      setError('Error al cargar el perfil')
    } finally {
      setCargando(false)
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
      setError('Las contraseñas nuevas no coinciden')
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
        contrasena_nueva:  formPass.contrasena_nueva,
      })
      setFormPass({ contrasena_actual: '', contrasena_nueva: '', confirmar: '' })
      mostrarExito('Contraseña actualizada correctamente')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

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

  const TABS = [
    { key: 'perfil',     label: 'Mi perfil',          Icon: HiOutlineUser        },
    { key: 'contrasena', label: 'Cambiar contraseña',  Icon: HiOutlineLockClosed  },
  ] as const

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <HiOutlineCog style={{ fontSize: '22px', color: '#0EA5C8' }} />
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>
          Configuración
        </h4>
      </div>

      <div style={{
        display: 'flex', gap: '4px', flexWrap: 'wrap',
        borderBottom: '2px solid #D1E3EE',
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setError(''); setExito('') }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '10px 18px',
                backgroundColor: active ? '#FFFFFF' : 'transparent',
                color: active ? '#0EA5C8' : '#4A6275',
                border: 'none',
                borderBottom: active ? '2px solid #0EA5C8' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                cursor: 'pointer', marginBottom: '-2px',
                fontFamily: "'Inter', sans-serif",
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#1A2B3C' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#4A6275' }}
            >
              <Icon style={{ fontSize: '15px' }} />
              {label}
            </button>
          )
        })}
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {tab === 'perfil' && perfil && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          overflow: 'hidden', maxWidth: '560px',
        }}>
          <div style={{
            padding: '28px 24px 24px',
            background: 'linear-gradient(135deg, #0F2F45 0%, #1A4B6B 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0EA5C8, #00D4FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.25)',
              fontSize: '28px', fontWeight: 700, color: '#FFFFFF',
            }}>
              {perfil.primer_nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                {perfil.primer_nombre} {perfil.apellido_pat}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 12px',
                borderRadius: '20px', backgroundColor: '#E0F7FC', color: '#0B85A3',
              }}>
                Recepcionista
              </span>
            </div>
          </div>

          <div style={{ padding: '8px 24px 20px' }}>
            <DataRow label="Usuario"  value={perfil.nom_usuario} />
            <DataRow label="Correo"   value={perfil.email || '—'} />
            <DataRow label="Teléfono" value={perfil.telefono || '—'} />
            <DataRow
              label="Estado"
              value={
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 11px',
                  borderRadius: '20px', backgroundColor: '#E8F5E9', color: '#2E7D32',
                  textTransform: 'capitalize',
                }}>
                  {perfil.estado}
                </span>
              }
            />
          </div>
        </div>
      )}

      {tab === 'contrasena' && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '12px',
          border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          overflow: 'hidden', maxWidth: '440px',
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #EEF4F8',
            backgroundColor: '#F8FBFD',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <HiOutlineShieldCheck style={{ fontSize: '16px', color: '#0EA5C8' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A2B3C' }}>
              Actualizar contraseña
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleCambiarContrasena}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div>
                  <Lbl>Contraseña actual</Lbl>
                  <PassInput
                    value={formPass.contrasena_actual}
                    onChange={e => setFormPass({ ...formPass, contrasena_actual: e.target.value })}
                    placeholder="Tu contraseña actual"
                    visible={verActual}
                    onToggle={() => setVerActual(!verActual)}
                    required
                  />
                </div>

                <div>
                  <Lbl>Nueva contraseña</Lbl>
                  <PassInput
                    value={formPass.contrasena_nueva}
                    onChange={e => setFormPass({ ...formPass, contrasena_nueva: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    visible={verNueva}
                    onToggle={() => setVerNueva(!verNueva)}
                    required
                  />
                </div>

                <div>
                  <Lbl>Confirmar nueva contraseña</Lbl>
                  <PassInput
                    value={formPass.confirmar}
                    onChange={e => setFormPass({ ...formPass, confirmar: e.target.value })}
                    placeholder="Repite la nueva contraseña"
                    visible={false}
                    onToggle={() => {}}
                    required
                  />
                </div>

                <div style={{ marginTop: '4px' }}>
                  <BtnPrimary disabled={guardando}>
                    {guardando ? (
                      <>
                        <div style={{
                          width: '14px', height: '14px',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'cs-spin 0.7s linear infinite',
                        }} />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <HiOutlineShieldCheck style={{ fontSize: '15px' }} />
                        Guardar cambios
                      </>
                    )}
                  </BtnPrimary>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default RecepcionistaPerfil