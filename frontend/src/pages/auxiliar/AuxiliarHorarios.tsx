import { useState, useEffect } from "react";
import type { Horario } from "../../types";
import { getHorariosService } from "../../services/admin.service";
import {
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

const DIAS_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const thStyle: React.CSSProperties = {
  padding: "11px 16px", fontSize: "11px", fontWeight: 600, color: "#8FA3B1",
  textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#F8FBFD",
  borderBottom: "1px solid #D1E3EE", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 16px", fontSize: "13px", color: "#1A2B3C",
  borderBottom: "1px solid #EEF4F8", verticalAlign: "middle",
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

const AuxiliarHorarios = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getHorariosService()
      .then(data => setHorarios(data.filter(h => h.activo)))
      .catch(() => setError("No se pudieron cargar los horarios"))
      .finally(() => setCargando(false));
  }, []);

  const renderDias = (dias: number[]) => {
    if (!dias || dias.length === 0) return "—";
    return dias.map(d => DIAS_LABELS[d]).join(", ");
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

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineClock style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Horarios en Atención
        </h4>
      </div>

      {error && <Alerta>{error}</Alerta>}

      <div style={{
        backgroundColor: "#FFFFFF", borderRadius: "12px",
        border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Doctor", "Especialidad", "Días", "Mañana", "Tarde"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horarios.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                    No hay horarios registrados
                  </td>
                </tr>
              ) : (
                horarios.map(h => (
                  <tr key={h.id_horario}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{h.medico}</td>
                    <td style={tdStyle}>{h.especialidad}</td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#4A6275" }}>{renderDias(h.dias)}</td>
                    <td style={{ ...tdStyle, fontSize: "12px" }}>
                      {h.hora_inicio_manana ? `${h.hora_inicio_manana} - ${h.hora_fin_manana}` : "—"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "12px" }}>
                      {h.hora_inicio_tarde ? `${h.hora_inicio_tarde} - ${h.hora_fin_tarde}` : "—"}
                    </td>
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

export default AuxiliarHorarios;