import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  HiOutlineChartBar,
  HiOutlineUserCircle,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineDocumentReport,
  HiOutlineDocumentText,
  HiOutlineTable,
  HiCheckCircle,
  HiXCircle,
  HiOutlineClock,
  HiOutlineRefresh,
} from "react-icons/hi";
import {
  getReporteCitasService,
  getReporteDoctoresService,
  getReporteEspecialidadesService,
  getReporteEdadesService,
} from "../../services/gerente.service";
import type {
  ReporteCitas,
  ReporteDoctor,
  ReporteEspecialidad,
  ReporteEdad,
} from "../../types";
import { exportarPDF, exportarExcel } from "../../hooks/useExportReporte";

/* ─── Paleta CS para gráficas ───────────────────────────────────── */
const COLORES = ["#0EA5C8", "#1A4B6B", "#34a853", "#F57F17", "#9c27b0", "#00bcd4"];

/* ─── Tipos internos (sin cambios) ─────────────────────────────── */
interface DoctoresReporte {
  doctores: ReporteDoctor[];
  totales: {
    total_citas: number | string;
    atendidas: number | string;
    inasistentes: number | string;
    canceladas: number | string;
    porcentaje_rendimiento: number | string;
    porcentaje_inasistencia?: number | string;
  };
}
interface EspecialidadesReporte {
  especialidades: ReporteEspecialidad[];
  total: number;
  totalDoctores: number;
}
interface EdadesReporte {
  rangos: ReporteEdad[];
  total: number;
}
type TabType = "citas" | "doctores" | "especialidades" | "edades";

/* ─── Helper numérico (sin cambios) ────────────────────────────── */
const toNumber = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

/* ─── Badge de estado de cita ───────────────────────────────────── */
const BadgeCita = ({ estado }: { estado: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    atendida:   { bg: "#E8F5E9", color: "#2E7D32" },
    cancelada:  { bg: "#FFEBEE", color: "#C62828" },
    programada: { bg: "#E0F7FC", color: "#0B85A3" },
    en_espera:  { bg: "#FFF8E1", color: "#F57F17" },
    inasistente:{ bg: "#F0F4F8", color: "#4A6275" },
  };
  const s = map[estado] ?? { bg: "#F0F4F8", color: "#4A6275" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px",
      borderRadius: "4px", fontSize: "11px", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {estado}
    </span>
  );
};

/* ─── Stat card ─────────────────────────────────────────────────── */
const StatCard = ({
  label, value, accent, icon: Icon,
}: { label: string; value: number | string; accent: string; icon: any }) => (
  <div style={{
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid var(--cs-border, #D1E3EE)",
    boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
    padding: "18px 20px",
    display: "flex", flexDirection: "column", gap: "6px",
    borderTop: `3px solid ${accent}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{
        fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.05em", color: "var(--cs-text-muted, #8FA3B1)",
      }}>
        {label}
      </span>
      <Icon size={18} color={accent} />
    </div>
    <div style={{
      fontSize: "28px", fontWeight: 700,
      color: "var(--cs-text-primary, #1A2B3C)",
      fontVariantNumeric: "tabular-nums",
    }}>
      {value}
    </div>
  </div>
);

/* ─── Filtro fechas (visual only, lógica intacta) ───────────────── */
const FiltroFechas = ({
  desde, hasta, onDesde, onHasta, onGenerar, cargando,
}: {
  desde: string; hasta: string;
  onDesde: (v: string) => void; onHasta: (v: string) => void;
  onGenerar: () => void; cargando: boolean;
}) => (
  <div style={{
    display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap",
    marginBottom: "24px",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid var(--cs-border, #D1E3EE)",
    boxShadow: "0 1px 3px rgba(15,47,69,0.06)",
  }}>
    {(["Desde", "Hasta"] as const).map((lbl) => {
      const val = lbl === "Desde" ? desde : hasta;
      const handler = lbl === "Desde" ? onDesde : onHasta;
      return (
        <div key={lbl}>
          <label style={{
            display: "block", fontSize: "12px", fontWeight: 600,
            color: "var(--cs-text-secondary, #4A6275)",
            marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            {lbl}
          </label>
          <input
            type="date"
            value={val}
            onChange={(e) => handler(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1.5px solid var(--cs-border, #D1E3EE)",
              borderRadius: "8px", fontSize: "13px",
              fontFamily: "inherit",
              color: "var(--cs-text-primary, #1A2B3C)",
              background: "#fff", outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "#0EA5C8"; e.target.style.boxShadow = "0 0 0 3px rgba(14,165,200,0.2)"; }}
            onBlur={e  => { e.target.style.borderColor = "#D1E3EE"; e.target.style.boxShadow = "none"; }}
          />
        </div>
      );
    })}
    <button
      onClick={onGenerar}
      disabled={cargando}
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "9px 20px",
        background: cargando ? "var(--cs-border, #D1E3EE)" : "var(--cs-primary, #0EA5C8)",
        color: cargando ? "var(--cs-text-muted)" : "#fff",
        border: "none", borderRadius: "8px",
        fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
        cursor: cargando ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
    >
      {cargando
        ? <><HiOutlineRefresh size={15} style={{ animation: "cs-spin 0.7s linear infinite" }} /> Generando...</>
        : <><HiOutlineChartBar size={15} /> Generar reporte</>
      }
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  </div>
);

/* ─── Estilos comunes de tabla ───────────────────────────────────── */
const TH: React.CSSProperties = {
  padding: "11px 16px", fontSize: "11px", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--cs-text-secondary, #4A6275)",
  background: "var(--cs-bg-base, #F0F4F8)",
  borderBottom: "1px solid var(--cs-border, #D1E3EE)",
  whiteSpace: "nowrap",
};
const TD: React.CSSProperties = {
  padding: "11px 16px", fontSize: "13px",
  color: "var(--cs-text-primary, #1A2B3C)",
  borderBottom: "1px solid var(--cs-border, #D1E3EE)",
  verticalAlign: "middle",
};
const TR_TOTAL: React.CSSProperties = {
  background: "var(--cs-secondary, #1A4B6B)",
  color: "#fff",
  fontWeight: 700,
};

/* ══════════════════════════════════════════════════════════════════ */
const GerenteReportes = () => {
  const hoy    = new Date().toISOString().split("T")[0];
  const inicio = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

  const [tab,      setTab]      = useState<TabType>("citas");
  const [desde,    setDesde]    = useState(inicio);
  const [hasta,    setHasta]    = useState(hoy);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState("");

  const [reporteCitas,    setReporteCitas]    = useState<ReporteCitas | null>(null);
  const [reporteDoctores, setReporteDoctores] = useState<DoctoresReporte | null>(null);
  const [reporteEsp,      setReporteEsp]      = useState<EspecialidadesReporte | null>(null);
  const [reporteEdades,   setReporteEdades]   = useState<EdadesReporte | null>(null);
  const [exportando,      setExportando]      = useState<string | null>(null);

  /* ── handleGenerar (lógica intacta) ──────────────────────────── */
  const handleGenerar = async () => {
    setError(""); setCargando(true);
    try {
      const filtros = { desde, hasta };
      if (tab === "citas") {
        setReporteCitas(await getReporteCitasService(filtros));
      } else if (tab === "doctores") {
        const data: any = await getReporteDoctoresService(filtros);
        if (data.totales) {
          const totalFinalizadas =
            Number(data.totales.atendidas) +
            Number(data.totales.inasistentes) +
            Number(data.totales.canceladas);
          data.totales.porcentaje_inasistencia = totalFinalizadas > 0
            ? (Number(data.totales.inasistentes) / totalFinalizadas) * 100 : 0;
        }
        setReporteDoctores(data);
      } else if (tab === "especialidades") {
        const data: any = await getReporteEspecialidadesService(filtros);
        const totalDoctores = data.especialidades.reduce(
          (sum: number, esp: any) => sum + Number(esp.doctores_activos || 0), 0
        );
        setReporteEsp({ ...data, totalDoctores });
      } else if (tab === "edades") {
        setReporteEdades(await getReporteEdadesService(filtros));
      }
    } catch (err) {
      console.error("ERROR:", err);
      setError("Error al generar el reporte");
    } finally {
      setCargando(false);
    }
  };

  /* ── handleExportar (lógica intacta) ─────────────────────────── */
  const handleExportar = async (formato: string) => {
    setError(""); setExportando(formato);
    try {
      const base = { desde, hasta };
      if (tab === "citas" && reporteCitas) {
        await (formato === "pdf"
          ? exportarPDF({ tipo: "citas" as any, datos: reporteCitas, ...base })
          : exportarExcel({ tipo: "citas" as any, datos: reporteCitas, ...base }));
      } else if (tab === "doctores" && reporteDoctores) {
        await (formato === "pdf"
          ? exportarPDF({ tipo: "doctores" as any, datos: reporteDoctores, ...base })
          : exportarExcel({ tipo: "doctores" as any, datos: reporteDoctores, ...base }));
      } else if (tab === "especialidades" && reporteEsp) {
        await (formato === "pdf"
          ? exportarPDF({ tipo: "especialidades" as any, datos: reporteEsp, ...base })
          : exportarExcel({ tipo: "especialidades" as any, datos: reporteEsp, ...base }));
      } else if (tab === "edades" && reporteEdades) {
        await (formato === "pdf"
          ? exportarPDF({ tipo: "edades" as any, datos: reporteEdades, ...base })
          : exportarExcel({ tipo: "edades" as any, datos: reporteEdades, ...base }));
      } else {
        setError("Primero genera el reporte antes de exportar.");
      }
    } catch (err) {
      console.error("Error exportando:", err);
      setError("Error al exportar el reporte.");
    } finally {
      setExportando(null);
    }
  };

  /* ── Tabs config ─────────────────────────────────────────────── */
  const TABS = [
    { key: "citas",          Icon: HiOutlineChartBar,       label: "Citas"          },
    { key: "doctores",       Icon: HiOutlineUserCircle,     label: "Doctores"       },
    { key: "especialidades", Icon: HiOutlineOfficeBuilding, label: "Especialidades" },
    { key: "edades",         Icon: HiOutlineUsers,          label: "Edades"         },
  ] as const;

  const hayReporte = reporteCitas || reporteDoctores || reporteEsp || reporteEdades;

  return (
    <div style={{ fontFamily: "var(--font-main, Inter, sans-serif)" }}>

      {/* ── Título ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <HiOutlineDocumentReport size={22} color="var(--cs-primary, #0EA5C8)" />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "var(--cs-text-primary, #1A2B3C)", margin: 0 }}>
          Reportes
        </h4>
      </div>

      {/* ── Alerta ────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "10px",
          padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
          background: "var(--cs-danger-bg, #FFEBEE)",
          color: "var(--cs-danger-text, #C62828)",
          borderLeft: "4px solid var(--cs-danger-text, #C62828)",
          fontSize: "14px",
        }}>
          <HiXCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
          {error}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: "4px", flexWrap: "wrap",
        borderBottom: "2px solid var(--cs-border, #D1E3EE)",
        marginBottom: "24px",
      }}>
        {TABS.map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "10px 18px", background: "transparent", border: "none",
              borderBottom: tab === key ? "2px solid var(--cs-primary, #0EA5C8)" : "2px solid transparent",
              marginBottom: "-2px", cursor: "pointer", fontSize: "14px",
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? "var(--cs-primary, #0EA5C8)" : "var(--cs-text-secondary, #4A6275)",
              transition: "color 0.15s", whiteSpace: "nowrap",
            }}
          >
            <Icon size={16} color={tab === key ? "var(--cs-primary, #0EA5C8)" : "#8FA3B1"} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filtro fechas ─────────────────────────────────────── */}
      <FiltroFechas
        desde={desde} hasta={hasta}
        onDesde={setDesde} onHasta={setHasta}
        onGenerar={handleGenerar} cargando={cargando}
      />

      {/* ── Botones exportar ──────────────────────────────────── */}
      {hayReporte && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
          padding: "14px 18px", borderRadius: "10px", marginBottom: "24px",
          background: "var(--cs-primary-light, #E0F7FC)",
          border: "1px solid var(--cs-border, #D1E3EE)",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--cs-text-secondary, #4A6275)" }}>
            Exportar:
          </span>
          <button
            onClick={() => handleExportar("pdf")}
            disabled={exportando !== null}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "8px", border: "none",
              background: "#C62828", color: "#fff",
              fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
              cursor: exportando !== null ? "not-allowed" : "pointer",
              opacity: exportando !== null ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <HiOutlineDocumentText size={14} />
            {exportando === "pdf" ? "Generando..." : "PDF"}
          </button>
          <button
            onClick={() => handleExportar("excel")}
            disabled={exportando !== null}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "8px", border: "none",
              background: "#1d6f42", color: "#fff",
              fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
              cursor: exportando !== null ? "not-allowed" : "pointer",
              opacity: exportando !== null ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <HiOutlineTable size={14} />
            {exportando === "excel" ? "Generando..." : "Excel / XLSX"}
          </button>
        </div>
      )}

      {/* ══ REPORTE CITAS ════════════════════════════════════════ */}
      {tab === "citas" && reporteCitas && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <StatCard label="Total"       value={toNumber(reporteCitas.totales.total)}       accent="#0EA5C8" icon={HiOutlineCalendar}  />
            <StatCard label="Atendidas"   value={toNumber(reporteCitas.totales.atendidas)}   accent="#2E7D32" icon={HiCheckCircle}       />
            <StatCard label="Canceladas"  value={toNumber(reporteCitas.totales.canceladas)}  accent="#C62828" icon={HiXCircle}           />
            <StatCard label="Inasistentes"value={toNumber(reporteCitas.totales.inasistentes)}accent="#4A6275" icon={HiOutlineUsers}      />
            <StatCard label="Programadas" value={toNumber(reporteCitas.totales.programadas)} accent="#0B85A3" icon={HiOutlineDocumentReport}/>
            <StatCard label="En espera"   value={toNumber(reporteCitas.totales.en_espera)}   accent="#F57F17" icon={HiOutlineClock}      />
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: "var(--cs-bg-base, #F0F4F8)", borderBottom: "1px solid var(--cs-border, #D1E3EE)", fontSize: "13px", fontWeight: 600, color: "var(--cs-text-primary, #1A2B3C)" }}>
              Detalle de citas ({reporteCitas.detalle.length})
            </div>
            <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    {["Fecha","Hora","Paciente","Doctor","Especialidad","Estado"].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporteCitas.detalle.map((c: any) => (
                    <tr key={c.id_cita}>
                      <td style={TD}>{new Date(c.fecha).toLocaleDateString("es-BO", { timeZone: "UTC" })}</td>
                      <td style={{ ...TD, fontVariantNumeric: "tabular-nums" }}>{c.hora.substring(0, 5)}</td>
                      <td style={{ ...TD, fontWeight: 500 }}>{c.paciente}</td>
                      <td style={TD}>{c.medico}</td>
                      <td style={{ ...TD, fontSize: "12px", color: "var(--cs-text-secondary)" }}>{c.especialidad}</td>
                      <td style={TD}><BadgeCita estado={c.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTE DOCTORES ════════════════════════════════════ */}
      {tab === "doctores" && reporteDoctores && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <StatCard label="Doctores"     value={reporteDoctores.doctores.length}                       accent="#0EA5C8" icon={HiOutlineUserCircle}    />
            <StatCard label="Total citas"  value={toNumber(reporteDoctores.totales.total_citas)}         accent="#0B85A3" icon={HiOutlineCalendar}       />
            <StatCard label="Atendidas"    value={toNumber(reporteDoctores.totales.atendidas)}           accent="#2E7D32" icon={HiCheckCircle}           />
            <StatCard label="Inasistentes" value={toNumber(reporteDoctores.totales.inasistentes)}        accent="#C62828" icon={HiOutlineUsers}          />
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Doctor","Total citas","Atendidas","Inasistentes","% Rendimiento","% Inasistencia"].map(h => (
                      <th key={h} style={{ ...TH, textAlign: h === "Doctor" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporteDoctores.doctores.map((d: any) => (
                    <tr key={d.id_personal}>
                      <td style={{ ...TD, fontWeight: 500 }}>{d.nombre}</td>
                      <td style={{ ...TD, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{toNumber(d.total_citas)}</td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: "#E8F5E9", color: "#2E7D32" }}>{toNumber(d.atendidas)}</span>
                      </td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: "#F0F4F8", color: "#4A6275" }}>{toNumber(d.inasistentes)}</span>
                      </td>
                      <td style={{ ...TD, textAlign: "center", fontWeight: 700, color: "#2E7D32", fontVariantNumeric: "tabular-nums" }}>
                        {Number(d.porcentaje_rendimiento || 0).toFixed(2)}%
                      </td>
                      <td style={{ ...TD, textAlign: "center", fontWeight: 700, color: "#C62828", fontVariantNumeric: "tabular-nums" }}>
                        {Number(d.porcentaje_inasistencia || 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  <tr style={TR_TOTAL}>
                    <td style={{ ...TD, color: "#fff", fontWeight: 700 }}>TOTALES</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{toNumber(reporteDoctores.totales.total_citas)}</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>{toNumber(reporteDoctores.totales.atendidas)}</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>{toNumber(reporteDoctores.totales.inasistentes)}</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Number(reporteDoctores.totales.porcentaje_rendimiento || 0).toFixed(2)}%</td>
                    <td style={{ ...TD, color: "#fca5a5", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Number(reporteDoctores.totales.porcentaje_inasistencia || 0).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTE ESPECIALIDADES ══════════════════════════════ */}
      {tab === "especialidades" && reporteEsp && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Especialidad","Citas","%","Doctores"].map((h, i) => (
                      <th key={h} style={{ ...TH, textAlign: i === 0 ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporteEsp.especialidades.map((e: any, i: number) => (
                    <tr key={i}>
                      <td style={{ ...TD, fontWeight: 500 }}>{e.especialidad}</td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: COLORES[i % COLORES.length] + "22", color: COLORES[i % COLORES.length] }}>
                          {toNumber(e.cantidad)}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: "center", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Number(e.porcentaje || 0).toFixed(2)}%</td>
                      <td style={{ ...TD, textAlign: "center" }}>{toNumber(e.doctores_activos)}</td>
                    </tr>
                  ))}
                  <tr style={TR_TOTAL}>
                    <td style={{ ...TD, color: "#fff", fontWeight: 700 }}>TOTAL</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>{reporteEsp.total}</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>100%</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>{reporteEsp.totalDoctores}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: "var(--cs-bg-base, #F0F4F8)", borderBottom: "1px solid var(--cs-border, #D1E3EE)", fontSize: "13px", fontWeight: 600, color: "var(--cs-text-primary, #1A2B3C)" }}>
              Distribución por especialidad
            </div>
            <div style={{ padding: "16px" }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={reporteEsp.especialidades.filter((e: any) => toNumber(e.cantidad) > 0).map((e: any) => ({ name: e.especialidad, value: toNumber(e.cantidad) }))}
                    cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ percent }: any) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {reporteEsp.especialidades.filter((e: any) => toNumber(e.cantidad) > 0).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #D1E3EE", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ══ REPORTE EDADES ══════════════════════════════════════ */}
      {tab === "edades" && reporteEdades && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Rango de edad","Categoría","Cantidad","%"].map((h, i) => (
                      <th key={h} style={{ ...TH, textAlign: i < 2 ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporteEdades.rangos.map((r: any, i: number) => (
                    <tr key={i}>
                      <td style={{ ...TD, fontWeight: 500 }}>{r.rango}</td>
                      <td style={{ ...TD, color: "var(--cs-text-secondary)" }}>{r.categoria}</td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: COLORES[i % COLORES.length] + "22", color: COLORES[i % COLORES.length] }}>
                          {r.cantidad}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: "center", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Number(r.porcentaje).toFixed(2)}%</td>
                    </tr>
                  ))}
                  <tr style={TR_TOTAL}>
                    <td colSpan={2} style={{ ...TD, color: "#fff", fontWeight: 700 }}>TOTAL</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>{reporteEdades.total}</td>
                    <td style={{ ...TD, color: "#fff", textAlign: "center" }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--cs-border, #D1E3EE)", boxShadow: "0 1px 3px rgba(15,47,69,0.08)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: "var(--cs-bg-base, #F0F4F8)", borderBottom: "1px solid var(--cs-border, #D1E3EE)", fontSize: "13px", fontWeight: 600, color: "var(--cs-text-primary, #1A2B3C)" }}>
              Distribución por rango de edad
            </div>
            <div style={{ padding: "16px" }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={reporteEdades.rangos.map((r: any) => ({ name: r.rango, value: toNumber(r.cantidad) }))}
                    cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ percent }: any) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {reporteEdades.rangos.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #D1E3EE", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!hayReporte && !cargando && (
        <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--cs-text-muted, #8FA3B1)" }}>
          <HiOutlineChartBar size={52} style={{ marginBottom: "12px", color: "var(--cs-border, #D1E3EE)" }} />
          <p style={{ fontSize: "14px", color: "var(--cs-text-secondary, #4A6275)" }}>
            Selecciona el rango de fechas y haz clic en "Generar reporte"
          </p>
        </div>
      )}
    </div>
  );
};

export default GerenteReportes;