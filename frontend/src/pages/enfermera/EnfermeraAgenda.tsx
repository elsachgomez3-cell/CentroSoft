import { useState, useEffect, useMemo } from "react";
import {
  getCitasHoyService,
  type CitaHoyEnfermera,
} from "../../services/enfermera.service";
import {
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

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

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    style={{
      padding: "9px 13px", border: "1.5px solid #D1E3EE",
      borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif",
      color: "#1A2B3C", backgroundColor: "#FFFFFF", outline: "none",
      cursor: "pointer", minWidth: "220px",
    }}
  />
);

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

const Alerta = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: "10px",
    padding: "12px 14px", borderRadius: "8px",
    backgroundColor: "#FFEBEE", color: "#C62828", borderLeft: "4px solid #C62828",
    fontSize: "13px", marginBottom: "16px",
  }}>
    <HiOutlineExclamationCircle style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }} />
    <span>{children}</span>
  </div>
);

const EnfermeraAgenda = () => {
  const [citas, setCitas] = useState<CitaHoyEnfermera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroDoctor, setFiltroDoctor] = useState("");

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = async () => {
    try {
      const data = await getCitasHoyService();
      setCitas(data);
      setError("");
    } catch {
      setError("No se pudo cargar la agenda. Verifica tu conexión.");
    } finally {
      setCargando(false);
    }
  };

  const doctores = useMemo(
    () => Array.from(new Set(citas.map(c => c.medico))).sort(),
    [citas],
  );

  const citasFiltradas = citas.filter(c => !filtroDoctor || c.medico === filtroDoctor);

  if (cargando) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid #D1E3EE", borderTopColor: "#0EA5C8", borderRadius: "50%", animation: "cs-spin 0.7s linear infinite" }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } } tr:hover td { background-color: #F8FBFD; }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Agenda de Atenciones — Hoy
        </h4>
      </div>

      {error && <Alerta>{error}</Alerta>}

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontSize: "12px", fontWeight: 500, color: "#4A6275" }}>Filtrar por doctor:</label>
        <CsSelect value={filtroDoctor} onChange={e => setFiltroDoctor(e.target.value)}>
          <option value="">Todos los doctores</option>
          {doctores.map(d => <option key={d} value={d}>{d}</option>)}
        </CsSelect>
      </div>

      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "12px",
        border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Hora", "Paciente", "Doctor", "Especialidad", "Estado"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                    No hay citas registradas {filtroDoctor ? "para este doctor" : "para hoy"}
                  </td>
                </tr>
              ) : (
                citasFiltradas.map(c => (
                  <tr key={c.id_cita}>
                    <td style={{ ...tdStyle, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {c.hora.substring(0, 5)}
                    </td>
                    <td style={tdStyle}>{c.paciente}</td>
                    <td style={tdStyle}>{c.medico}</td>
                    <td style={{ ...tdStyle, color: "#4A6275" }}>{c.especialidad}</td>
                    <td style={tdStyle}><Badge estado={c.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnfermeraAgenda;