import { useState, useEffect } from "react";
import type { Personal, Paciente } from "../../types";
import {
  getPersonalService,
  crearPersonalService,
  editarPersonalService,
  eliminarPersonalService,
  getPacientesService,
  editarPacienteService,
  eliminarPacienteService,
  getRolesService,
} from "../../services/admin.service";
import {
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

// ── Helpers visuales ───────────────────────────────────────────────────────

const rolBadge: Record<string, React.CSSProperties> = {
  admin:         { backgroundColor: '#F3E5F5', color: '#6A1B9A' },
  medico:        { backgroundColor: '#EDE7F6', color: '#4527A0' },
  paciente:      { backgroundColor: '#E0F7FC', color: '#0B85A3' },
  gerente:       { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  recepcionista: { backgroundColor: '#FFF8E1', color: '#F57F17' },
  enfermera:     { backgroundColor: '#FFEBEE', color: '#C62828' },
  auxiliar:      { backgroundColor: '#F0F4F8', color: '#4A6275' },
};

const estadoBadge = (estado: string): React.CSSProperties =>
  estado === 'activo'
    ? { backgroundColor: '#E8F5E9', color: '#2E7D32' }
    : { backgroundColor: '#F0F4F8', color: '#4A6275' };

// ── Componentes reutilizables ──────────────────────────────────────────────

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{
    fontSize: '11px', fontWeight: 600, padding: '3px 9px',
    borderRadius: '20px', textTransform: 'capitalize' as const,
    whiteSpace: 'nowrap' as const, ...style,
  }}>
    {children}
  </span>
)

// Input con focus ring
const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <input {...props}
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
      onFocus={e => { setFocused(true);  props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e)  }}
    />
  )
}

// Select con focus ring
const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <select {...props}
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
      onBlur={e  => { setFocused(false); props.onBlur?.(e)  }}
    />
  )
}

// Label estándar
const Lbl = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A6275', marginBottom: '5px' }}>
    {children}
    {optional && <span style={{ color: '#8FA3B1', fontSize: '11px', marginLeft: '4px' }}>(opcional)</span>}
  </label>
)

// Alerta inline
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
      fontSize: '13px', marginBottom: '16px',
    }}>
      <s.Icon style={{ fontSize: '17px', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

// Modal overlay + contenedor
const Modal = ({ onClose, children, maxWidth = 560 }: {
  onClose: () => void; children: React.ReactNode; maxWidth?: number
}) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15,47,69,0.5)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px',
        width: '100%', maxWidth,
        boxShadow: '0 20px 60px rgba(15,47,69,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {children}
    </div>
  </div>
)

// Cabecera de modal
const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #EEF4F8',
  }}>
    <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>{title}</h5>
    <button onClick={onClose} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#8FA3B1', display: 'flex', alignItems: 'center',
      padding: '4px', borderRadius: '6px',
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#1A2B3C'}
      onMouseLeave={e => e.currentTarget.style.color = '#8FA3B1'}
    >
      <HiOutlineX style={{ fontSize: '20px' }} />
    </button>
  </div>
)

// Footer de modal
const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: 'flex', justifyContent: 'flex-end', gap: '10px',
    padding: '16px 24px', borderTop: '1px solid #EEF4F8',
  }}>
    {children}
  </div>
)

// Botones estándar
const BtnPrimary = ({ children, onClick, type = 'button', disabled }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button'|'submit'; disabled?: boolean
}) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{
    padding: '9px 20px', backgroundColor: disabled ? '#8FA3B1' : '#0EA5C8',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'background 0.2s',
  }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0B85A3' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0EA5C8' }}
  >
    {children}
  </button>
)

const BtnSecondary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{
    padding: '9px 20px', backgroundColor: 'transparent',
    color: '#0EA5C8', border: '1.5px solid #0EA5C8', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", transition: 'background 0.2s',
  }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E0F7FC'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    {children}
  </button>
)

const BtnDanger = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{
    padding: '9px 20px', backgroundColor: '#C62828',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'background 0.2s',
  }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B71C1C'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C62828'}
  >
    {children}
  </button>
)

// Grid de formulario
const FormGrid = ({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '14px', padding: '20px 24px',
  }}
    className={`cs-form-grid-${cols}`}
  >
    {children}
  </div>
)

const FormField = ({ label, span, children, optional }: {
  label: string; span?: number; children: React.ReactNode; optional?: boolean
}) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
    <Lbl optional={optional}>{label}</Lbl>
    {children}
  </div>
)

// Cabecera de tabla
const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: '11px', fontWeight: 600, color: '#8FA3B1',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  backgroundColor: '#F8FBFD', borderBottom: '1px solid #D1E3EE',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px', color: '#1A2B3C',
  borderBottom: '1px solid #EEF4F8',
  verticalAlign: 'middle',
}

// ── Componente principal ───────────────────────────────────────────────────
const AdminUsuarios = () => {
  const [tab, setTab] = useState<"personal" | "pacientes">("personal");

  const [personal,  setPersonal]  = useState<Personal[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [roles,     setRoles]     = useState<{ id_rol: number; nombre: string }[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState("");
  const [exito,     setExito]     = useState("");

  const [modalCrear,    setModalCrear]    = useState(false);
  const [modalEditar,   setModalEditar]   = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);

  const [formPersonal, setFormPersonal] = useState({
    primer_nombre: "", apellido_pat: "", apellido_mat: "",
    email: "", telefono: "", nom_usuario: "", contrasena: "", id_rol: 3,
  });

  useEffect(() => { cargarDatos() }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [p, pac, r] = await Promise.all([
        getPersonalService(), getPacientesService(), getRolesService(),
      ]);
      setPersonal(p); setPacientes(pac);
      setRoles(r.filter((r) => r.nombre !== "paciente"));
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg: string) => {
    setExito(msg); setTimeout(() => setExito(""), 3000);
  };

  const handleCrearPersonal = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      await crearPersonalService(formPersonal);
      setModalCrear(false);
      setFormPersonal({ primer_nombre: "", apellido_pat: "", apellido_mat: "", email: "", telefono: "", nom_usuario: "", contrasena: "", id_rol: 3 });
      await cargarDatos();
      mostrarExito("Personal registrado correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear el personal");
    }
  };

  const handleEliminar = async () => {
    if (!itemSeleccionado) return;
    try {
      if (tab === "personal") await eliminarPersonalService(itemSeleccionado.id_personal);
      else                     await eliminarPacienteService(itemSeleccionado.id_paciente);
      setModalEliminar(false);
      await cargarDatos();
      mostrarExito("Registro desactivado correctamente");
    } catch {
      setError("Error al eliminar el registro");
    }
  };

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #D1E3EE', borderTopColor: '#0EA5C8', borderRadius: '50%', animation: 'cs-spin 0.7s linear infinite' }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .cs-form-grid-3 { grid-template-columns: 1fr !important; }
          .cs-form-grid-2 { grid-template-columns: 1fr !important; }
        }
        tr:hover td { background-color: #F8FBFD; }
      `}</style>

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>
          Gestión de Usuarios
        </h4>
        {tab === "personal" && (
          <BtnPrimary onClick={() => setModalCrear(true)}>
            <HiOutlinePlus style={{ fontSize: '16px' }} />
            Registrar Personal
          </BtnPrimary>
        )}
      </div>

      {/* Alertas */}
      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #D1E3EE', paddingBottom: '0' }}>
        {([
          { key: 'personal',  label: 'Personal',  count: personal.length,  icon: <HiOutlineUsers /> },
          { key: 'pacientes', label: 'Pacientes',  count: pacientes.length, icon: <HiOutlineUser /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif",
              backgroundColor: 'transparent',
              color: tab === t.key ? '#0EA5C8' : '#4A6275',
              borderBottom: tab === t.key ? '2px solid #0EA5C8' : '2px solid transparent',
              marginBottom: '-2px', transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: '16px', display: 'flex' }}>{t.icon}</span>
            {t.label}
            <span style={{
              backgroundColor: tab === t.key ? '#E0F7FC' : '#F0F4F8',
              color: tab === t.key ? '#0B85A3' : '#8FA3B1',
              fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tabla Personal ────────────────────────────────────────────── */}
      {tab === "personal" && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID','Nombre','Usuario','Rol','Teléfono','Estado','Acciones'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personal.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>
                    No hay personal registrado
                  </td></tr>
                ) : personal.map(p => (
                  <tr key={p.id_personal}>
                    <td style={{ ...tdStyle, color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>{p.id_personal}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ ...tdStyle, color: '#4A6275' }}>{(p as any).nom_usuario}</td>
                    <td style={tdStyle}>
                      <Badge style={rolBadge[p.rol] || rolBadge['auxiliar']}>{p.rol}</Badge>
                    </td>
                    <td style={{ ...tdStyle, color: '#4A6275' }}>{p.telefono || '—'}</td>
                    <td style={tdStyle}>
                      <Badge style={estadoBadge(p.estado)}>{p.estado}</Badge>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => { setItemSeleccionado(p); setModalEditar(true) }}
                        style={{ background: 'none', border: '1.5px solid #D1E3EE', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', color: '#4A6275', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '6px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0EA5C8'; e.currentTarget.style.color = '#0EA5C8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1E3EE'; e.currentTarget.style.color = '#4A6275' }}
                      >
                        <HiOutlinePencil /> Editar
                      </button>
                      <button
                        onClick={() => { setItemSeleccionado(p); setModalEliminar(true) }}
                        style={{ background: 'none', border: '1.5px solid #D1E3EE', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', color: '#4A6275', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C62828'; e.currentTarget.style.color = '#C62828' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1E3EE'; e.currentTarget.style.color = '#4A6275' }}
                      >
                        <HiOutlineTrash /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tabla Pacientes ───────────────────────────────────────────── */}
      {tab === "pacientes" && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID','Nombre','CI','Teléfono','Edad','Estado','Acciones'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>
                    No hay pacientes registrados
                  </td></tr>
                ) : pacientes.map(p => (
                  <tr key={p.id_paciente}>
                    <td style={{ ...tdStyle, color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>{p.id_paciente}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ ...tdStyle, color: '#4A6275' }}>{p.ci || '—'}</td>
                    <td style={{ ...tdStyle, color: '#4A6275' }}>{p.telefono || '—'}</td>
                    <td style={{ ...tdStyle, color: '#4A6275', fontVariantNumeric: 'tabular-nums' }}>{p.edad ? `${p.edad} años` : '—'}</td>
                    <td style={tdStyle}>
                      <Badge style={estadoBadge(p.estado)}>{p.estado}</Badge>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => { setItemSeleccionado(p); setModalEditar(true) }}
                        style={{ background: 'none', border: '1.5px solid #D1E3EE', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', color: '#4A6275', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginRight: '6px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0EA5C8'; e.currentTarget.style.color = '#0EA5C8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1E3EE'; e.currentTarget.style.color = '#4A6275' }}
                      >
                        <HiOutlinePencil /> Editar
                      </button>
                      <button
                        onClick={() => { setItemSeleccionado(p); setModalEliminar(true) }}
                        style={{ background: 'none', border: '1.5px solid #D1E3EE', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', color: '#4A6275', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#C62828'; e.currentTarget.style.color = '#C62828' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1E3EE'; e.currentTarget.style.color = '#4A6275' }}
                      >
                        <HiOutlineTrash /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ MODAL CREAR PERSONAL ════════════════════════════════════════ */}
      {modalCrear && (
        <Modal onClose={() => setModalCrear(false)} maxWidth={640}>
          <ModalHeader title="Registrar Personal" onClose={() => setModalCrear(false)} />
          <form onSubmit={handleCrearPersonal}>
            <FormGrid cols={3}>
              {error && <div style={{ gridColumn: 'span 3' }}><Alerta tipo="danger">{error}</Alerta></div>}
              <FormField label="Primer nombre *">
                <CsInput value={formPersonal.primer_nombre} required
                  onChange={e => setFormPersonal({ ...formPersonal, primer_nombre: e.target.value })} />
              </FormField>
              <FormField label="Apellido paterno *">
                <CsInput value={formPersonal.apellido_pat} required
                  onChange={e => setFormPersonal({ ...formPersonal, apellido_pat: e.target.value })} />
              </FormField>
              <FormField label="Apellido materno" optional>
                <CsInput value={formPersonal.apellido_mat}
                  onChange={e => setFormPersonal({ ...formPersonal, apellido_mat: e.target.value })} />
              </FormField>
              <FormField label="Correo electrónico" optional>
                <CsInput type="email" value={formPersonal.email}
                  onChange={e => setFormPersonal({ ...formPersonal, email: e.target.value })} />
              </FormField>
              <FormField label="Teléfono" optional>
                <CsInput value={formPersonal.telefono}
                  onChange={e => setFormPersonal({ ...formPersonal, telefono: e.target.value })} />
              </FormField>
              <FormField label="Rol *">
                <CsSelect value={formPersonal.id_rol}
                  onChange={e => setFormPersonal({ ...formPersonal, id_rol: parseInt(e.target.value) })}>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
                </CsSelect>
              </FormField>
              <FormField label="Nombre de usuario *">
                <CsInput value={formPersonal.nom_usuario} required
                  onChange={e => setFormPersonal({ ...formPersonal, nom_usuario: e.target.value })} />
              </FormField>
              <FormField label="Contraseña *" span={2}>
                <CsInput type="password" value={formPersonal.contrasena} required
                  onChange={e => setFormPersonal({ ...formPersonal, contrasena: e.target.value })} />
              </FormField>
            </FormGrid>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalCrear(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit">
                <HiOutlinePlus style={{ fontSize: '15px' }} /> Registrar
              </BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL EDITAR PERSONAL ═══════════════════════════════════════ */}
      {modalEditar && itemSeleccionado && tab === "personal" && (
        <Modal onClose={() => { setModalEditar(false); setError("") }} maxWidth={640}>
          <ModalHeader title="Editar Personal" onClose={() => { setModalEditar(false); setError("") }} />
          <FormGrid cols={3}>
            {error && <div style={{ gridColumn: 'span 3' }}><Alerta tipo="danger">{error}</Alerta></div>}
            <FormField label="Primer nombre">
              <CsInput value={itemSeleccionado.primer_nombre || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, primer_nombre: e.target.value })} />
            </FormField>
            <FormField label="Apellido paterno">
              <CsInput value={itemSeleccionado.apellido_pat || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, apellido_pat: e.target.value })} />
            </FormField>
            <FormField label="Apellido materno" optional>
              <CsInput value={itemSeleccionado.apellido_mat || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, apellido_mat: e.target.value })} />
            </FormField>
            <FormField label="Email" optional>
              <CsInput type="email" value={itemSeleccionado.email || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, email: e.target.value })} />
            </FormField>
            <FormField label="Teléfono" optional>
              <CsInput value={itemSeleccionado.telefono || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, telefono: e.target.value })} />
            </FormField>
            <FormField label="Estado">
              <CsSelect value={itemSeleccionado.estado || "activo"}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, estado: e.target.value })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </CsSelect>
            </FormField>
            <FormField label="Rol">
              <CsSelect value={itemSeleccionado.id_rol || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, id_rol: parseInt(e.target.value) })}>
                {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
              </CsSelect>
            </FormField>
            <FormField label="Nombre de usuario">
              <CsInput value={itemSeleccionado.nom_usuario || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, nom_usuario: e.target.value })} />
            </FormField>
            <FormField label="Nueva contraseña" optional>
              <CsInput type="password" placeholder="Dejar vacío para no cambiar"
                value={itemSeleccionado.contrasena_nueva || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, contrasena_nueva: e.target.value })} />
            </FormField>
          </FormGrid>
          <ModalFooter>
            <BtnSecondary onClick={() => { setModalEditar(false); setError("") }}>Cancelar</BtnSecondary>
            <BtnPrimary onClick={async () => {
              setError("");
              try {
                await editarPersonalService(itemSeleccionado.id_personal, {
                  primer_nombre: itemSeleccionado.primer_nombre,
                  apellido_pat:  itemSeleccionado.apellido_pat,
                  apellido_mat:  itemSeleccionado.apellido_mat,
                  email:         itemSeleccionado.email,
                  telefono:      itemSeleccionado.telefono,
                  estado:        itemSeleccionado.estado,
                  nom_usuario:   itemSeleccionado.nom_usuario   || undefined,
                  contrasena:    itemSeleccionado.contrasena_nueva || undefined,
                  id_rol:        itemSeleccionado.id_rol        || undefined,
                });
                setModalEditar(false);
                await cargarDatos();
                mostrarExito("Personal actualizado correctamente");
              } catch (err: any) {
                setError(err.response?.data?.error || "Error al actualizar");
              }
            }}>
              <HiOutlineCheckCircle style={{ fontSize: '15px' }} /> Guardar cambios
            </BtnPrimary>
          </ModalFooter>
        </Modal>
      )}

      {/* ══ MODAL EDITAR PACIENTE ════════════════════════════════════════ */}
      {modalEditar && itemSeleccionado && tab === "pacientes" && (
        <Modal onClose={() => { setModalEditar(false); setError("") }} maxWidth={640}>
          <ModalHeader title="Editar Paciente" onClose={() => { setModalEditar(false); setError("") }} />
          <FormGrid cols={3}>
            {error && <div style={{ gridColumn: 'span 3' }}><Alerta tipo="danger">{error}</Alerta></div>}
            <FormField label="Primer nombre">
              <CsInput value={itemSeleccionado.primer_nombre || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, primer_nombre: e.target.value })} />
            </FormField>
            <FormField label="Apellido paterno">
              <CsInput value={itemSeleccionado.apellido_pat || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, apellido_pat: e.target.value })} />
            </FormField>
            <FormField label="Apellido materno" optional>
              <CsInput value={itemSeleccionado.apellido_mat || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, apellido_mat: e.target.value })} />
            </FormField>
            <FormField label="CI" optional>
              <CsInput value={itemSeleccionado.ci || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, ci: e.target.value })} />
            </FormField>
            <FormField label="Email" optional>
              <CsInput type="email" value={itemSeleccionado.email || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, email: e.target.value })} />
            </FormField>
            <FormField label="Teléfono" optional>
              <CsInput value={itemSeleccionado.telefono || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, telefono: e.target.value })} />
            </FormField>
            <FormField label="Fecha de nacimiento" optional>
              <CsInput type="date"
                value={itemSeleccionado.fecha_nac ? new Date(itemSeleccionado.fecha_nac).toISOString().split("T")[0] : ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, fecha_nac: e.target.value })} />
            </FormField>
            <FormField label="Estado">
              <CsSelect value={itemSeleccionado.estado || "activo"}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, estado: e.target.value })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </CsSelect>
            </FormField>
            <FormField label="Nombre de usuario" optional>
              <CsInput value={itemSeleccionado.nom_usuario || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, nom_usuario: e.target.value })} />
            </FormField>
            <FormField label="Dirección" span={2} optional>
              <CsInput value={itemSeleccionado.direccion || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, direccion: e.target.value })} />
            </FormField>
            <FormField label="Nueva contraseña" optional>
              <CsInput type="password" placeholder="Dejar vacío para no cambiar"
                value={itemSeleccionado.contrasena_nueva || ""}
                onChange={e => setItemSeleccionado({ ...itemSeleccionado, contrasena_nueva: e.target.value })} />
            </FormField>
          </FormGrid>
          <ModalFooter>
            <BtnSecondary onClick={() => { setModalEditar(false); setError("") }}>Cancelar</BtnSecondary>
            <BtnPrimary onClick={async () => {
              setError("");
              try {
                await editarPacienteService(itemSeleccionado.id_paciente, {
                  primer_nombre: itemSeleccionado.primer_nombre,
                  apellido_pat:  itemSeleccionado.apellido_pat,
                  apellido_mat:  itemSeleccionado.apellido_mat,
                  ci:            itemSeleccionado.ci,
                  email:         itemSeleccionado.email,
                  telefono:      itemSeleccionado.telefono,
                  direccion:     itemSeleccionado.direccion,
                  fecha_nac:     itemSeleccionado.fecha_nac,
                  estado:        itemSeleccionado.estado,
                  nom_usuario:   itemSeleccionado.nom_usuario   || undefined,
                  contrasena:    itemSeleccionado.contrasena_nueva || undefined,
                });
                setModalEditar(false);
                await cargarDatos();
                mostrarExito("Paciente actualizado correctamente");
              } catch (err: any) {
                setError(err.response?.data?.error || "Error al actualizar");
              }
            }}>
              <HiOutlineCheckCircle style={{ fontSize: '15px' }} /> Guardar cambios
            </BtnPrimary>
          </ModalFooter>
        </Modal>
      )}

      {/* ══ MODAL ELIMINAR ══════════════════════════════════════════════ */}
      {modalEliminar && itemSeleccionado && (
        <Modal onClose={() => setModalEliminar(false)} maxWidth={380}>
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            {/* Ícono */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: '#FFEBEE', marginBottom: '16px',
            }}>
              <HiOutlineExclamation style={{ fontSize: '28px', color: '#C62828' }} />
            </div>

            <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', marginBottom: '8px' }}>
              Desactivar {tab === "personal" ? "Personal" : "Paciente"}
            </h5>
            <p style={{ fontSize: '14px', color: '#4A6275', lineHeight: 1.6, marginBottom: '6px' }}>
              ¿Deseas desactivar a <strong style={{ color: '#1A2B3C' }}>{itemSeleccionado.nombre}</strong>?
            </p>
            <p style={{ fontSize: '12px', color: '#8FA3B1', marginBottom: '24px' }}>
              El registro no se borrará — solo quedará inactivo para preservar el historial de citas.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <BtnSecondary onClick={() => setModalEliminar(false)}>Cancelar</BtnSecondary>
              <BtnDanger onClick={handleEliminar}>
                <HiOutlineTrash style={{ fontSize: '15px' }} /> Desactivar
              </BtnDanger>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsuarios;