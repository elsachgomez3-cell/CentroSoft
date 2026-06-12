import { useState, useEffect } from 'react'
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi'
import { getMiPerfilService, cambiarContrasenaService } from '../../services/perfil.service'
import { useAuth } from '../../hooks/useAuth'

/* ─── Rol badge colors ───────────────────────────────────────────── */
const rolBadge = (rol: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    medico:        { bg: '#E0F7FC', color: '#0B85A3' },
    admin:         { bg: '#F3E5F5', color: '#6A1B9A' },
    recepcionista: { bg: '#EDE7F6', color: '#4527A0' },
    paciente:      { bg: '#E8F5E9', color: '#2E7D32' },
  }
  const s = map[rol?.toLowerCase()] ?? { bg: '#F0F4F8', color: '#4A6275' }
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'capitalize',
    background: s.bg,
    color: s.color,
  }
}

const MedicoPerfil = () => {
  const { rol } = useAuth()
  const [tab,      setTab]      = useState<'perfil' | 'contrasena'>('perfil')
  const [perfil,   setPerfil]   = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState('')
  const [formPass, setFormPass] = useState({
    contrasena_actual: '', contrasena_nueva: '', confirmar: '',
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    getMiPerfilService()
      .then(res => setPerfil(res.datos))
      .catch(() => setError('Error al cargar el perfil'))
      .finally(() => setCargando(false))
  }, [])

  const mostrarExito = (msg: string) => {
    setExito(msg); setTimeout(() => setExito(''), 4000)
  }

  const handleCambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (formPass.contrasena_nueva !== formPass.confirmar) {
      setError('Las contraseñas no coinciden'); return
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

  /* ─── Loading ─────────────────────────────────────────────────── */
  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0' }}>
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid var(--cs-border, #D1E3EE)',
        borderTopColor: 'var(--cs-primary, #0EA5C8)',
        borderRadius: '50%',
        animation: 'cs-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  /* ─── Iniciales avatar ────────────────────────────────────────── */
  const inicial = perfil?.primer_nombre?.charAt(0).toUpperCase() ?? '?'

  return (
    <div style={{ fontFamily: 'var(--font-main, Inter, sans-serif)' }}>

      {/* ── Título ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <HiOutlineUser size={22} color="var(--cs-primary, #0EA5C8)" />
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cs-text-primary, #1A2B3C)', margin: 0 }}>
          Configuración
        </h4>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid var(--cs-border, #D1E3EE)',
        marginBottom: '24px',
      }}>
        {([
          { key: 'perfil',     Icon: HiOutlineUser,       label: 'Mi perfil'          },
          { key: 'contrasena', Icon: HiOutlineLockClosed,  label: 'Cambiar contraseña' },
        ] as const).map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setError(''); setExito('') }}
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
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} color={tab === key ? 'var(--cs-primary, #0EA5C8)' : '#8FA3B1'} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Alertas ─────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--cs-danger-bg, #FFEBEE)',
          color: 'var(--cs-danger-text, #C62828)',
          borderLeft: '4px solid var(--cs-danger-text, #C62828)',
          fontSize: '14px', maxWidth: '500px',
        }}>
          <HiXCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}
      {exito && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--cs-success-bg, #E8F5E9)',
          color: 'var(--cs-success-text, #2E7D32)',
          borderLeft: '4px solid var(--cs-success-text, #2E7D32)',
          fontSize: '14px', maxWidth: '500px',
        }}>
          <HiCheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          {exito}
        </div>
      )}

      {/* ── Tab: Perfil ─────────────────────────────────────────── */}
      {tab === 'perfil' && perfil && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid var(--cs-border, #D1E3EE)',
          boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          maxWidth: '480px',
          overflow: 'hidden',
        }}>
          {/* Avatar header */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '32px 32px 24px',
            background: 'linear-gradient(160deg, var(--cs-secondary, #1A4B6B) 0%, var(--cs-secondary-dark, #0F2F45) 100%)',
          }}>
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #0EA5C8, #00D4FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontWeight: 700, color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}>
              {inicial}
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              {perfil.primer_nombre} {perfil.apellido_pat}
            </div>
            <span style={rolBadge(rol ?? '')}>
              {rol ?? '—'}
            </span>
          </div>

          {/* Datos */}
          <div style={{ padding: '8px 0' }}>
            {[
              { icon: HiOutlineIdentification, label: 'Usuario',  value: perfil.nom_usuario   },
              { icon: HiOutlineMail,            label: 'Correo',   value: perfil.email || '—'  },
              { icon: HiOutlinePhone,           label: 'Teléfono', value: perfil.telefono || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 24px',
                borderBottom: '1px solid var(--cs-border, #D1E3EE)',
              }}>
                <div style={{
                  width: '34px', height: '34px', flexShrink: 0,
                  borderRadius: '8px',
                  background: 'var(--cs-primary-light, #E0F7FC)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color="var(--cs-primary, #0EA5C8)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cs-text-muted, #8FA3B1)', marginBottom: '2px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--cs-text-primary, #1A2B3C)' }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
            {/* Quitar border-bottom del último */}
            <style>{`.cs-perfil-last { border-bottom: none !important; }`}</style>
          </div>
        </div>
      )}

      {/* ── Tab: Contraseña ─────────────────────────────────────── */}
      {tab === 'contrasena' && (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid var(--cs-border, #D1E3EE)',
          boxShadow: '0 1px 3px rgba(15,47,69,0.08)',
          maxWidth: '440px',
          overflow: 'hidden',
        }}>
          {/* Header de la card */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--cs-border, #D1E3EE)',
            background: 'var(--cs-bg-base, #F0F4F8)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <HiOutlineLockClosed size={16} color="var(--cs-text-secondary, #4A6275)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cs-text-primary, #1A2B3C)' }}>
              Cambiar contraseña
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleCambiarContrasena}>

              {[
                { key: 'contrasena_actual', label: 'Contraseña actual'          },
                { key: 'contrasena_nueva',  label: 'Nueva contraseña'           },
                { key: 'confirmar',         label: 'Confirmar nueva contraseña' },
              ].map(({ key, label }, idx) => (
                <div key={key} style={{ marginBottom: idx === 2 ? '24px' : '18px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px', fontWeight: 500,
                    color: 'var(--cs-text-secondary, #4A6275)',
                    marginBottom: '6px',
                  }}>
                    {label}
                  </label>
                  <input
                    type="password"
                    value={(formPass as any)[key]}
                    onChange={e => setFormPass({ ...formPass, [key]: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid var(--cs-border, #D1E3EE)',
                      borderRadius: '8px',
                      fontSize: '14px',
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
              ))}

              <button
                type="submit"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: guardando
                    ? 'var(--cs-border, #D1E3EE)'
                    : 'var(--cs-primary, #0EA5C8)',
                  color: guardando
                    ? 'var(--cs-text-muted, #8FA3B1)'
                    : '#fff',
                  transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <HiOutlineLockClosed size={15} />
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicoPerfil