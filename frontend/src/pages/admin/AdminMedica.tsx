import { useState, useEffect } from "react";
import type { Especialidad, Horario, Personal } from "../../types";
import {
  getEspecialidadesService,
  crearEspecialidadService,
  editarEspecialidadService,
  eliminarEspecialidadService,
  getHorariosService,
  crearHorarioService,
  editarHorarioService,
  eliminarHorarioService,
  getPersonalService,
} from "../../services/admin.service";
import {
  HiOutlineUserCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

const DIAS_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DURACIONES  = [15, 20, 30, 45, 60];

// ── Componentes base (mismos tokens que AdminUsuarios) ─────────────────────

const Badge = ({ children, style }: { children: React.ReactNode; style: React.CSSProperties }) => (
  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px', textTransform: 'capitalize' as const, whiteSpace: 'nowrap' as const, ...style }}>
    {children}
  </span>
)

const estadoBadge = (activo: boolean): React.CSSProperties =>
  activo
    ? { backgroundColor: '#E8F5E9', color: '#2E7D32' }
    : { backgroundColor: '#F0F4F8', color: '#4A6275' }

const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false)
  return (
    <input {...props}
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
      onFocus={e => { if (!props.readOnly && !props.disabled) setFocused(true);  props.onFocus?.(e) }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

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
      onBlur={e  => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

const Lbl = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4A6275', marginBottom: '5px' }}>
    {children}
    {optional && <span style={{ color: '#8FA3B1', fontSize: '11px', marginLeft: '4px' }}>(opcional)</span>}
  </label>
)

const Alerta = ({ tipo, children }: { tipo: 'danger' | 'success'; children: React.ReactNode }) => {
  const s = tipo === 'danger'
    ? { bg: '#FFEBEE', color: '#C62828', border: '#C62828', Icon: HiOutlineExclamationCircle }
    : { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32', Icon: HiOutlineCheckCircle }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '8px', backgroundColor: s.bg, color: s.color, borderLeft: `4px solid ${s.border}`, fontSize: '13px', marginBottom: '16px' }}>
      <s.Icon style={{ fontSize: '17px', flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  )
}

const Modal = ({ onClose, children, maxWidth = 520 }: { onClose: () => void; children: React.ReactNode; maxWidth?: number }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15,47,69,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth, boxShadow: '0 20px 60px rgba(15,47,69,0.18)', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Inter', sans-serif" }}>
      {children}
    </div>
  </div>
)

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #EEF4F8' }}>
    <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>{title}</h5>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3B1', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px' }}
      onMouseEnter={e => e.currentTarget.style.color = '#1A2B3C'}
      onMouseLeave={e => e.currentTarget.style.color = '#8FA3B1'}
    >
      <HiOutlineX style={{ fontSize: '20px' }} />
    </button>
  </div>
)

const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
)

const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #EEF4F8' }}>{children}</div>
)

const BtnPrimary = ({ children, onClick, type = 'button', disabled }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{ padding: '9px 20px', backgroundColor: disabled ? '#8FA3B1' : '#0EA5C8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0B85A3' }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#0EA5C8' }}
  >{children}</button>
)

const BtnSecondary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{ padding: '9px 20px', backgroundColor: 'transparent', color: '#0EA5C8', border: '1.5px solid #0EA5C8', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E0F7FC'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
  >{children}</button>
)

const BtnDanger = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} style={{ padding: '9px 20px', backgroundColor: '#C62828', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B71C1C'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C62828'}
  >{children}</button>
)

// Botón de acción en tabla
const BtnTabla = ({ onClick, color, children }: { onClick: () => void; color: 'edit' | 'danger'; children: React.ReactNode }) => {
  const hoverColor = color === 'edit' ? '#0EA5C8' : '#C62828'
  return (
    <button onClick={onClick} style={{ background: 'none', border: '1.5px solid #D1E3EE', borderRadius: '7px', padding: '5px 11px', cursor: 'pointer', color: '#4A6275', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s, color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = hoverColor }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1E3EE'; e.currentTarget.style.color = '#4A6275' }}
    >{children}</button>
  )
}

// Grid row para pares de tiempo
const TimeRow = ({ label, valIni, valFin, onIni, onFin, optional }: {
  label: string; valIni: string; valFin: string;
  onIni: (v: string) => void; onFin: (v: string) => void; optional?: boolean
}) => (
  <div>
    <Lbl optional={optional}>{label}</Lbl>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <CsInput type="time" value={valIni} onChange={e => onIni(e.target.value)} style={{ flex: 1 }} />
      <span style={{ fontSize: '12px', color: '#8FA3B1', flexShrink: 0 }}>a</span>
      <CsInput type="time" value={valFin} onChange={e => onFin(e.target.value)} style={{ flex: 1 }} />
    </div>
  </div>
)

// Selector de días tipo pill
const DiaSelector = ({ dias, onToggle }: { dias: number[]; onToggle: (i: number) => void }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {DIAS_LABELS.map((dia, i) => {
      const activo = dias.includes(i)
      return (
        <button key={i} type="button" onClick={() => onToggle(i)}
          style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', border: '1.5px solid',
            borderColor: activo ? '#0EA5C8' : '#D1E3EE',
            backgroundColor: activo ? '#E0F7FC' : '#FFFFFF',
            color: activo ? '#0B85A3' : '#4A6275',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.15s',
          }}
        >{dia}</button>
      )
    })}
  </div>
)

// Estilos de tabla
const thStyle: React.CSSProperties = { padding: '11px 16px', fontSize: '11px', fontWeight: 600, color: '#8FA3B1', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F8FBFD', borderBottom: '1px solid #D1E3EE', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#1A2B3C', borderBottom: '1px solid #EEF4F8', verticalAlign: 'middle' }

// ── Componente principal ───────────────────────────────────────────────────
const AdminMedica = () => {
  const [tab, setTab] = useState<"especialidades" | "horarios">("especialidades");

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [horarios,       setHorarios]       = useState<Horario[]>([]);
  const [medicos,        setMedicos]        = useState<Personal[]>([]);
  const [cargando,       setCargando]       = useState(true);
  const [error,          setError]          = useState("");
  const [exito,          setExito]          = useState("");

  const [modalCrearEsp,  setModalCrearEsp]  = useState(false);
  const [modalEditarEsp, setModalEditarEsp] = useState(false);
  const [modalEliminar,  setModalEliminar]  = useState(false);
  const [modalCrearHor,  setModalCrearHor]  = useState(false);
  const [modalEditarHor, setModalEditarHor] = useState(false);
  const [itemSel,        setItemSel]        = useState<any>(null);

  const [formEsp, setFormEsp] = useState({ nombre: "", descripcion: "" });

  const formHorVacio = {
    id_personal: 0, id_especialidad: 0,
    hora_inicio_manana: "", hora_fin_manana: "",
    hora_inicio_tarde:  "", hora_fin_tarde:  "",
    duracion_cita_min: 30, dias: [] as number[], activo: true,
  };
  const [formHor, setFormHor] = useState(formHorVacio);

  useEffect(() => { cargarDatos() }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [esp, hor, per] = await Promise.all([
        getEspecialidadesService(), getHorariosService(), getPersonalService(),
      ]);
      setEspecialidades(esp); setHorarios(hor);
      setMedicos(per.filter(p => p.rol === "medico"));
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg: string) => { setExito(msg); setTimeout(() => setExito(""), 3000) };

  const toggleDia = (dia: number) => {
    setFormHor(prev => ({
      ...prev,
      dias: prev.dias.includes(dia)
        ? prev.dias.filter(d => d !== dia)
        : [...prev.dias, dia].sort(),
    }));
  };

  const handleCrearEsp = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      await crearEspecialidadService(formEsp);
      setModalCrearEsp(false); setFormEsp({ nombre: "", descripcion: "" });
      await cargarDatos(); mostrarExito("Especialidad creada correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear especialidad");
    }
  };

  const handleEditarEsp = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      await editarEspecialidadService(itemSel.id_especialidad, { nombre: itemSel.nombre, descripcion: itemSel.descripcion, activa: itemSel.activa });
      setModalEditarEsp(false); await cargarDatos(); mostrarExito("Especialidad actualizada correctamente");
    } catch { setError("Error al actualizar especialidad") }
  };

  const handleEliminarEsp = async () => {
    try {
      await eliminarEspecialidadService(itemSel.id_especialidad);
      setModalEliminar(false); await cargarDatos(); mostrarExito("Especialidad desactivada correctamente");
    } catch { setError("Error al eliminar especialidad") }
  };

  const handleCrearHor = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (formHor.dias.length === 0)           { setError("Selecciona al menos un día"); return }
    if (!formHor.id_personal || !formHor.id_especialidad) { setError("Selecciona un médico y una especialidad"); return }
    try {
      await crearHorarioService({
        ...formHor,
        hora_inicio_manana: formHor.hora_inicio_manana || undefined,
        hora_fin_manana:    formHor.hora_fin_manana    || undefined,
        hora_inicio_tarde:  formHor.hora_inicio_tarde  || undefined,
        hora_fin_tarde:     formHor.hora_fin_tarde     || undefined,
      });
      setModalCrearHor(false); setFormHor(formHorVacio);
      await cargarDatos(); mostrarExito("Horario registrado correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear horario");
    }
  };

  const handleEliminarHor = async () => {
    try {
      await eliminarHorarioService(itemSel.id_horario);
      setModalEliminar(false); await cargarDatos(); mostrarExito("Horario desactivado correctamente");
    } catch { setError("Error al eliminar horario") }
  };

  const renderDias = (dias: number[]) => {
    if (!dias || dias.length === 0) return "—";
    return dias.map(d => DIAS_LABELS[d]).join(", ");
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
        tr:hover td { background-color: #F8FBFD; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A2B3C', margin: 0 }}>Gestión Médica</h4>

        {tab === 'especialidades' && (
          <BtnPrimary onClick={() => setModalCrearEsp(true)}>
            <HiOutlinePlus style={{ fontSize: '16px' }} /> Nueva especialidad
          </BtnPrimary>
        )}
        {tab === 'horarios' && (
          <BtnPrimary onClick={() => setModalCrearHor(true)}>
            <HiOutlinePlus style={{ fontSize: '16px' }} /> Registrar horario
          </BtnPrimary>
        )}
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #D1E3EE' }}>
        {([
          { key: 'especialidades', label: 'Especialidades',   icon: <HiOutlineUserCircle /> },
          { key: 'horarios',       label: 'Horarios médicos', icon: <HiOutlineClock /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'Inter', sans-serif", backgroundColor: 'transparent', color: tab === t.key ? '#0EA5C8' : '#4A6275', borderBottom: tab === t.key ? '2px solid #0EA5C8' : '2px solid transparent', marginBottom: '-2px', transition: 'color 0.15s' }}
          >
            <span style={{ fontSize: '16px', display: 'flex' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tabla Especialidades ─────────────────────────────────────────── */}
      {tab === "especialidades" && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Especialidad', 'Descripción', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {especialidades.length === 0 ? (
                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>No hay especialidades registradas</td></tr>
              ) : especialidades.map(e => (
                <tr key={e.id_especialidad}>
                  <td style={{ ...tdStyle, color: '#8FA3B1', fontVariantNumeric: 'tabular-nums' }}>{e.id_especialidad}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{e.nombre}</td>
                  <td style={{ ...tdStyle, color: '#4A6275', fontSize: '12px' }}>{e.descripcion || '—'}</td>
                  <td style={tdStyle}>
                    <Badge style={estadoBadge(e.activa)}>{e.activa ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <BtnTabla color="edit" onClick={() => { setItemSel({ ...e }); setModalEditarEsp(true) }}>
                      <HiOutlinePencil /> Editar
                    </BtnTabla>
                    {' '}
                    <BtnTabla color="danger" onClick={() => { setItemSel(e); setModalEliminar(true) }}>
                      <HiOutlineTrash /> Eliminar
                    </BtnTabla>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabla Horarios ───────────────────────────────────────────────── */}
      {tab === "horarios" && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D1E3EE', boxShadow: '0 1px 3px rgba(15,47,69,0.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Médico', 'Especialidad', 'Días', 'Mañana', 'Tarde', 'Duración', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#8FA3B1', padding: '40px' }}>No hay horarios registrados</td></tr>
                ) : horarios.map(h => (
                  <tr key={h.id_horario}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{h.medico}</td>
                    <td style={tdStyle}>{h.especialidad}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275', maxWidth: '150px' }}>{renderDias(h.dias)}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275', fontVariantNumeric: 'tabular-nums' }}>
                      {h.hora_inicio_manana && h.hora_fin_manana
                        ? `${h.hora_inicio_manana.substring(0, 5)} – ${h.hora_fin_manana.substring(0, 5)}`
                        : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#4A6275', fontVariantNumeric: 'tabular-nums' }}>
                      {h.hora_inicio_tarde && h.hora_fin_tarde
                        ? `${h.hora_inicio_tarde.substring(0, 5)} – ${h.hora_fin_tarde.substring(0, 5)}`
                        : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#4A6275' }}>{h.duracion_cita_min} min</td>
                    <td style={tdStyle}>
                      <Badge style={estadoBadge(h.activo)}>{h.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <BtnTabla color="edit" onClick={() => {
                        setItemSel(h);
                        setFormHor({
                          id_personal:        h.id_personal,
                          id_especialidad:    h.id_especialidad,
                          hora_inicio_manana: h.hora_inicio_manana?.substring(0, 5) || "",
                          hora_fin_manana:    h.hora_fin_manana?.substring(0, 5)    || "",
                          hora_inicio_tarde:  h.hora_inicio_tarde?.substring(0, 5)  || "",
                          hora_fin_tarde:     h.hora_fin_tarde?.substring(0, 5)     || "",
                          duracion_cita_min:  h.duracion_cita_min,
                          dias:               h.dias || [],
                          activo:             h.activo,
                        });
                        setModalEditarHor(true);
                      }}>
                        <HiOutlinePencil /> Editar
                      </BtnTabla>
                      {' '}
                      <BtnTabla color="danger" onClick={() => { setItemSel(h); setModalEliminar(true) }}>
                        <HiOutlineTrash /> Eliminar
                      </BtnTabla>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ MODAL CREAR ESPECIALIDAD ════════════════════════════════════ */}
      {modalCrearEsp && (
        <Modal onClose={() => setModalCrearEsp(false)}>
          <ModalHeader title="Nueva Especialidad" onClose={() => setModalCrearEsp(false)} />
          <form onSubmit={handleCrearEsp}>
            <ModalBody>
              <div>
                <Lbl>Nombre <span style={{ color: '#C62828' }}>*</span></Lbl>
                <CsInput value={formEsp.nombre} required onChange={e => setFormEsp({ ...formEsp, nombre: e.target.value })} />
              </div>
              <div>
                <Lbl optional>Descripción</Lbl>
                <CsInput value={formEsp.descripcion} onChange={e => setFormEsp({ ...formEsp, descripcion: e.target.value })} />
              </div>
            </ModalBody>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalCrearEsp(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit"><HiOutlinePlus style={{ fontSize: '15px' }} /> Guardar</BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL EDITAR ESPECIALIDAD ════════════════════════════════════ */}
      {modalEditarEsp && itemSel && (
        <Modal onClose={() => setModalEditarEsp(false)}>
          <ModalHeader title="Editar Especialidad" onClose={() => setModalEditarEsp(false)} />
          <form onSubmit={handleEditarEsp}>
            <ModalBody>
              <div>
                <Lbl>Nombre <span style={{ color: '#C62828' }}>*</span></Lbl>
                <CsInput value={itemSel.nombre} required onChange={e => setItemSel({ ...itemSel, nombre: e.target.value })} />
              </div>
              <div>
                <Lbl optional>Descripción</Lbl>
                <CsInput value={itemSel.descripcion || ""} onChange={e => setItemSel({ ...itemSel, descripcion: e.target.value })} />
              </div>
              <div>
                <Lbl>Estado</Lbl>
                <CsSelect value={itemSel.activa ? "true" : "false"} onChange={e => setItemSel({ ...itemSel, activa: e.target.value === "true" })}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </CsSelect>
              </div>
            </ModalBody>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalEditarEsp(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit"><HiOutlineCheckCircle style={{ fontSize: '15px' }} /> Guardar cambios</BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL CREAR HORARIO ══════════════════════════════════════════ */}
      {modalCrearHor && (
        <Modal onClose={() => setModalCrearHor(false)} maxWidth={620}>
          <ModalHeader title="Registrar Horario" onClose={() => setModalCrearHor(false)} />
          <form onSubmit={handleCrearHor}>
            <ModalBody>
              {error && <Alerta tipo="danger">{error}</Alerta>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Lbl>Médico <span style={{ color: '#C62828' }}>*</span></Lbl>
                  <CsSelect value={formHor.id_personal} onChange={e => setFormHor({ ...formHor, id_personal: parseInt(e.target.value) })}>
                    <option value={0}>Seleccionar médico</option>
                    {medicos.map(m => <option key={m.id_personal} value={m.id_personal}>{m.nombre}</option>)}
                  </CsSelect>
                </div>
                <div>
                  <Lbl>Especialidad <span style={{ color: '#C62828' }}>*</span></Lbl>
                  <CsSelect value={formHor.id_especialidad} onChange={e => setFormHor({ ...formHor, id_especialidad: parseInt(e.target.value) })}>
                    <option value={0}>Seleccionar especialidad</option>
                    {especialidades.filter(e => e.activa).map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                  </CsSelect>
                </div>
              </div>

              <div>
                <Lbl>Días de atención <span style={{ color: '#C62828' }}>*</span></Lbl>
                <DiaSelector dias={formHor.dias} onToggle={toggleDia} />
              </div>

              <TimeRow label="Turno mañana" optional
                valIni={formHor.hora_inicio_manana} valFin={formHor.hora_fin_manana}
                onIni={v => setFormHor({ ...formHor, hora_inicio_manana: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_manana: v })}
              />
              <TimeRow label="Turno tarde" optional
                valIni={formHor.hora_inicio_tarde} valFin={formHor.hora_fin_tarde}
                onIni={v => setFormHor({ ...formHor, hora_inicio_tarde: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_tarde: v })}
              />

              <div style={{ maxWidth: '200px' }}>
                <Lbl>Duración por cita</Lbl>
                <CsSelect value={formHor.duracion_cita_min} onChange={e => setFormHor({ ...formHor, duracion_cita_min: parseInt(e.target.value) })}>
                  {DURACIONES.map(d => <option key={d} value={d}>{d} minutos</option>)}
                </CsSelect>
              </div>
            </ModalBody>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalCrearHor(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit"><HiOutlinePlus style={{ fontSize: '15px' }} /> Registrar horario</BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL EDITAR HORARIO ═════════════════════════════════════════ */}
      {modalEditarHor && itemSel && (
        <Modal onClose={() => setModalEditarHor(false)} maxWidth={620}>
          <ModalHeader title="Editar Horario" onClose={() => setModalEditarHor(false)} />
          <form onSubmit={async e => {
            e.preventDefault();
            try {
              await editarHorarioService(itemSel.id_horario, formHor);
              setModalEditarHor(false);
              await cargarDatos();
              mostrarExito("Horario actualizado correctamente");
            } catch { setError("Error al actualizar horario") }
          }}>
            <ModalBody>
              {/* Campos de solo lectura */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px', backgroundColor: '#F8FBFD', borderRadius: '8px', border: '1px solid #D1E3EE' }}>
                <div>
                  <Lbl>Médico <span style={{ fontSize: '10px', color: '#8FA3B1' }}>(solo lectura)</span></Lbl>
                  <CsInput value={itemSel.medico || ""} readOnly />
                </div>
                <div>
                  <Lbl>Especialidad <span style={{ fontSize: '10px', color: '#8FA3B1' }}>(solo lectura)</span></Lbl>
                  <CsInput value={itemSel.especialidad || ""} readOnly />
                </div>
              </div>

              <div>
                <Lbl>Días <span style={{ color: '#C62828' }}>*</span></Lbl>
                <DiaSelector dias={formHor.dias} onToggle={toggleDia} />
              </div>

              <TimeRow label="Turno mañana" optional
                valIni={formHor.hora_inicio_manana} valFin={formHor.hora_fin_manana}
                onIni={v => setFormHor({ ...formHor, hora_inicio_manana: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_manana: v })}
              />
              <TimeRow label="Turno tarde" optional
                valIni={formHor.hora_inicio_tarde} valFin={formHor.hora_fin_tarde}
                onIni={v => setFormHor({ ...formHor, hora_inicio_tarde: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_tarde: v })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Lbl>Duración</Lbl>
                  <CsSelect value={formHor.duracion_cita_min} onChange={e => setFormHor({ ...formHor, duracion_cita_min: parseInt(e.target.value) })}>
                    {DURACIONES.map(d => <option key={d} value={d}>{d} minutos</option>)}
                  </CsSelect>
                </div>
                <div>
                  <Lbl>Estado</Lbl>
                  <CsSelect value={formHor.activo ? "true" : "false"} onChange={e => setFormHor({ ...formHor, activo: e.target.value === "true" })}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </CsSelect>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <BtnSecondary onClick={() => setModalEditarHor(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit"><HiOutlineCheckCircle style={{ fontSize: '15px' }} /> Guardar cambios</BtnPrimary>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ══ MODAL ELIMINAR GENÉRICO ══════════════════════════════════════ */}
      {modalEliminar && itemSel && (
        <Modal onClose={() => setModalEliminar(false)} maxWidth={380}>
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FFEBEE', marginBottom: '16px' }}>
              <HiOutlineExclamation style={{ fontSize: '28px', color: '#C62828' }} />
            </div>
            <h5 style={{ fontSize: '17px', fontWeight: 700, color: '#1A2B3C', marginBottom: '8px' }}>
              Confirmar desactivación
            </h5>
            <p style={{ fontSize: '14px', color: '#4A6275', lineHeight: 1.6, marginBottom: '6px' }}>
              ¿Deseas desactivar <strong style={{ color: '#1A2B3C' }}>{itemSel.nombre || itemSel.medico}</strong>?
            </p>
            <p style={{ fontSize: '12px', color: '#8FA3B1', marginBottom: '24px' }}>
              El registro no se borrará — solo quedará inactivo.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <BtnSecondary onClick={() => setModalEliminar(false)}>Cancelar</BtnSecondary>
              <BtnDanger onClick={tab === "especialidades" ? handleEliminarEsp : handleEliminarHor}>
                <HiOutlineTrash style={{ fontSize: '15px' }} /> Desactivar
              </BtnDanger>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminMedica;