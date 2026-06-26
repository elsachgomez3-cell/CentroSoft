import { useState, useEffect } from "react";
import type { Horario, Especialidad, Personal } from "../../types";
import {
  getEspecialidadesService,
  getPersonalService,
} from "../../services/admin.service";
import {
  getHorariosService,
  crearHorarioService,
  editarHorarioService,
  eliminarHorarioService,
} from "../../services/recepcionista.service";
import {
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineFilter,
} from "react-icons/hi";

const DIAS_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    style={{
      width: "100%", padding: "9px 13px", border: "1.5px solid #D1E3EE",
      borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif",
      color: "#1A2B3C", backgroundColor: "#FFFFFF", outline: "none",
      boxSizing: "border-box",
      ...(props.style as React.CSSProperties),
    }}
  />
);

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    style={{
      width: "100%", padding: "9px 13px", border: "1.5px solid #D1E3EE",
      borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif",
      color: "#1A2B3C", backgroundColor: "#FFFFFF", outline: "none",
      boxSizing: "border-box", cursor: "pointer",
      ...(props.style as React.CSSProperties),
    }}
  />
);

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#4A6275", marginBottom: "5px" }}>
    {children}
  </label>
);

const Alerta = ({ tipo, children }: { tipo: "danger" | "success"; children: React.ReactNode }) => {
  const s = tipo === "danger"
    ? { bg: "#FFEBEE", color: "#C62828", border: "#C62828", Icon: HiOutlineExclamationCircle }
    : { bg: "#E8F5E9", color: "#2E7D32", border: "#2E7D32", Icon: HiOutlineCheckCircle };
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "12px 14px", borderRadius: "8px",
      backgroundColor: s.bg, color: s.color, borderLeft: `4px solid ${s.border}`,
      fontSize: "13px", marginBottom: "16px",
    }}>
      <s.Icon style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }} />
      <span>{children}</span>
    </div>
  );
};

const BtnPrimary = ({ children, onClick, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit";
}) => (
  <button
    type={type} onClick={onClick}
    style={{
      padding: "9px 18px", backgroundColor: "#0EA5C8", color: "#fff",
      border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
      cursor: "pointer", fontFamily: "'Inter', sans-serif",
      display: "inline-flex", alignItems: "center", gap: "6px",
    }}
  >
    {children}
  </button>
);

const BtnSecondary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: "9px 18px", backgroundColor: "transparent", color: "#4A6275",
      border: "1.5px solid #D1E3EE", borderRadius: "8px", fontSize: "13px",
      fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </button>
);

const BtnDanger = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: "9px 18px", backgroundColor: "#C62828", color: "#fff",
      border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
      cursor: "pointer", fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </button>
);

const DiaSelector = ({ dias, onToggle }: { dias: number[]; onToggle: (i: number) => void }) => (
  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
    {DIAS_LABELS.map((dia, i) => {
      const activo = dias.includes(i);
      return (
        <button
          key={i} type="button" onClick={() => onToggle(i)}
          style={{
            padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", border: "1.5px solid",
            borderColor: activo ? "#0EA5C8" : "#D1E3EE",
            backgroundColor: activo ? "#E0F7FC" : "#FFFFFF",
            color: activo ? "#0B85A3" : "#4A6275",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {dia}
        </button>
      );
    })}
  </div>
);

const HoraRango = ({ label, inicio, fin, onInicio, onFin }: {
  label: string; inicio: string; fin: string; onInicio: (v: string) => void; onFin: (v: string) => void;
}) => (
  <div>
    <Lbl>{label}</Lbl>
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <CsInput type="time" value={inicio} onChange={e => onInicio(e.target.value)} style={{ flex: 1 }} />
      <span style={{ fontSize: "12px", color: "#8FA3B1", flexShrink: 0 }}>a</span>
      <CsInput type="time" value={fin} onChange={e => onFin(e.target.value)} style={{ flex: 1 }} />
    </div>
  </div>
);

const thStyle: React.CSSProperties = {
  padding: "11px 16px", fontSize: "11px", fontWeight: 600, color: "#8FA3B1",
  textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#F8FBFD",
  borderBottom: "1px solid #D1E3EE", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: "13px", color: "#1A2B3C",
  borderBottom: "1px solid #EEF4F8", verticalAlign: "middle",
};

const formHorVacio = {
  id_personal: 0, id_especialidad: 0,
  hora_inicio_manana: "", hora_fin_manana: "",
  hora_inicio_tarde: "", hora_fin_tarde: "",
  duracion_cita_min: 30, dias: [] as number[],
};

const RecepcionistaHorarios = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [medicos, setMedicos] = useState<Personal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [filtroMedico, setFiltroMedico] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [horarioSel, setHorarioSel] = useState<Horario | null>(null);
  const [formHor, setFormHor] = useState(formHorVacio);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [hor, esp, per] = await Promise.all([
        getHorariosService(),
        getEspecialidadesService(),
        getPersonalService(),
      ]);
      setHorarios(hor);
      setEspecialidades(esp);
      setMedicos(per.filter(p => p.rol === "medico"));
    } catch {
      setError("Error al cargar los horarios");
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg: string) => { setExito(msg); setTimeout(() => setExito(""), 3000); };

  const toggleDia = (dia: number) => {
    setFormHor(prev => ({
      ...prev,
      dias: prev.dias.includes(dia) ? prev.dias.filter(d => d !== dia) : [...prev.dias, dia].sort(),
    }));
  };

  const horariosFiltrados = horarios.filter(h =>
    (!filtroMedico || h.id_personal === Number(filtroMedico)) &&
    (!filtroEspecialidad || h.id_especialidad === Number(filtroEspecialidad)),
  );

  const renderDias = (dias: number[]) => {
    if (!dias || dias.length === 0) return "—";
    return dias.map(d => DIAS_LABELS[d]).join(", ");
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formHor.dias.length === 0) { setError("Selecciona al menos un día"); return; }
    if (!formHor.id_personal || !formHor.id_especialidad) { setError("Selecciona un médico y una especialidad"); return; }

    try {
      await crearHorarioService({
        ...formHor,
        hora_inicio_manana: formHor.hora_inicio_manana || undefined,
        hora_fin_manana: formHor.hora_fin_manana || undefined,
        hora_inicio_tarde: formHor.hora_inicio_tarde || undefined,
        hora_fin_tarde: formHor.hora_fin_tarde || undefined,
      });
      setModalCrear(false);
      setFormHor(formHorVacio);
      await cargarDatos();
      mostrarExito("Horario registrado correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al crear el horario");
    }
  };

  const abrirEditar = (h: Horario) => {
    setHorarioSel(h);
    setFormHor({
      id_personal: h.id_personal,
      id_especialidad: h.id_especialidad,
      hora_inicio_manana: h.hora_inicio_manana || "",
      hora_fin_manana: h.hora_fin_manana || "",
      hora_inicio_tarde: h.hora_inicio_tarde || "",
      hora_fin_tarde: h.hora_fin_tarde || "",
      duracion_cita_min: h.duracion_cita_min,
      dias: h.dias || [],
    });
    setError("");
    setModalEditar(true);
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!horarioSel) return;
    if (formHor.dias.length === 0) { setError("Selecciona al menos un día"); return; }

    try {
      await editarHorarioService(horarioSel.id_horario, {
        ...formHor,
        hora_inicio_manana: formHor.hora_inicio_manana || undefined,
        hora_fin_manana: formHor.hora_fin_manana || undefined,
        hora_inicio_tarde: formHor.hora_inicio_tarde || undefined,
        hora_fin_tarde: formHor.hora_fin_tarde || undefined,
      });
      setModalEditar(false);
      await cargarDatos();
      mostrarExito("Horario actualizado correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al actualizar el horario");
    }
  };

  const handleEliminar = async () => {
    if (!horarioSel) return;
    try {
      await eliminarHorarioService(horarioSel.id_horario);
      setModalEliminar(false);
      await cargarDatos();
      mostrarExito("Horario eliminado correctamente");
    } catch {
      setError("Error al eliminar el horario");
    }
  };

  if (cargando) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid #D1E3EE", borderTopColor: "#0EA5C8", borderRadius: "50%", animation: "cs-spin 0.7s linear infinite" }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } } tr:hover td { background-color: #F8FBFD; }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HiOutlineClock style={{ fontSize: "22px", color: "#0EA5C8" }} />
          <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
            Gestión de Horarios
          </h4>
        </div>
        <BtnPrimary onClick={() => { setFormHor(formHorVacio); setError(""); setModalCrear(true); }}>
          <HiOutlinePlus style={{ fontSize: "16px" }} /> Registrar horario
        </BtnPrimary>
      </div>

      {error && !modalCrear && !modalEditar && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#8FA3B1", fontSize: "12px", fontWeight: 600 }}>
          <HiOutlineFilter style={{ fontSize: "14px" }} /> FILTROS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <Lbl>Médico</Lbl>
            <CsSelect value={filtroMedico} onChange={e => setFiltroMedico(e.target.value)}>
              <option value="">Todos</option>
              {medicos.map(m => (
                <option key={m.id_personal} value={m.id_personal}>{m.nombre}</option>
              ))}
            </CsSelect>
          </div>
          <div>
            <Lbl>Especialidad</Lbl>
            <CsSelect value={filtroEspecialidad} onChange={e => setFiltroEspecialidad(e.target.value)}>
              <option value="">Todas</option>
              {especialidades.map(e => (
                <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
              ))}
            </CsSelect>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Médico", "Especialidad", "Días", "Mañana", "Tarde", "Duración", "Acciones"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horariosFiltrados.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                  No hay horarios registrados con estos filtros
                </td></tr>
              ) : (
                horariosFiltrados.map(h => (
                  <tr key={h.id_horario}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{h.medico}</td>
                    <td style={tdStyle}>{h.especialidad}</td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#4A6275", maxWidth: "150px" }}>{renderDias(h.dias)}</td>
                    <td style={{ ...tdStyle, fontSize: "12px" }}>
                      {h.hora_inicio_manana ? `${h.hora_inicio_manana} - ${h.hora_fin_manana}` : "—"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "12px" }}>
                      {h.hora_inicio_tarde ? `${h.hora_inicio_tarde} - ${h.hora_fin_tarde}` : "—"}
                    </td>
                    <td style={tdStyle}>{h.duracion_cita_min} min</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => abrirEditar(h)}
                          style={{ background: "none", border: "1.5px solid #D1E3EE", borderRadius: "7px", padding: "5px 9px", cursor: "pointer", color: "#0EA5C8" }}
                        >
                          <HiOutlinePencil style={{ fontSize: "13px" }} />
                        </button>
                        <button
                          onClick={() => { setHorarioSel(h); setModalEliminar(true); }}
                          style={{ background: "none", border: "1.5px solid #D1E3EE", borderRadius: "7px", padding: "5px 9px", cursor: "pointer", color: "#C62828" }}
                        >
                          <HiOutlineTrash style={{ fontSize: "13px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalCrear && (
        <ModalOverlay onClose={() => setModalCrear(false)}>
          <ModalHeader title="Registrar Horario" onClose={() => setModalCrear(false)} />
          <form onSubmit={handleCrear} style={{ padding: "20px 24px" }}>
            {error && <Alerta tipo="danger">{error}</Alerta>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <Lbl>Médico</Lbl>
                <CsSelect
                  value={formHor.id_personal}
                  onChange={e => setFormHor({ ...formHor, id_personal: Number(e.target.value) })}
                >
                  <option value={0}>Selecciona</option>
                  {medicos.map(m => <option key={m.id_personal} value={m.id_personal}>{m.nombre}</option>)}
                </CsSelect>
              </div>
              <div>
                <Lbl>Especialidad</Lbl>
                <CsSelect
                  value={formHor.id_especialidad}
                  onChange={e => setFormHor({ ...formHor, id_especialidad: Number(e.target.value) })}
                >
                  <option value={0}>Selecciona</option>
                  {especialidades.map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                </CsSelect>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <Lbl>Días que trabaja</Lbl>
              <DiaSelector dias={formHor.dias} onToggle={toggleDia} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <HoraRango
                label="Mañana"
                inicio={formHor.hora_inicio_manana} fin={formHor.hora_fin_manana}
                onInicio={v => setFormHor({ ...formHor, hora_inicio_manana: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_manana: v })}
              />
              <HoraRango
                label="Tarde"
                inicio={formHor.hora_inicio_tarde} fin={formHor.hora_fin_tarde}
                onInicio={v => setFormHor({ ...formHor, hora_inicio_tarde: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_tarde: v })}
              />
            </div>
            <div style={{ marginBottom: "20px", maxWidth: "200px" }}>
              <Lbl>Duración de cita (min)</Lbl>
              <CsInput
                type="number" min={5} step={5}
                value={formHor.duracion_cita_min}
                onChange={e => setFormHor({ ...formHor, duracion_cita_min: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <BtnSecondary onClick={() => setModalCrear(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit">Registrar horario</BtnPrimary>
            </div>
          </form>
        </ModalOverlay>
      )}

      {modalEditar && horarioSel && (
        <ModalOverlay onClose={() => setModalEditar(false)}>
          <ModalHeader title="Editar Horario" onClose={() => setModalEditar(false)} />
          <form onSubmit={handleEditar} style={{ padding: "20px 24px" }}>
            {error && <Alerta tipo="danger">{error}</Alerta>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <Lbl>Médico</Lbl>
                <CsSelect
                  value={formHor.id_personal}
                  onChange={e => setFormHor({ ...formHor, id_personal: Number(e.target.value) })}
                >
                  {medicos.map(m => <option key={m.id_personal} value={m.id_personal}>{m.nombre}</option>)}
                </CsSelect>
              </div>
              <div>
                <Lbl>Especialidad</Lbl>
                <CsSelect
                  value={formHor.id_especialidad}
                  onChange={e => setFormHor({ ...formHor, id_especialidad: Number(e.target.value) })}
                >
                  {especialidades.map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
                </CsSelect>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <Lbl>Días que trabaja</Lbl>
              <DiaSelector dias={formHor.dias} onToggle={toggleDia} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <HoraRango
                label="Mañana"
                inicio={formHor.hora_inicio_manana} fin={formHor.hora_fin_manana}
                onInicio={v => setFormHor({ ...formHor, hora_inicio_manana: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_manana: v })}
              />
              <HoraRango
                label="Tarde"
                inicio={formHor.hora_inicio_tarde} fin={formHor.hora_fin_tarde}
                onInicio={v => setFormHor({ ...formHor, hora_inicio_tarde: v })}
                onFin={v => setFormHor({ ...formHor, hora_fin_tarde: v })}
              />
            </div>
            <div style={{ marginBottom: "20px", maxWidth: "200px" }}>
              <Lbl>Duración de cita (min)</Lbl>
              <CsInput
                type="number" min={5} step={5}
                value={formHor.duracion_cita_min}
                onChange={e => setFormHor({ ...formHor, duracion_cita_min: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <BtnSecondary onClick={() => setModalEditar(false)}>Cancelar</BtnSecondary>
              <BtnPrimary type="submit">Editar horario</BtnPrimary>
            </div>
          </form>
        </ModalOverlay>
      )}

      {modalEliminar && horarioSel && (
        <ModalOverlay onClose={() => setModalEliminar(false)}>
          <div style={{ padding: "26px 24px", textAlign: "center" }}>
            <h5 style={{ fontSize: "16px", fontWeight: 700, color: "#1A2B3C", margin: "0 0 8px" }}>
              Eliminar Horario
            </h5>
            <p style={{ fontSize: "13px", color: "#4A6275", margin: "0 0 20px" }}>
              ¿Deseas eliminar el horario del doctor <strong>{horarioSel.medico}</strong>?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <BtnSecondary onClick={() => setModalEliminar(false)}>Cancelar</BtnSecondary>
              <BtnDanger onClick={handleEliminar}>Eliminar</BtnDanger>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundColor: "rgba(15,47,69,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "20px",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "520px",
        boxShadow: "0 20px 60px rgba(15,47,69,0.18)", fontFamily: "'Inter', sans-serif",
        maxHeight: "90vh", overflowY: "auto",
      }}
    >
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #EEF4F8" }}>
    <h5 style={{ fontSize: "17px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>{title}</h5>
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1", padding: "4px" }}>
      <HiOutlineX style={{ fontSize: "20px" }} />
    </button>
  </div>
);

export default RecepcionistaHorarios;