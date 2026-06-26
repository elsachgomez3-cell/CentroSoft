import { useState } from "react";
import type { Paciente } from "../../types";
import type { CitaAdmin } from "../../services/admin.service";
import {
  buscarPacientePorCIService,
  cancelarCitaService,
} from "../../services/recepcionista.service";
import api from "../../services/api";
import {
  HiOutlineBan,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
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
        backgroundColor: "#FFFFFF", outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        ...(props.style as React.CSSProperties),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

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

const BtnPrimary = ({ children, type = "button", disabled, onClick, danger }: {
  children: React.ReactNode; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void; danger?: boolean;
}) => (
  <button
    type={type} disabled={disabled} onClick={onClick}
    style={{
      padding: "9px 20px",
      backgroundColor: disabled ? "#8FA3B1" : danger ? "#C62828" : "#0EA5C8",
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

const RecepcionistaCancelar = () => {
  const [ci, setCi] = useState("");
  const [paciente, setPaciente] = useState<PacienteSel | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  const [citas, setCitas] = useState<CitaAdmin[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [citaSel, setCitaSel] = useState<CitaAdmin | null>(null);

  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

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

  const handleCancelar = async () => {
    if (!citaSel) return;
    if (!motivo.trim()) {
      setError("Indica el motivo de la cancelación");
      return;
    }

    setCancelando(true);
    setError("");
    try {
      await cancelarCitaService(citaSel.id_cita, motivo.trim());
      setExito(`Cita del ${citaSel.fecha} a las ${citaSel.hora.substring(0, 5)} cancelada correctamente`);
      setCitas(citas.filter(c => c.id_cita !== citaSel.id_cita));
      setCitaSel(null); setMotivo("");
      setTimeout(() => setExito(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || "No se pudo cancelar la cita");
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineBan style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Cancelar Cita
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
            Selecciona la cita que deseas cancelar — {paciente.primer_nombre} {paciente.apellido_pat}
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
                    <tr key={c.id_cita} style={{ backgroundColor: citaSel?.id_cita === c.id_cita ? "#FFF5F5" : "transparent" }}>
                      <td style={tdStyle}>
                        <input
                          type="radio"
                          checked={citaSel?.id_cita === c.id_cita}
                          onChange={() => { setCitaSel(c); setError(""); setExito(""); }}
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
          <Lbl>Motivo de la cancelación</Lbl>
          <CsInput
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: el paciente no podrá asistir"
            style={{ marginBottom: "16px" }}
          />
          <BtnPrimary onClick={handleCancelar} disabled={cancelando} danger>
            {cancelando ? <><Spinner /><span>Cancelando...</span></> : <><HiOutlineBan style={{ fontSize: "15px" }} />Cancelar cita</>}
          </BtnPrimary>
        </div>
      )}
    </div>
  );
};

export default RecepcionistaCancelar;