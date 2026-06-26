import { useState, useEffect } from "react";
import type { Paciente, Horario, SlotDisponible } from "../../types";
import type { CitaAdmin } from "../../services/admin.service";
import {
  buscarPacientePorCIService,
  getHorariosService,
  getDisponibilidadService,
  reprogramarCitaService,
} from "../../services/recepcionista.service";
import api from "../../services/api";
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
} from "react-icons/hi";

interface PacienteSel extends Paciente {
  nom_usuario?: string;
}

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

const Spinner = () => (
  <div style={{
    width: "16px", height: "16px", border: "2px solid #D1E3EE",
    borderTopColor: "currentColor", borderRadius: "50%",
    animation: "cs-spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontSize: "11px", fontWeight: 600,
  color: "#8FA3B1", textTransform: "uppercase", letterSpacing: "0.04em",
  backgroundColor: "#F8FBFD", borderBottom: "1px solid #D1E3EE",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 14px", fontSize: "13px", color: "#1A2B3C",
  borderBottom: "1px solid #EEF4F8",
};

const RecepcionistaReprogramar = () => {
  const [ci, setCi] = useState("");
  const [paciente, setPaciente] = useState<PacienteSel | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  const [citas, setCitas] = useState<CitaAdmin[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [citaSel, setCitaSel] = useState<CitaAdmin | null>(null);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [idHorario, setIdHorario] = useState("");
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [horaSel, setHoraSel] = useState("");
  const [motivoCambio, setMotivoCambio] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    getHorariosService().then(setHorarios).catch(() => {});
  }, []);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBusqueda(""); setPaciente(null); setCitas([]); setCitaSel(null);

    if (!ci.trim()) {
      setErrorBusqueda("Ingresa el carnet de identidad del paciente");
      return;
    }

    setBuscando(true);
    try {
      const p = await buscarPacientePorCIService(ci.trim());
      setPaciente(p);
      setCargandoCitas(true);
      const res = await api.get("/citas/todas", { params: { estado: "programada" } });
      const citasDelPaciente = (res.data as CitaAdmin[]).filter(
        c => c.id_paciente === p.id_paciente,
      );
      setCitas(citasDelPaciente);
    } catch (err: any) {
      setErrorBusqueda(err.response?.data?.error || "No se encontró un paciente con esa cédula");
    } finally {
      setBuscando(false);
      setCargandoCitas(false);
    }
  };

  useEffect(() => {
    if (!idHorario || !fecha) { setSlots([]); return; }
    setCargandoSlots(true);
    setHoraSel("");
    getDisponibilidadService(Number(idHorario), fecha)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setCargandoSlots(false));
  }, [idHorario, fecha]);

  const seleccionarCita = (c: CitaAdmin) => {
    setCitaSel(c);
    setIdHorario(String(c.id_horario));
    setFecha(""); setHoraSel(""); setSlots([]); setMotivoCambio("");
    setError(""); setExito("");
  };

  const handleReprogramar = async () => {
    if (!citaSel || !idHorario || !fecha || !horaSel) return;
    setGuardando(true);
    setError("");
    try {
      await reprogramarCitaService(citaSel.id_cita, {
        id_horario: Number(idHorario),
        fecha,
        hora: horaSel,
        motivo_cambio: motivoCambio || undefined,
      });
      setExito(`Cita reprogramada para el ${fecha} a las ${horaSel}`);
      setCitas(citas.filter(c => c.id_cita !== citaSel.id_cita));
      setCitaSel(null); setIdHorario(""); setFecha(""); setHoraSel(""); setSlots([]); setMotivoCambio("");
      setTimeout(() => setExito(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "No se pudo reprogramar la cita");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineRefresh style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Reprogramar Cita Médica
        </h4>
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
        {errorBusqueda && <Alerta tipo="danger">{errorBusqueda}</Alerta>}
        <form onSubmit={handleBuscar} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <Lbl>Paciente (cédula)</Lbl>
            <CsInput value={ci} onChange={e => setCi(e.target.value)} placeholder="Carnet de identidad" />
          </div>
          <BtnPrimary type="submit" disabled={buscando}>
            {buscando ? <Spinner /> : <HiOutlineSearch style={{ fontSize: "15px" }} />}
            Buscar
          </BtnPrimary>
        </form>
      </div>

      {paciente && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #EEF4F8", fontSize: "13px", fontWeight: 700, color: "#0EA5C8" }}>
            1. Selecciona la cita que deseas reprogramar — {paciente.primer_nombre} {paciente.apellido_pat}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["", "Fecha", "Hora", "Doctor", "Especialidad", "Estado"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargandoCitas ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: "30px" }}><Spinner /></td></tr>
                ) : citas.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "30px" }}>
                    Este paciente no tiene citas programadas
                  </td></tr>
                ) : (
                  citas.map(c => (
                    <tr key={c.id_cita} style={{ backgroundColor: citaSel?.id_cita === c.id_cita ? "#F0FBFD" : "transparent" }}>
                      <td style={tdStyle}>
                        <input
                          type="radio"
                          checked={citaSel?.id_cita === c.id_cita}
                          onChange={() => seleccionarCita(c)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={tdStyle}>{c.fecha}</td>
                      <td style={tdStyle}>{c.hora.substring(0, 5)}</td>
                      <td style={tdStyle}>{c.medico}</td>
                      <td style={tdStyle}>{c.especialidad}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: "#E0F7FC", color: "#0B85A3" }}>
                          Programada
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {citaSel && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0EA5C8", marginBottom: "14px" }}>
            2. Elige la nueva fecha y hora
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <Lbl>Médico</Lbl>
              <CsSelect value={idHorario} onChange={e => setIdHorario(e.target.value)}>
                {horarios.filter(h => h.activo).map(h => (
                  <option key={h.id_horario} value={h.id_horario}>{h.medico} — {h.especialidad}</option>
                ))}
              </CsSelect>
            </div>
            <div>
              <Lbl>Fecha</Lbl>
              <CsInput
                type="date"
                value={fecha}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
          </div>

          {idHorario && fecha && (
            <>
              {cargandoSlots ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}><Spinner /></div>
              ) : slots.length === 0 ? (
                <div style={{ color: "#8FA3B1", fontSize: "13px" }}>No hay horarios disponibles para esa fecha.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
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
                <div style={{ marginBottom: "16px" }}>
                  <Lbl>Motivo del cambio (opcional)</Lbl>
                  <CsInput
                    value={motivoCambio}
                    onChange={e => setMotivoCambio(e.target.value)}
                    placeholder="Ej: el paciente solicitó otro horario"
                  />
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <BtnPrimary onClick={handleReprogramar} disabled={!horaSel || guardando}>
              {guardando ? <><Spinner /><span>Guardando...</span></> : <><HiOutlineRefresh style={{ fontSize: "15px" }} />Reprogramar cita</>}
            </BtnPrimary>
            <button
              onClick={() => { setCitaSel(null); setIdHorario(""); setFecha(""); setHoraSel(""); setSlots([]); }}
              style={{
                padding: "9px 16px", backgroundColor: "transparent", color: "#4A6275",
                border: "1.5px solid #D1E3EE", borderRadius: "8px", fontSize: "13px",
                fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
            >
              <HiOutlineX style={{ fontSize: "14px" }} />Cancelar selección
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecepcionistaReprogramar;