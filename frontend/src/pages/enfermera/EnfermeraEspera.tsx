import { useState, useEffect } from "react";
import {
  getCitasHoyService,
  type CitaHoyEnfermera,
} from "../../services/enfermera.service";
import {
  HiOutlineClipboardList,
  HiOutlineX,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineAnnotation,
  HiOutlineUserCircle,
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

const BtnVer = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: "none", border: "1.5px solid #0EA5C8", borderRadius: "7px",
      padding: "5px 12px", cursor: "pointer", color: "#0EA5C8",
      fontSize: "12px", fontWeight: 600, fontFamily: "'Inter', sans-serif",
      display: "inline-flex", alignItems: "center", gap: "5px",
    }}
  >
    <HiOutlineUserCircle style={{ fontSize: "14px" }} /> Ver
  </button>
);

const DatoFila = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid #EEF4F8" }}>
    <span style={{ fontSize: "16px", color: "#0EA5C8", marginTop: "1px" }}>{icon}</span>
    <div>
      <div style={{ fontSize: "11px", color: "#8FA3B1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#1A2B3C", fontWeight: 500, marginTop: "2px" }}>{value || "—"}</div>
    </div>
  </div>
);

const EnfermeraEspera = () => {
  const [citas, setCitas] = useState<CitaHoyEnfermera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [citaSel, setCitaSel] = useState<CitaHoyEnfermera | null>(null);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = async () => {
    try {
      const data = await getCitasHoyService();
      setCitas(data.filter(c => c.estado === "en_espera"));
      setError("");
    } catch {
      setError("No se pudo cargar la lista de espera. Verifica tu conexión.");
    } finally {
      setCargando(false);
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

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineClipboardList style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Lista de Sala de Espera
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
                {["Hora", "Paciente", "Doctor", "Estado", "Acción"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                    No hay pacientes en espera por el momento
                  </td>
                </tr>
              ) : (
                citas.map(c => (
                  <tr key={c.id_cita}>
                    <td style={{ ...tdStyle, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {c.hora.substring(0, 5)}
                    </td>
                    <td style={{ ...tdStyle, color: "#0B85A3", fontWeight: 600 }}>{c.paciente}</td>
                    <td style={tdStyle}>{c.medico}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 11px",
                        borderRadius: "20px", backgroundColor: "#FFF8E1", color: "#F57F17",
                      }}>
                        En espera
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <BtnVer onClick={() => setCitaSel(c)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {citaSel && (
        <div
          onClick={() => setCitaSel(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(15,47,69,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "420px",
              boxShadow: "0 20px 60px rgba(15,47,69,0.18)", fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #EEF4F8" }}>
              <h5 style={{ fontSize: "17px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>Ficha Rápida</h5>
              <button
                onClick={() => setCitaSel(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1", padding: "4px" }}
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
                  {citaSel.paciente.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A2B3C" }}>{citaSel.paciente}</div>
              </div>

              <DatoFila icon={<HiOutlineCalendar />} label="Edad" value={citaSel.paciente_edad ? `${citaSel.paciente_edad} años` : ""} />
              <DatoFila icon={<HiOutlinePhone />} label="Teléfono" value={citaSel.paciente_telefono || ""} />
              <DatoFila icon={<HiOutlineAnnotation />} label="Motivo" value={citaSel.motivo || "No especificado"} />
              <DatoFila icon={<HiOutlineUser />} label="Doctor" value={`${citaSel.medico} (${citaSel.especialidad})`} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid #EEF4F8" }}>
              <button
                onClick={() => setCitaSel(null)}
                style={{
                  padding: "9px 20px", backgroundColor: "#0EA5C8", color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnfermeraEspera;