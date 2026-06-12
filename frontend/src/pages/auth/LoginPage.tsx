import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { loginService } from '../../services/auth.service'
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle } from 'react-icons/hi'
import logo from '../../assets/logo.png'

const LoginPage = () => {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [nomUsuario, setNomUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)

  const redirigirPorRol = (rol: string) => {
    const rutas: Record<string, string> = {
      admin:         '/admin',
      paciente:      '/paciente',
      medico:        '/medico',
      gerente:       '/gerente',
      recepcionista: '/recepcionista',
      enfermera:     '/enfermera',
      auxiliar:      '/auxiliar'
    }
    navigate(rutas[rol] || '/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nomUsuario.trim() || !contrasena.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setCargando(true)
    try {
      const resultado = await loginService(nomUsuario, contrasena)
      login(resultado.token, resultado.usuario)
      redirigirPorRol(resultado.usuario.rol)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--cs-bg-base)',
      padding:        '24px',
    }}>

      <div style={{
        width:        '100%',
        maxWidth:     '420px',
        background:   'var(--cs-bg-surface)',
        borderRadius: 'var(--cs-radius-xl)',
        border:       '1px solid var(--cs-border)',
        boxShadow:    'var(--cs-shadow-lg)',
        overflow:     'hidden',
      }}>

        {/* Header */}
        <div style={{
          background:  'linear-gradient(135deg, var(--cs-secondary-dark) 0%, var(--cs-secondary) 100%)',
          padding:     '32px 24px',
          textAlign:   'center',
        }}>
          <div style={{
            width:          '52px',
            height:         '52px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
          }}>
            <img
              src={logo}
              alt="CentroSoft"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>
            Centro<span style={{ color: 'var(--cs-accent)' }}>Soft</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
            Sistema de Gestión Médica
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 28px' }}>

          <h2 style={{
            textAlign:    'center',
            fontSize:     '16px',
            fontWeight:   600,
            color:        'var(--cs-text-secondary)',
            marginBottom: '24px',
          }}>
            Inicio de sesión
          </h2>

          {error && (
            <div className="alert alert-danger" style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              marginBottom: '20px',
            }}>
              <HiOutlineExclamationCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="cs-field-group">
              <label className="cs-label">Usuario</label>
              <input
                type="text"
                className="cs-input"
                placeholder="Nombre de usuario"
                value={nomUsuario}
                onChange={e => setNomUsuario(e.target.value)}
                disabled={cargando}
                autoFocus
              />
            </div>

            <div className="cs-field-group">
              <label className="cs-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verContrasena ? 'text' : 'password'}
                  className="cs-input"
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={e => setContrasena(e.target.value)}
                  disabled={cargando}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena(!verContrasena)}
                  tabIndex={-1}
                  style={{
                    position:   'absolute',
                    right:      '12px',
                    top:        '50%',
                    transform:  'translateY(-50%)',
                    background: 'none',
                    border:     'none',
                    cursor:     'pointer',
                    color:      'var(--cs-text-muted)',
                    display:    'flex',
                    alignItems: 'center',
                    padding:    '2px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--cs-text-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--cs-text-muted)')}
                >
                  {verContrasena
                    ? <HiOutlineEyeOff size={18} />
                    : <HiOutlineEye    size={18} />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="cs-btn cs-btn-primary"
              disabled={cargando}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {cargando ? (
                <>
                  <span style={{
                    width:        '14px',
                    height:       '14px',
                    border:       '2px solid rgba(255,255,255,0.3)',
                    borderTop:    '2px solid #fff',
                    borderRadius: '50%',
                    display:      'inline-block',
                    animation:    'spin 0.7s linear infinite',
                  }} />
                  Ingresando...
                </>
              ) : 'Iniciar sesión'}
            </button>

          </form>

          <p style={{
            textAlign:  'center',
            fontSize:   '13px',
            color:      'var(--cs-text-muted)',
            marginTop:  '20px',
            marginBottom: 0,
          }}>
            ¿Aún no tienes una cuenta?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--cs-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Regístrate
            </Link>
          </p>

          {/* ───── Nuevo enlace a Inicio ───── */}
          <div style={{
            textAlign: 'center',
            marginTop: '18px',
          }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: 'var(--cs-text-muted)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.15s',
                padding: '4px 8px',
                borderRadius: 'var(--cs-radius-sm)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--cs-primary)'
                e.currentTarget.style.background = 'rgba(var(--cs-primary-rgb), 0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--cs-text-muted)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ← Volver al inicio
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          borderTop:  '1px solid var(--cs-border)',
          padding:    '12px',
          textAlign:  'center',
          background: 'var(--cs-bg-base)',
        }}>
          <small style={{ fontSize: '12px', color: 'var(--cs-text-muted)' }}>
            CentroSoft © 2026
          </small>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </div>
  )
}

export default LoginPage