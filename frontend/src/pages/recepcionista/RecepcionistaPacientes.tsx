import { useState } from "react";
import type { Paciente } from "../../types";
import {
  registrarPacienteService,
  buscarPacientePorCIService,
} from "../../services/recepcionista.service";
import {
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineIdentification,
} from "react-icons/hi";

// La búsqueda por CI también devuelve nom_usuario (no está en el tipo
// compartido Paciente porque ese tipo es para listados administrativos)
interface PacienteEncontrado extends Paciente {
  nom_usuario: string;
}

// ── Componentes base (mismos tokens del resto del sistema) ────────────────
const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "9px 13px",
        border: `1.5px solid ${focused ? "#0EA5C8" : "#D1E3EE"}`,
        borderRadius: "8px", fontSize: "13px",
        fontFamily: "'Inter', sans-serif", color: "#1A2B3C",
        backgroundColor: "#FFFFFF", outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(props.style as React.CSSProperties),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const Lbl = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#4A6275", marginBottom: "5px" }}>
    {children}
    {optional && <span style={{ color: "#8FA3B1", fontSize: "11px", marginLeft: "4px" }}>(opcional)</span>}
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

const BtnPrimary = ({ children, type = "button", disabled, onClick }: {
  children: React.ReactNode; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void;
}) => (
  <button
    type={type} disabled={disabled} onClick={onClick}
    style={{
      padding: "9px 20px",
      backgroundColor: disabled ? "#8FA3B1" : "#0EA5C8",
      color: "#fff", border: "none", borderRadius: "8px",
      fontSize: "13px", fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', sans-serif",
      display: "inline-flex", alignItems: "center", gap: "6px",
      transition: "background 0.2s",
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = "#0B85A3"; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? "#8FA3B1" : "#0EA5C8"; }}
  >
    {children}
  </button>
);

const Spinner = ({ small }: { small?: boolean }) => (
  <div style={{
    width: small ? "16px" : "20px", height: small ? "16px" : "20px",
    border: "2px solid #D1E3EE", borderTopColor: "currentColor",
    borderRadius: "50%", animation: "cs-spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

// Fila de dato en el modal de resultado
const DatoFila = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid #EEF4F8" }}>
    <span style={{ fontSize: "16px", color: "#0EA5C8", marginTop: "1px" }}>{icon}</span>
    <div>
      <div style={{ fontSize: "11px", color: "#8FA3B1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#1A2B3C", fontWeight: 500, marginTop: "2px" }}>{value || "—"}</div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────
const RecepcionistaPacientes = () => {
  const [tab, setTab] = useState<"registrar" | "buscar">("registrar");

  // ── Registrar ──
  const formVacio = {
    primer_nombre: "", apellido_pat: "", apellido_mat: "",
    ci: "", email: "", telefono: "", direccion: "",
    fecha_nac: "", nom_usuario: "", contrasena: "",
  };
  const [form, setForm] = useState(formVacio);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [exitoForm, setExitoForm] = useState("");

  // ── Buscar ──
  const [ciBusqueda, setCiBusqueda] = useState("");
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] = useState<PacienteEncontrado | null>(null);

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(""); setExitoForm("");

    if (!form.primer_nombre || !form.apellido_pat || !form.ci || !form.email || !form.nom_usuario || !form.contrasena) {
      setErrorForm("Completa los campos obligatorios: nombre, apellido, CI, email, usuario y contraseña");
      return;
    }

    setCargandoForm(true);
    try {
      await registrarPacienteService({
        ...form,
        apellido_mat: form.apellido_mat || undefined,
        telefono:     form.telefono     || undefined,
        direccion:    form.direccion    || undefined,
        fecha_nac:    form.fecha_nac    || undefined,
      });
      setForm(formVacio);
      setExitoForm("Paciente registrado correctamente");
    } catch (err: any) {
      setErrorForm(err.response?.data?.error || "Error al registrar el paciente");
    } finally {
      setCargandoForm(false);
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBusqueda(""); setPacienteEncontrado(null);

    if (!ciBusqueda.trim()) {
      setErrorBusqueda("Ingresa un número de cédula para buscar");
      return;
    }

    setCargandoBusqueda(true);
    try {
      const paciente = await buscarPacientePorCIService(ciBusqueda.trim());
      setPacienteEncontrado(paciente as PacienteEncontrado);
    } catch (err: any) {
      setErrorBusqueda(err.response?.data?.error || "No se encontró un paciente con esa cédula");
    } finally {
      setCargandoBusqueda(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineUserAdd style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Gestión de Pacientes
        </h4>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "2px solid #D1E3EE" }}>
        {([
          { key: "registrar", label: "Registrar paciente", Icon: HiOutlineUserAdd },
          { key: "buscar",    label: "Buscar paciente",    Icon: HiOutlineSearch  },
        ] as const).map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "10px 18px", border: "none",
                backgroundColor: "transparent",
                color: active ? "#0EA5C8" : "#4A6275",
                borderBottom: active ? "2px solid #0EA5C8" : "2px solid transparent",
                fontSize: "13px", fontWeight: active ? 600 : 500,
                cursor: "pointer", marginBottom: "-2px",
                fontFamily: "'Inter', sans-serif", transition: "color 0.15s",
              }}
            >
              <Icon style={{ fontSize: "15px" }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── TAB REGISTRAR ───────────────────────────────────────────────── */}
      {tab === "registrar" && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          padding: "24px",
        }}>
          {errorForm && <Alerta tipo="danger">{errorForm}</Alerta>}
          {exitoForm && <Alerta tipo="success">{exitoForm}</Alerta>}

          <form onSubmit={handleRegistrar}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <Lbl>Nombre completo</Lbl>
                <CsInput
                  value={form.primer_nombre}
                  onChange={e => setForm({ ...form, primer_nombre: e.target.value })}
                  placeholder="Nombre(s)"
                />
              </div>
              <div>
                <Lbl>Apellido paterno</Lbl>
                <CsInput
                  value={form.apellido_pat}
                  onChange={e => setForm({ ...form, apellido_pat: e.target.value })}
                />
              </div>
              <div>
                <Lbl optional>Apellido materno</Lbl>
                <CsInput
                  value={form.apellido_mat}
                  onChange={e => setForm({ ...form, apellido_mat: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <Lbl>Carnet de identidad</Lbl>
                <CsInput
                  value={form.ci}
                  onChange={e => setForm({ ...form, ci: e.target.value })}
                />
              </div>
              <div>
                <Lbl>Correo electrónico</Lbl>
                <CsInput
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Lbl optional>Teléfono de contacto</Lbl>
                <CsInput
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div>
                <Lbl optional>Dirección</Lbl>
                <CsInput
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
              <div>
                <Lbl optional>Fecha de nacimiento</Lbl>
                <CsInput
                  type="date"
                  value={form.fecha_nac}
                  onChange={e => setForm({ ...form, fecha_nac: e.target.value })}
                />
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px",
              marginBottom: "20px", paddingTop: "16px", borderTop: "1px solid #EEF4F8",
            }}>
              <div>
                <Lbl>Nombre de usuario</Lbl>
                <CsInput
                  value={form.nom_usuario}
                  onChange={e => setForm({ ...form, nom_usuario: e.target.value })}
                  placeholder="Para iniciar sesión"
                />
              </div>
              <div>
                <Lbl>Contraseña</Lbl>
                <CsInput
                  type="password"
                  value={form.contrasena}
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                />
              </div>
            </div>

            <BtnPrimary type="submit" disabled={cargandoForm}>
              {cargandoForm ? (
                <><Spinner small /><span>Registrando...</span></>
              ) : (
                <><HiOutlineUserAdd style={{ fontSize: "15px" }} />Registrar paciente</>
              )}
            </BtnPrimary>
          </form>
        </div>
      )}

      {/* ── TAB BUSCAR ──────────────────────────────────────────────────── */}
      {tab === "buscar" && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          padding: "24px",
        }}>
          {errorBusqueda && <Alerta tipo="danger">{errorBusqueda}</Alerta>}

          <form onSubmit={handleBuscar} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <Lbl>Buscar por cédula</Lbl>
              <CsInput
                value={ciBusqueda}
                onChange={e => setCiBusqueda(e.target.value)}
                placeholder="Número de carnet de identidad"
              />
            </div>
            <BtnPrimary type="submit" disabled={cargandoBusqueda}>
              {cargandoBusqueda ? (
                <><Spinner small /><span>Buscando...</span></>
              ) : (
                <><HiOutlineSearch style={{ fontSize: "15px" }} />Buscar</>
              )}
            </BtnPrimary>
          </form>
        </div>
      )}

      {/* ══ MODAL — Datos del paciente encontrado ════════════════════════ */}
      {pacienteEncontrado && (
        <div
          onClick={() => setPacienteEncontrado(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(15,47,69,0.5)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "440px",
              boxShadow: "0 20px 60px rgba(15,47,69,0.18)", fontFamily: "'Inter', sans-serif",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #EEF4F8" }}>
              <h5 style={{ fontSize: "17px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>Datos del Paciente</h5>
              <button
                onClick={() => setPacienteEncontrado(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1", padding: "4px", borderRadius: "6px" }}
              >
                <HiOutlineX style={{ fontSize: "20px" }} />
              </button>
            </div>

            <div style={{ padding: "8px 24px 20px" }}>
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%", margin: "12px auto 8px",
                  background: "linear-gradient(135deg, #0EA5C8, #1A4B6B)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 700,
                }}>
                  {pacienteEncontrado.primer_nombre?.[0]?.toUpperCase()}{pacienteEncontrado.apellido_pat?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A2B3C" }}>
                  {pacienteEncontrado.primer_nombre} {pacienteEncontrado.apellido_pat} {pacienteEncontrado.apellido_mat || ""}
                </div>
                <div style={{ fontSize: "12px", color: "#8FA3B1" }}>@{pacienteEncontrado.nom_usuario}</div>
              </div>

              <DatoFila icon={<HiOutlineIdentification />} label="Carnet de identidad" value={pacienteEncontrado.ci || ""} />
              <DatoFila icon={<HiOutlineCalendar />} label="Edad" value={pacienteEncontrado.edad ? `${pacienteEncontrado.edad} años` : ""} />
              <DatoFila icon={<HiOutlinePhone />} label="Teléfono" value={pacienteEncontrado.telefono || ""} />
              <DatoFila icon={<HiOutlineMail />} label="Correo electrónico" value={pacienteEncontrado.email || ""} />
              <DatoFila icon={<HiOutlineLocationMarker />} label="Dirección" value={pacienteEncontrado.direccion || ""} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid #EEF4F8" }}>
              <BtnPrimary onClick={() => setPacienteEncontrado(null)}>Cerrar</BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepcionistaPacientes;