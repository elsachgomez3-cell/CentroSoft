import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registrarPacienteService } from '../../services/auth.service'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

/* ─── Estilos inline CentroSoft ─────────────────────────────────────────────
   Se usan style objects para no depender de clases Bootstrap ni CSS externo.
   Toda lógica, estados, hooks y servicios permanecen intactos.
   ─────────────────────────────────────────────────────────────────────────── */

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    fontFamily: "'Inter', sans-serif",
    padding: '24px 16px',
  } as React.CSSProperties,

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #D1E3EE',
    boxShadow: '0 4px 12px rgba(15, 47, 69, 0.10)',
    width: '100%',
    maxWidth: '560px',
    overflow: 'hidden',
  } as React.CSSProperties,

  cardSm: {
    maxWidth: '440px',
  } as React.CSSProperties,

  cardHeader: {
    background: 'linear-gradient(135deg, #1A4B6B 0%, #0EA5C8 100%)',
    padding: '20px 28px',
    textAlign: 'center' as const,
  },

  cardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  cardBody: {
    padding: '28px',
  } as React.CSSProperties,

  // Alerta de error
  alertDanger: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    borderLeft: '4px solid #C62828',
    fontSize: '13px',
    marginBottom: '20px',
    lineHeight: 1.5,
  } as React.CSSProperties,

  // Grupos de campos
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  rowFull: {
    marginBottom: '16px',
  } as React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },

  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#4A6275',
    marginBottom: '6px',
    display: 'block',
  } as React.CSSProperties,

  required: {
    color: '#C62828',
    marginLeft: '2px',
  } as React.CSSProperties,

  optional: {
    color: '#8FA3B1',
    fontSize: '11px',
    marginLeft: '4px',
    fontWeight: 400,
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #D1E3EE',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    color: '#1A2B3C',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  divider: {
    border: 'none',
    borderTop: '1px solid #EEF4F8',
    margin: '20px 0 16px',
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8FA3B1',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '14px',
  } as React.CSSProperties,

  // Botones
  btnPrimary: {
    width: '100%',
    padding: '11px 20px',
    backgroundColor: '#0EA5C8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.2s',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  btnSecondary: {
    width: '100%',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#0EA5C8',
    border: '1.5px solid #0EA5C8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'background 0.2s',
    fontFamily: "'Inter', sans-serif",
  } as React.CSSProperties,

  btnGap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '4px',
  },

  // Spinner
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'cs-spin 0.7s linear infinite',
    display: 'inline-block',
  } as React.CSSProperties,

  // Pantalla de éxito
  successIcon: {
    color: '#2E7D32',
    fontSize: '56px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
  } as React.CSSProperties,

  successTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A2B3C',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },

  successText: {
    fontSize: '14px',
    color: '#4A6275',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },

  // Términos — scroll box
  termsBox: {
    border: '1.5px solid #D1E3EE',
    borderRadius: '8px',
    padding: '16px',
    height: '220px',
    overflowY: 'auto' as const,
    fontSize: '13px',
    color: '#4A6275',
    lineHeight: 1.7,
    marginBottom: '24px',
    backgroundColor: '#F8FBFD',
  } as React.CSSProperties,

  termsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A2B3C',
    marginBottom: '10px',
  } as React.CSSProperties,
}

