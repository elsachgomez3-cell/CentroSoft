import { useState, useEffect } from "react";
import type { Paciente, Especialidad, Horario, SlotDisponible } from "../../types";
import { getEspecialidadesService } from "../../services/admin.service";
import {
  buscarPacientePorCIService,
  getHorariosService,
  getDisponibilidadService,
  agendarCitaParaPacienteService,
} from "../../services/recepcionista.service";
import {
  HiOutlineCalendar,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineUser,
  HiOutlineX,
} from "react-icons/hi";

interface PacienteSel extends Paciente {
  nom_usuario?: string;
}

// ── Componentes base ───────────────────────────────────────────────────────
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
        backgroundColor: props.disabled ? "#F8FBFD" : "#FFFFFF",
        outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(props.style as React.CSSProperties),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    style={{
      width: "100%", padding: "9px 13px", border: "1.5px solid #D1E3EE",
      borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif",
      color: "#1A2B3C", backgroundColor: props.disabled ? "#F8FBFD" : "#FFFFFF",
      outline: "none", boxSizing: "border-box", cursor: props.disabled ? "not-allowed" : "pointer",
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
    }}
  >
    {children}
  </button>
);

const BtnSecondary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: "9px 20px", backgroundColor: "transparent", color: "#4A6275",
      border: "1.5px solid #D1E3EE", borderRadius: "8px",
      fontSize: "13px", fontWeight: 600, cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </button>
);

const Spinner = () => (
  <div style={{
    width: "16px", height: "16px", border: "2px solid #D1E3EE",
    borderTopColor: "currentColor", borderRadius: "50%",
    animation: "cs-spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

// ── Componente principal ──────────────────────────────────────────────────
const RecepcionistaAgendar = () => {
  // Paso 1: paciente
  const [ciBusqueda, setCiBusqueda]   = useState("");
  const [paciente, setPaciente]       = useState<PacienteSel | null>(null);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [errorPaciente, setErrorPaciente] = useState("");

  // Paso 2: filtros
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [horarios, setHorarios]             = useState<Horario[]>([]);
  const [idEspecialidad, setIdEspecialidad] = useState("");
  const [idHorario, setIdHorario]           = useState("");
  const [fecha, setFecha]                   = useState("");

  // Paso 3: slots
  const [slots, setSlots]           = useState<SlotDisponible[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [horaSel, setHoraSel]       = useState("");
  const [motivo, setMotivo]         = useState("");

  // Confirmación + estado general
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [agendando, setAgendando]   = useState(false);
  const [error, setError]           = useState("");
  const [exito, setExito]           = useState("");

  useEffect(() => {
    getEspecialidadesService().then(setEspecialidades).catch(() => {});
    getHorariosService().then(setHorarios).catch(() => {});
  }, []);

  const horariosFiltrados = horarios.filter(
    h => h.activo && (!idEspecialidad || h.id_especialidad === Number(idEspecialidad)),
  );

  // ── Buscar paciente ──
  const handleBuscarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPaciente(""); setPaciente(null);

    if (!ciBusqueda.trim()) {
      setErrorPaciente("Ingresa el carnet de identidad del paciente");
      return;
    }

    setBuscandoPaciente(true);
    try {
      const data = await buscarPacientePorCIService(ciBusqueda.trim());
      setPaciente(data);
    } catch (err: any) {
      setErrorPaciente(err.response?.data?.error || "No se encontró un paciente con esa cédula");
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // ── Cargar disponibilidad cuando hay horario + fecha ──
  useEffect(() => {
    if (!idHorario || !fecha) { setSlots([]); return; }

    setCargandoSlots(true);
    setHoraSel("");
    getDisponibilidadService(Number(idHorario), fecha)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setCargandoSlots(false));
  }, [idHorario, fecha]);

  const horarioSeleccionado = horarios.find(h => h.id_horario === Number(idHorario));

  const handleAgendar = async () => {
    if (!paciente || !idHorario || !fecha || !horaSel) return;

    setAgendando(true);
    setError("");
    try {
      await agendarCitaParaPacienteService({
        id_paciente: paciente.id_paciente,
        id_horario: Number(idHorario),
        fecha,
        hora: horaSel,
        motivo: motivo || undefined,
      });
      setExito(`Cita agendada para ${paciente.primer_nombre} ${paciente.apellido_pat} el ${fecha} a las ${horaSel}`);
      setMostrarConfirmacion(false);
      setPaciente(null); setCiBusqueda("");
      setIdEspecialidad(""); setIdHorario(""); setFecha("");
      setSlots([]); setHoraSel(""); setMotivo("");
      setTimeout(() => setExito(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "No se pudo agendar la cita");
      setMostrarConfirmacion(false);
    } finally {
      setAgendando(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Agendar Cita Médica
        </h4>
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* ── PASO 1: Buscar paciente ─────────────────────────────────────── */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0EA5C8", marginBottom: "14px" }}>
          1. Selecciona el paciente
        </div>

        {!paciente ? (
          <>
            {errorPaciente && <Alerta tipo="danger">{errorPaciente}</Alerta>}
            <form onSubmit={handleBuscarPaciente} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px" }}>
                <Lbl>Cédula del paciente</Lbl>
                <CsInput
                  value={ciBusqueda}
                  onChange={e => setCiBusqueda(e.target.value)}
                  placeholder="Carnet de identidad"
                />
              </div>
              <BtnPrimary type="submit" disabled={buscandoPaciente}>
                {buscandoPaciente ? <Spinner /> : <HiOutlineSearch style={{ fontSize: "15px" }} />}
                Buscar
              </BtnPrimary>
            </form>
          </>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "#F0FBFD", border: "1px solid #BEE8F2", borderRadius: "10px",
            padding: "12px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #0EA5C8, #1A4B6B)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700,
              }}>
                {paciente.primer_nombre?.[0]?.toUpperCase()}{paciente.apellido_pat?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A2B3C" }}>
                  {paciente.primer_nombre} {paciente.apellido_pat} {paciente.apellido_mat || ""}
                </div>
                <div style={{ fontSize: "11px", color: "#8FA3B1" }}>
                  CI: {paciente.ci} {paciente.telefono ? `· Tel: ${paciente.telefono}` : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setPaciente(null); setCiBusqueda(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1", padding: "4px" }}
              title="Cambiar paciente"
            >
              <HiOutlineX style={{ fontSize: "18px" }} />
            </button>
          </div>
        )}
      </div>

      {/* ── PASO 2: Especialidad, médico y fecha ────────────────────────── */}
      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE",
        padding: "20px 24px", opacity: paciente ? 1 : 0.5,
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0EA5C8", marginBottom: "14px" }}>
          2. Elige especialidad, médico y fecha
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <Lbl>Especialidad</Lbl>
            <CsSelect
              disabled={!paciente}
              value={idEspecialidad}
              onChange={e => { setIdEspecialidad(e.target.value); setIdHorario(""); }}
            >
              <option value="">Todas</option>
              {especialidades.map(e => (
                <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
              ))}
            </CsSelect>
          </div>
          <div>
            <Lbl>Médico</Lbl>
            <CsSelect
              disabled={!paciente}
              value={idHorario}
              onChange={e => setIdHorario(e.target.value)}
            >
              <option value="">Selecciona un médico</option>
              {horariosFiltrados.map(h => (
                <option key={h.id_horario} value={h.id_horario}>
                  {h.medico} — {h.especialidad}
                </option>
              ))}
            </CsSelect>
          </div>
          <div>
            <Lbl>Fecha</Lbl>
            <CsInput
              type="date"
              disabled={!paciente}
              value={fecha}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── PASO 3: Horarios disponibles ────────────────────────────────── */}
      {idHorario && fecha && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0EA5C8", marginBottom: "14px" }}>
            3. Selecciona un horario disponible
          </div>

          {cargandoSlots ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}><Spinner /></div>
          ) : slots.length === 0 ? (
            <div style={{ color: "#8FA3B1", fontSize: "13px", padding: "12px 0" }}>
              {horarioSeleccionado ? "El médico no atiende ese día o no quedan horarios disponibles." : "Selecciona médico y fecha."}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {slots.map(s => {
                const sel = horaSel === s.hora;
                return (
                  <button
                    key={s.hora}
                    disabled={!s.disponible}
                    onClick={() => setHoraSel(s.hora)}
                    style={{
                      padding: "8px 14px", borderRadius: "8px",
                      border: sel ? "1.5px solid #0EA5C8" : "1.5px solid #D1E3EE",
                      backgroundColor: !s.disponible ? "#F8FBFD" : sel ? "#0EA5C8" : "#FFFFFF",
                      color: !s.disponible ? "#C4D4DF" : sel ? "#FFFFFF" : "#1A2B3C",
                      fontSize: "13px", fontWeight: 600,
                      cursor: s.disponible ? "pointer" : "not-allowed",
                      textDecoration: !s.disponible ? "line-through" : "none",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {s.hora}
                  </button>
                );
              })}
            </div>
          )}

          {horaSel && (
            <div style={{ marginTop: "18px" }}>
              <Lbl>Motivo de la cita (opcional)</Lbl>
              <CsInput
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: control, dolor de cabeza, chequeo general..."
              />
            </div>
          )}
        </div>
      )}

      {/* Botón final */}
      {paciente && idHorario && fecha && horaSel && (
        <div>
          <BtnPrimary onClick={() => setMostrarConfirmacion(true)}>
            <HiOutlineCalendar style={{ fontSize: "15px" }} />
            Agendar cita
          </BtnPrimary>
        </div>
      )}

      {/* ══ MODAL de confirmación ════════════════════════════════════════ */}
      {mostrarConfirmacion && paciente && horarioSeleccionado && (
        <div
          onClick={() => !agendando && setMostrarConfirmacion(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(15,47,69,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "400px",
              padding: "26px", fontFamily: "'Inter', sans-serif",
              boxShadow: "0 20px 60px rgba(15,47,69,0.18)", textAlign: "center",
            }}
          >
            <HiOutlineUser style={{ fontSize: "32px", color: "#0EA5C8", marginBottom: "10px" }} />
            <h5 style={{ fontSize: "16px", fontWeight: 700, color: "#1A2B3C", margin: "0 0 6px" }}>
              ¿Deseas agendar esta cita?
            </h5>
            <p style={{ fontSize: "13px", color: "#4A6275", margin: "0 0 18px", lineHeight: 1.5 }}>
              <strong>{paciente.primer_nombre} {paciente.apellido_pat}</strong><br />
              con <strong>{horarioSeleccionado.medico}</strong> ({horarioSeleccionado.especialidad})<br />
              el <strong>{fecha}</strong> a las <strong>{horaSel}</strong>
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <BtnSecondary onClick={() => setMostrarConfirmacion(false)}>Cancelar</BtnSecondary>
              <BtnPrimary onClick={handleAgendar} disabled={agendando}>
                {agendando ? <><Spinner /><span>Agendando...</span></> : "Sí, agendar"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepcionistaAgendar;