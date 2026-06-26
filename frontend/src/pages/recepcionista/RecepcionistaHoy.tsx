import { useState, useEffect } from "react";
import {
  getCitasHoyService,
  cambiarEstadoCitaService,
  type CitaHoy,
} from "../../services/recepcionista.service";
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineUserAdd,
  HiOutlineBan,
} from "react-icons/hi";

// ── Estilos base de tabla (mismos tokens que el resto del sistema) ────────
const thStyle: React.CSSProperties = {
  padding: "11px 16px", fontSize: "11px", fontWeight: 600,
  color: "#8FA3B1", textTransform: "uppercase", letterSpacing: "0.05em",
  backgroundColor: "#F8FBFD", borderBottom: "1px solid #D1E3EE",
  whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: "13px", color: "#1A2B3C",
  borderBottom: "1px solid #EEF4F8", verticalAlign: "middle",
};

const BADGE_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  programada:  { bg: "#E0F7FC", color: "#0B85A3", label: "Programada"  },
  en_espera:   { bg: "#FFF8E1", color: "#F57F17", label: "En espera"   },
  atendida:    { bg: "#E8F5E9", color: "#2E7D32", label: "Atendida"    },
  cancelada:   { bg: "#FFEBEE", color: "#C62828", label: "Cancelada"   },
  inasistente: { bg: "#F0F4F8", color: "#4A6275", label: "Inasistente" },
};

const Badge = ({ estado }: { estado: string }) => {
  const b = BADGE_ESTADO[estado] ?? { bg: "#F0F4F8", color: "#4A6275", label: estado };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 11px",
      borderRadius: "20px", whiteSpace: "nowrap",
      backgroundColor: b.bg, color: b.color,
    }}>
      {b.label}
    </span>
  );
};

// ── Tarjeta de contador ────────────────────────────────────────────────────
const StatCard = ({
  label, value, color, bg,
}: { label: string; value: number; color: string; bg: string }) => (
  <div style={{
    flex: "1 1 140px", backgroundColor: "#FFFFFF", borderRadius: "12px",
    border: "1px solid #D1E3EE", padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: "6px",
  }}>
    <span style={{ fontSize: "11px", fontWeight: 600, color: "#8FA3B1", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "26px", fontWeight: 700, color: "#1A2B3C" }}>{value}</span>
      <span style={{
        width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color,
        boxShadow: `0 0 0 4px ${bg}`,
      }} />
    </div>
  </div>
);

// ── Botón de acción rápida en la fila ──────────────────────────────────────
const BtnAccion = ({
  children, onClick, color, disabled,
}: { children: React.ReactNode; onClick: () => void; color: string; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: "none", border: `1.5px solid ${disabled ? "#EEF4F8" : color}`,
      borderRadius: "7px", padding: "5px 10px", cursor: disabled ? "not-allowed" : "pointer",
      color: disabled ? "#C4D4DF" : color, fontSize: "11.5px", fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontFamily: "'Inter', sans-serif", transition: "background 0.15s",
      opacity: disabled ? 0.6 : 1,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = `${color}1A`; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = "transparent"; }}
  >
    {children}
  </button>
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

// ── Componente principal ──────────────────────────────────────────────────
const RecepcionistaHoy = () => {
  const [citas, setCitas]       = useState<CitaHoy[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState("");
  const [exito, setExito]       = useState("");
  const [accionando, setAccionando] = useState<number | null>(null);

  useEffect(() => {
    cargarCitas();
    const intervalo = setInterval(cargarCitas, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarCitas = async () => {
    try {
      const data = await getCitasHoyService();
      setCitas(data);
      setError("");
    } catch {
      setError("No se pudieron cargar las citas de hoy. Verifica tu conexión.");
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(""), 3000);
  };

  const handleCambiarEstado = async (id_cita: number, estado: string) => {
    setAccionando(id_cita);
    try {
      await cambiarEstadoCitaService(id_cita, estado);
      await cargarCitas();
      mostrarExito(
        estado === "en_espera"   ? "Paciente marcado como en espera" :
        estado === "atendida"    ? "Cita marcada como atendida" :
        estado === "inasistente" ? "Cita marcada como inasistencia" : "Estado actualizado",
      );
    } catch {
      setError("No se pudo actualizar el estado de la cita");
    } finally {
      setAccionando(null);
    }
  };

  const contadores = {
    en_espera:  citas.filter(c => c.estado === "en_espera").length,
    programada: citas.filter(c => c.estado === "programada").length,
    atendida:   citas.filter(c => c.estado === "atendida").length,
    cancelada:  citas.filter(c => c.estado === "cancelada").length,
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

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Listado de Atención — Hoy
        </h4>
      </div>

      {error && <Alerta tipo="danger">{error}</Alerta>}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* Contadores */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <StatCard label="En espera"  value={contadores.en_espera}  color="#F57F17" bg="rgba(245,127,23,0.15)" />
        <StatCard label="Agendadas"  value={contadores.programada} color="#0EA5C8" bg="rgba(14,165,200,0.15)" />
        <StatCard label="Atendidas"  value={contadores.atendida}   color="#2E7D32" bg="rgba(46,125,50,0.15)" />
        <StatCard label="Canceladas" value={contadores.cancelada}  color="#C62828" bg="rgba(198,40,40,0.15)" />
      </div>

      {/* Tabla */}
      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "12px",
        border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Hora", "Paciente", "Doctor", "Especialidad", "Estado", "Acciones"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                    No hay citas registradas para hoy
                  </td>
                </tr>
              ) : (
                citas.map(c => (
                  <tr key={c.id_cita}>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {c.hora.substring(0, 5)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{c.paciente}</div>
                      {c.paciente_ci && (
                        <div style={{ fontSize: "11px", color: "#8FA3B1" }}>CI: {c.paciente_ci}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{c.medico}</td>
                    <td style={{ ...tdStyle, color: "#4A6275" }}>{c.especialidad}</td>
                    <td style={tdStyle}><Badge estado={c.estado} /></td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <BtnAccion
                          color="#F57F17"
                          disabled={c.estado !== "programada" || accionando === c.id_cita}
                          onClick={() => handleCambiarEstado(c.id_cita, "en_espera")}
                        >
                          <HiOutlineUserAdd style={{ fontSize: "13px" }} /> En espera
                        </BtnAccion>
                        <BtnAccion
                          color="#2E7D32"
                          disabled={!["programada", "en_espera"].includes(c.estado) || accionando === c.id_cita}
                          onClick={() => handleCambiarEstado(c.id_cita, "atendida")}
                        >
                          <HiOutlineCheckCircle style={{ fontSize: "13px" }} /> Atendida
                        </BtnAccion>
                        <BtnAccion
                          color="#8FA3B1"
                          disabled={!["programada", "en_espera"].includes(c.estado) || accionando === c.id_cita}
                          onClick={() => handleCambiarEstado(c.id_cita, "inasistente")}
                        >
                          <HiOutlineBan style={{ fontSize: "13px" }} /> Inasistente
                        </BtnAccion>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota informativa */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8FA3B1", fontSize: "12px" }}>
        <HiOutlineClock style={{ fontSize: "14px" }} />
        La lista se actualiza automáticamente cada 30 segundos.
      </div>
    </div>
  );
};

export default RecepcionistaHoy;