// ── Input con focus ring manejado por JS (sin CSS externo) ─────────────────
const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...S.input,
        borderColor: focused ? '#0EA5C8' : '#D1E3EE',
        boxShadow: focused ? '0 0 0 3px rgba(14, 165, 200, 0.20)' : 'none',
        ...props.style,
      }}
      onFocus={(e) => { setFocused(true);  props.onFocus?.(e) }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

// ── Componente principal ────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate()

  const [paso, setPaso]         = useState<'terminos' | 'formulario'>('terminos')
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState('')
  const [exito,    setExito]    = useState(false)

  const [form, setForm] = useState({
    primer_nombre: '',
    apellido_pat:  '',
    apellido_mat:  '',
    ci:            '',
    email:         '',
    telefono:      '',
    direccion:     '',
    fecha_nac:     '',
    nom_usuario:   '',
    contrasena:    '',
    confirmar:     ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.primer_nombre || !form.apellido_pat ||
        !form.ci || !form.email ||
        !form.nom_usuario || !form.contrasena) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    if (form.contrasena !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)
    try {
      await registrarPacienteService({
        primer_nombre: form.primer_nombre,
        apellido_pat:  form.apellido_pat,
        apellido_mat:  form.apellido_mat  || undefined,
        ci:            form.ci,
        email:         form.email,
        telefono:      form.telefono      || undefined,
        direccion:     form.direccion     || undefined,
        fecha_nac:     form.fecha_nac     || undefined,
        nom_usuario:   form.nom_usuario,
        contrasena:    form.contrasena
      })
      setExito(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (exito) {
    return (
      <div style={S.page}>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ ...S.card, ...S.cardSm }}>
          <div style={S.cardHeader}>
            <p style={S.cardHeaderTitle}>CentroSoft</p>
          </div>
          <div style={{ ...S.cardBody, textAlign: 'center', padding: '40px 28px' }}>
            <div style={S.successIcon}>
              <HiCheckCircle />
            </div>
            <p style={S.successTitle}>¡Registro exitoso!</p>
            <p style={S.successText}>Tu cuenta fue creada correctamente.</p>
            <button
              style={S.btnPrimary}
              onClick={() => navigate('/login')}
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Paso 1: Términos y condiciones ───────────────────────────────────────
  if (paso === 'terminos') {
    return (
      <div style={S.page}>
        <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ ...S.card, maxWidth: '500px' }}>

          <div style={S.cardHeader}>
            <p style={S.cardHeaderTitle}>Términos y Condiciones</p>
          </div>

          <div style={S.cardBody}>
            <div style={S.termsBox}>
              <p style={S.termsTitle}>CENTROSOFT — Términos de uso</p>
              <p style={{ marginBottom: '10px' }}>Al registrarte en CentroSoft aceptas los siguientes términos:</p>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Tus datos personales serán usados únicamente para la gestión de citas médicas.</li>
                <li>La información médica es confidencial y está protegida.</li>
                <li>Eres responsable de mantener tu contraseña segura.</li>
                <li>No puedes ceder tu cuenta a terceros.</li>
                <li>El sistema puede enviar notificaciones sobre tus citas.</li>
                <li>Puedes solicitar la eliminación de tu cuenta en cualquier momento.</li>
              </ul>
            </div>

            <div style={S.btnGap}>
              <button
                style={S.btnPrimary}
                onClick={() => setPaso('formulario')}
              >
                Acepto los términos y condiciones
              </button>
              <Link to="/login" style={S.btnSecondary}>
                Cancelar
              </Link>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── Paso 2: Formulario de registro ───────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        @media (max-width: 540px) {
          .cs-row-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={S.card}>

        <div style={S.cardHeader}>
          <p style={S.cardHeaderTitle}>Registro de Paciente</p>
        </div>

        <div style={S.cardBody}>

          {/* Alerta de error */}
          {error && (
            <div style={S.alertDanger}>
              <HiExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Nombre completo */}
            <div style={S.rowFull}>
              <label style={S.label}>
                Nombre completo <span style={S.required}>*</span>
              </label>
              <CsInput
                name="primer_nombre"
                placeholder="Primer nombre"
                value={form.primer_nombre}
                onChange={handleChange}
              />
            </div>

            <div className="cs-row-2col" style={S.row}>
              <div style={S.fieldGroup}>
                <CsInput
                  name="apellido_pat"
                  placeholder="Apellido paterno *"
                  value={form.apellido_pat}
                  onChange={handleChange}
                />
              </div>
              <div style={S.fieldGroup}>
                <CsInput
                  name="apellido_mat"
                  placeholder="Apellido materno"
                  value={form.apellido_mat}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* CI y Email */}
            <div className="cs-row-2col" style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  Carnet de identidad <span style={S.required}>*</span>
                </label>
                <CsInput
                  name="ci"
                  placeholder="Ej: 12345678"
                  value={form.ci}
                  onChange={handleChange}
                />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  Correo electrónico <span style={S.required}>*</span>
                </label>
                <CsInput
                  name="email"
                  type="email"
                  placeholder="correo@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Teléfono y fecha */}
            <div className="cs-row-2col" style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Teléfono</label>
                <CsInput
                  name="telefono"
                  placeholder="Ej: 78900000"
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Fecha de nacimiento</label>
                <CsInput
                  name="fecha_nac"
                  type="date"
                  value={form.fecha_nac}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Dirección */}
            <div style={S.rowFull}>
              <label style={S.label}>
                Dirección <span style={S.optional}>(opcional)</span>
              </label>
              <CsInput
                name="direccion"
                placeholder="Zona, calle, número"
                value={form.direccion}
                onChange={handleChange}
              />
            </div>

            {/* Separador */}
            <hr style={S.divider} />
            <p style={S.sectionLabel}>Datos de acceso al sistema</p>

            {/* Usuario y contraseña */}
            <div className="cs-row-2col" style={S.row}>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  Nombre de usuario <span style={S.required}>*</span>
                </label>
                <CsInput
                  name="nom_usuario"
                  placeholder="Ej: juan123"
                  value={form.nom_usuario}
                  onChange={handleChange}
                />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>
                  Contraseña <span style={S.required}>*</span>
                </label>
                <CsInput
                  name="contrasena"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.contrasena}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div style={{ ...S.rowFull, marginBottom: '24px' }}>
              <label style={S.label}>
                Confirmar contraseña <span style={S.required}>*</span>
              </label>
              <CsInput
                name="confirmar"
                type="password"
                placeholder="Repite la contraseña"
                value={form.confirmar}
                onChange={handleChange}
              />
            </div>

            {/* Botones */}
            <div style={S.btnGap}>
              <button
                type="submit"
                style={{
                  ...S.btnPrimary,
                  opacity: cargando ? 0.8 : 1,
                  cursor: cargando ? 'not-allowed' : 'pointer',
                }}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span style={S.spinner} />
                    Registrando...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>

              <Link to="/login" style={S.btnSecondary}>
                Volver al login
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage