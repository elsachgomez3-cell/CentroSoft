import { useState, useEffect } from "react";
import {
  getAgendaHoyService,
  getResumenMensualService,
  getMisEspecialidadesService,
  getHorariosMedicoService,
} from "../../services/medico.service";
import type {
  CitaMedico,
  Especialidad,
  HorarioMedico,
} from "../../services/medico.service";
import {
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineBan,
  HiOutlineCursorClick,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";

// ─── Constantes ───────────────────────────────────────────────
const DIAS_SEMANA_HEADER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_SEMANA_NOMBRE = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const BADGE_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  programada:  { bg: "#E0F7FC", color: "#0B85A3", label: "Programada"  },
  en_espera:   { bg: "#FFF8E1", color: "#F57F17", label: "En espera"   },
  atendida:    { bg: "#E8F5E9", color: "#2E7D32", label: "Atendida"    },
  cancelada:   { bg: "#FFEBEE", color: "#C62828", label: "Cancelada"   },
  inasistente: { bg: "#F0F4F8", color: "#4A6275", label: "Inasistente" },
};

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-BO", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    timeZone: "UTC",
  });

const horaCorta = (h: string) => String(h).substring(0, 5);

type ResumenDia = { fecha: string; total: string; atendidas: string };

// ─── Estilos de tabla ─────────────────────────────────────────
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

// ─── Componentes base ─────────────────────────────────────────

const Badge = ({ estado }: { estado: string }) => {
  const b = BADGE_ESTADO[estado] ?? { bg: "#F0F4F8", color: "#4A6275", label: estado };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 10px",
      borderRadius: "20px", whiteSpace: "nowrap",
      textTransform: "capitalize",
      backgroundColor: b.bg, color: b.color,
    }}>
      {b.label}
    </span>
  );
};

const BtnFiltro = ({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "6px 14px",
      backgroundColor: active ? "#0EA5C8" : "transparent",
      color: active ? "#FFFFFF" : "#4A6275",
      border: `1.5px solid ${active ? "#0EA5C8" : "#D1E3EE"}`,
      borderRadius: "8px", fontSize: "12px", fontWeight: 600,
      cursor: "pointer", fontFamily: "'Inter', sans-serif",
      transition: "all 0.15s",
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "#0EA5C8"; e.currentTarget.style.color = "#0EA5C8"; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "#D1E3EE"; e.currentTarget.style.color = "#4A6275"; } }}
  >
    {children}
  </button>
);

const CsInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        padding: "9px 13px",
        border: `1.5px solid ${focused ? "#0EA5C8" : "#D1E3EE"}`,
        borderRadius: "8px", fontSize: "13px",
        fontFamily: "'Inter', sans-serif", color: "#1A2B3C",
        backgroundColor: "#FFFFFF", outline: "none",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...(props.style as React.CSSProperties),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const Spinner = () => (
  <>
    <div style={{
      width: "36px", height: "36px",
      border: "3px solid #D1E3EE", borderTopColor: "#0EA5C8",
      borderRadius: "50%", animation: "cs-spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ─── Componente principal ─────────────────────────────────────
const MedicoAgenda = () => {
  const hoy = new Date();
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const [tab, setTab] = useState<"dia" | "calendario">("dia");

  const [especialidades,  setEspecialidades]  = useState<Especialidad[]>([]);
  const [espSeleccionada, setEspSeleccionada] = useState<number | undefined>(undefined);

  const [fechaSel, setFechaSel] = useState(hoyISO);
  const [citas,    setCitas]    = useState<CitaMedico[]>([]);
  const [cargando, setCargando] = useState(true);

  const [horarios, setHorarios] = useState<HorarioMedico[]>([]);

  const [mes,          setMes]          = useState(hoy.getMonth() + 1);
  const [anio,         setAnio]         = useState(hoy.getFullYear());
  const [diasTrabaja,  setDiasTrabaja]  = useState<number[]>([]);
  const [citasMes,     setCitasMes]     = useState<ResumenDia[]>([]);
  const [cargandoCal,  setCargandoCal]  = useState(false);
  const [diaDetalle,   setDiaDetalle]   = useState<string | null>(null);
  const [citasDetalle, setCitasDetalle] = useState<CitaMedico[]>([]);

  useEffect(() => {
    getMisEspecialidadesService()
      .then((data) => {
        setEspecialidades(data);
        if (data.length === 1) setEspSeleccionada(data[0].id_especialidad);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { cargarAgenda(fechaSel, espSeleccionada); }, [fechaSel, espSeleccionada]);

  useEffect(() => {
    getHorariosMedicoService(espSeleccionada)
      .then(setHorarios)
      .catch(() => setHorarios([]));
  }, [espSeleccionada]);

  useEffect(() => {
    if (tab === "calendario") cargarCalendario();
  }, [tab, mes, anio, espSeleccionada]);

  const cargarAgenda = async (fecha: string, idEsp?: number) => {
    setCargando(true);
    try {
      const data = await getAgendaHoyService(fecha, idEsp);
      setCitas(data);
    } catch { console.error("Error al cargar agenda"); }
    finally { setCargando(false); }
  };

  const cargarCalendario = async () => {
    setCargandoCal(true);
    try {
      const data = await getResumenMensualService(mes, anio, espSeleccionada);
      setDiasTrabaja(data.diasTrabaja);
      setCitasMes(data.citas);
    } catch { console.error("Error al cargar calendario"); }
    finally { setCargandoCal(false); }
  };

  const handleDiaClick = async (fechaDia: string, trabaja: boolean) => {
    if (!trabaja) return;
    setDiaDetalle(fechaDia);
    try {
      const data = await getAgendaHoyService(fechaDia, espSeleccionada);
      setCitasDetalle(data);
    } catch { console.error("Error al cargar detalle del día"); }
  };

  const handleCambiarEsp = (id: number | undefined) => {
    setEspSeleccionada(id);
    setDiaDetalle(null);
    setCitasDetalle([]);
  };

  const offsetPrimerDia = () => {
    const jsDay = new Date(anio, mes - 1, 1).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };
  const totalDiasMes = () => new Date(anio, mes, 0).getDate();
  const jsDayToFormato = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

  type ColorInfo = { bg: string; border: string; color: string; label: string; count?: number };

  const colorDia = (dia: number): ColorInfo => {
    const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const jsDay = new Date(fecha + "T12:00:00").getDay();
    const diaFormato = jsDayToFormato(jsDay);
    const trabaja = diasTrabaja.includes(diaFormato);

    if (!trabaja)
      return { bg: "#F0F4F8", border: "transparent", color: "#C4D4DF", label: "No trabaja" };

    const citasDia = citasMes.find((c) => c.fecha === fecha);
    if (!citasDia)
      return { bg: "#E8F5E9", border: "#A5D6A7", color: "#2E7D32", label: "Disponible" };

    const total     = parseInt(citasDia.total);
    const atendidas = parseInt(citasDia.atendidas);
    if (atendidas >= total)
      return { bg: "#E0F7FC", border: "#80DEEA", color: "#0B85A3", label: "Completo" };

    return {
      bg: "#E3F2FD", border: "#90CAF9", color: "#1565C0",
      label: `${total} citas`, count: total,
    };
  };

  const generarSlots = (inicio: string, fin: string, durMin: number): string[] => {
    const slots: string[] = [];
    const [hI, mI] = inicio.substring(0, 5).split(":").map(Number);
    const [hF, mF] = fin.substring(0, 5).split(":").map(Number);
    let t = hI * 60 + mI;
    const tFin = hF * 60 + mF;
    while (t < tFin) {
      slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
      t += durMin;
    }
    return slots;
  };

  const citasPorSlot = (slot: string) => citas.filter((c) => horaCorta(c.hora) === slot);

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        .cs-tr:hover td { background-color: #F8FBFD !important; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Mi Agenda
        </h4>
      </div>

      {/* ── FILTRO DE ESPECIALIDAD ─────────────────────────────── */}
      {especialidades.length > 1 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
          padding: "12px 16px",
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid #D1E3EE",
          boxShadow: "0 1px 3px rgba(15,47,69,0.06)",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#4A6275" }}>
            Especialidad:
          </span>
          <BtnFiltro active={espSeleccionada === undefined} onClick={() => handleCambiarEsp(undefined)}>
            Todas
          </BtnFiltro>
          {especialidades.map((e) => (
            <BtnFiltro
              key={e.id_especialidad}
              active={espSeleccionada === e.id_especialidad}
              onClick={() => handleCambiarEsp(e.id_especialidad)}
            >
              {e.nombre}
            </BtnFiltro>
          ))}
        </div>
      )}

      {/* ── TABS ──────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: "4px",
        borderBottom: "2px solid #D1E3EE",
      }}>
        {([
          { key: "dia",        label: "Citas del día", Icon: HiOutlineClipboardList },
          { key: "calendario", label: "Calendario",    Icon: HiOutlineCalendar      },
        ] as const).map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "10px 18px",
                backgroundColor: active ? "#FFFFFF" : "transparent",
                color: active ? "#0EA5C8" : "#4A6275",
                border: "none",
                borderBottom: active ? "2px solid #0EA5C8" : "2px solid transparent",
                borderRadius: "8px 8px 0 0",
                fontSize: "13px", fontWeight: active ? 600 : 500,
                cursor: "pointer", marginBottom: "-2px",
                fontFamily: "'Inter', sans-serif",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#1A2B3C"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#4A6275"; }}
            >
              <Icon style={{ fontSize: "15px" }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════
          TAB: CITAS DEL DÍA
      ════════════════════════════════════════════════════ */}
      {tab === "dia" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Selector de fecha */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#4A6275" }}>Fecha:</span>
            <CsInput
              type="date"
              style={{ maxWidth: "200px" }}
              value={fechaSel}
              onChange={(e) => setFechaSel(e.target.value)}
            />
            <span style={{
              fontSize: "13px", color: "#4A6275",
              textTransform: "capitalize", fontWeight: 500,
            }}>
              {formatFecha(fechaSel + "T12:00:00")}
            </span>
          </div>

          {cargando ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spinner />
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "20px",
              alignItems: "start",
            }}>
              {/* ── Lista de citas ─────────────────────────────── */}
              <div style={{
                backgroundColor: "#FFFFFF", borderRadius: "12px",
                border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "13px 20px", borderBottom: "1px solid #EEF4F8",
                  backgroundColor: "#F8FBFD",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A6275" }}>
                    {citas.length === 0
                      ? "Sin citas para este día"
                      : `${citas.length} cita${citas.length !== 1 ? "s" : ""} programada${citas.length !== 1 ? "s" : ""}`
                    }
                  </span>
                </div>

                {citas.length === 0 ? (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "48px 24px", gap: "12px",
                  }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "50%",
                      backgroundColor: "#F0F4F8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <HiOutlineCalendar style={{ fontSize: "24px", color: "#8FA3B1" }} />
                    </div>
                    <p style={{ fontSize: "14px", color: "#8FA3B1", margin: 0 }}>
                      No hay citas para este día
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Hora", "Paciente", "Edad", "CI", "Motivo", "Estado"].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {citas.map((c) => (
                          <tr key={c.id_cita} className="cs-tr">
                            <td style={{ ...tdStyle, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                              {horaCorta(c.hora)}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{c.paciente}</td>
                            <td style={{ ...tdStyle, color: "#4A6275" }}>
                              {c.paciente_edad ? `${c.paciente_edad} a` : "—"}
                            </td>
                            <td style={{ ...tdStyle, color: "#4A6275", fontSize: "12px" }}>
                              {c.paciente_ci || "—"}
                            </td>
                            <td style={{ ...tdStyle, fontSize: "12px", color: "#4A6275" }}>
                              {c.motivo || "—"}
                            </td>
                            <td style={tdStyle}>
                              <Badge estado={c.estado} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Horarios del día (turnos) ───────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {horarios.length === 0 ? (
                  <div style={{
                    backgroundColor: "#FFFFFF", borderRadius: "12px",
                    border: "1px solid #D1E3EE", padding: "32px 24px",
                    textAlign: "center", fontSize: "13px", color: "#8FA3B1",
                  }}>
                    No hay horarios configurados
                  </div>
                ) : (() => {
                  const jsDaySel = new Date(fechaSel + "T12:00:00").getDay();
                  const diaFormatoSel = jsDaySel === 0 ? 6 : jsDaySel - 1;
                  const horariosDelDia = horarios.filter((h) => h.dias.includes(diaFormatoSel));

                  if (horariosDelDia.length === 0) {
                    return (
                      <div style={{
                        backgroundColor: "#FFFFFF", borderRadius: "12px",
                        border: "1px solid #D1E3EE", overflow: "hidden",
                      }}>
                        <div style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          padding: "40px 24px", gap: "10px",
                        }}>
                          <div style={{
                            width: "48px", height: "48px", borderRadius: "50%",
                            backgroundColor: "#FFEBEE",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <HiOutlineBan style={{ fontSize: "22px", color: "#C62828" }} />
                          </div>
                          <p style={{ fontSize: "13px", color: "#8FA3B1", margin: 0 }}>
                            No trabaja los {DIAS_SEMANA_NOMBRE[diaFormatoSel]}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return horariosDelDia.map((h) => {
                    const slotsMañana = h.hora_inicio_manana && h.hora_fin_manana
                      ? generarSlots(h.hora_inicio_manana, h.hora_fin_manana, h.duracion_cita_min)
                      : [];
                    const slotsTarde = h.hora_inicio_tarde && h.hora_fin_tarde
                      ? generarSlots(h.hora_inicio_tarde, h.hora_fin_tarde, h.duracion_cita_min)
                      : [];

                    const renderSlot = (slot: string) => {
                      const citasSlot = citasPorSlot(slot);
                      const ocupado   = citasSlot.length > 0;
                      const cita      = citasSlot[0];
                      const b = cita ? (BADGE_ESTADO[cita.estado] ?? { bg: "#F0F4F8", color: "#4A6275", label: cita.estado }) : null;
                      return (
                        <div
                          key={slot}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "8px 12px", borderRadius: "8px",
                            backgroundColor: ocupado ? "#FFF8E1" : "#E8F5E9",
                            border: `1px solid ${ocupado ? "#FFE082" : "#A5D6A7"}`,
                            fontSize: "13px",
                          }}
                        >
                          <span style={{
                            fontWeight: 700, minWidth: "44px",
                            color: "#1A2B3C", fontVariantNumeric: "tabular-nums",
                          }}>
                            {slot}
                          </span>
                          {ocupado ? (
                            <>
                              <HiOutlineUser style={{ fontSize: "14px", color: "#4A6275", flexShrink: 0 }} />
                              <span style={{
                                flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                                whiteSpace: "nowrap", color: "#1A2B3C", fontWeight: 500,
                              }}>
                                {cita.paciente}
                              </span>
                              {b && (
                                <span style={{
                                  fontSize: "10px", fontWeight: 600, padding: "2px 8px",
                                  borderRadius: "20px", whiteSpace: "nowrap",
                                  backgroundColor: b.bg, color: b.color,
                                }}>
                                  {b.label}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#2E7D32", fontWeight: 500 }}>
                              Disponible
                            </span>
                          )}
                        </div>
                      );
                    };

                    return (
                      <div key={h.id_horario} style={{
                        backgroundColor: "#FFFFFF", borderRadius: "12px",
                        border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
                        overflow: "hidden",
                      }}>
                        {/* Header del horario */}
                        <div style={{
                          padding: "12px 16px",
                          background: "linear-gradient(135deg, #0F2F45 0%, #1A4B6B 100%)",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
                            {h.especialidad}
                          </span>
                          <span style={{
                            fontSize: "11px", color: "#00D4FF", fontWeight: 500,
                            marginLeft: "auto",
                          }}>
                            {h.duracion_cita_min} min/cita
                          </span>
                        </div>

                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                          {slotsMañana.length > 0 && (
                            <div>
                              <div style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                marginBottom: "8px",
                              }}>
                                <HiOutlineSun style={{ fontSize: "14px", color: "#F57F17" }} />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#4A6275" }}>
                                  Turno Mañana
                                </span>
                                <span style={{ fontSize: "11px", color: "#8FA3B1", fontVariantNumeric: "tabular-nums" }}>
                                  {horaCorta(h.hora_inicio_manana!)} – {horaCorta(h.hora_fin_manana!)}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {slotsMañana.map(renderSlot)}
                              </div>
                            </div>
                          )}

                          {slotsTarde.length > 0 && (
                            <div>
                              <div style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                marginBottom: "8px",
                              }}>
                                <HiOutlineMoon style={{ fontSize: "14px", color: "#4527A0" }} />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#4A6275" }}>
                                  Turno Tarde
                                </span>
                                <span style={{ fontSize: "11px", color: "#8FA3B1", fontVariantNumeric: "tabular-nums" }}>
                                  {horaCorta(h.hora_inicio_tarde!)} – {horaCorta(h.hora_fin_tarde!)}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {slotsTarde.map(renderSlot)}
                              </div>
                            </div>
                          )}

                          {slotsMañana.length === 0 && slotsTarde.length === 0 && (
                            <p style={{ fontSize: "13px", color: "#8FA3B1", textAlign: "center", margin: 0, padding: "8px 0" }}>
                              Sin turnos configurados
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: CALENDARIO
      ════════════════════════════════════════════════════ */}
      {tab === "calendario" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}>

          {/* ── Calendario CSS Grid ────────────────────────────── */}
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
            overflow: "hidden",
          }}>
            {/* Header navegación mes */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderBottom: "1px solid #EEF4F8",
              background: "linear-gradient(135deg, #0F2F45 0%, #1A4B6B 100%)",
            }}>
              <button
                onClick={() => { if (mes === 1) { setMes(12); setAnio(anio - 1); } else setMes(mes - 1); }}
                style={{
                  background: "none", border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: "8px", padding: "5px 8px", cursor: "pointer",
                  color: "#FFFFFF", display: "flex", alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <HiOutlineChevronLeft style={{ fontSize: "16px" }} />
              </button>

              <span style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>
                {MESES[mes - 1]} {anio}
              </span>

              <button
                onClick={() => { if (mes === 12) { setMes(1); setAnio(anio + 1); } else setMes(mes + 1); }}
                style={{
                  background: "none", border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: "8px", padding: "5px 8px", cursor: "pointer",
                  color: "#FFFFFF", display: "flex", alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <HiOutlineChevronRight style={{ fontSize: "16px" }} />
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              {cargandoCal ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                  <Spinner />
                </div>
              ) : (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "4px",
                  }}>
                    {/* Encabezados de días */}
                    {DIAS_SEMANA_HEADER.map((d) => (
                      <div key={d} style={{
                        textAlign: "center", padding: "6px 0",
                        fontSize: "11px", fontWeight: 600,
                        color: "#8FA3B1", textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}>
                        {d}
                      </div>
                    ))}

                    {/* Celdas vacías */}
                    {Array.from({ length: offsetPrimerDia() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {/* Días */}
                    {Array.from({ length: totalDiasMes() }, (_, i) => i + 1).map((dia) => {
                      const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
                      const jsDay = new Date(fecha + "T12:00:00").getDay();
                      const diaFormato = jsDayToFormato(jsDay);
                      const trabaja = diasTrabaja.includes(diaFormato);
                      const c = colorDia(dia);
                      const esHoy = fecha === hoyISO;
                      const esSeleccionado = fecha === diaDetalle;

                      return (
                        <div
                          key={dia}
                          onClick={() => handleDiaClick(fecha, trabaja)}
                          title={c.label}
                          style={{
                            backgroundColor: c.bg,
                            border: esSeleccionado
                              ? "2px solid #0EA5C8"
                              : esHoy
                              ? "2px solid #1A4B6B"
                              : `1px solid ${c.border}`,
                            borderRadius: "8px",
                            padding: "6px 4px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: esHoy ? 700 : 400,
                            color: c.color,
                            cursor: trabaja ? "pointer" : "default",
                            minHeight: "52px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            transition: "opacity 0.15s, transform 0.1s",
                            opacity: trabaja ? 1 : 0.45,
                          }}
                          onMouseEnter={e => { if (trabaja) e.currentTarget.style.transform = "scale(1.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{dia}</span>
                          {c.count !== undefined && (
                            <span style={{
                              fontSize: "10px", fontWeight: 700,
                              backgroundColor: "#0EA5C8", color: "#FFFFFF",
                              borderRadius: "10px", padding: "0 6px",
                              lineHeight: "16px",
                            }}>
                              {c.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div style={{
                    display: "flex", gap: "14px", marginTop: "14px",
                    flexWrap: "wrap", paddingTop: "12px",
                    borderTop: "1px solid #EEF4F8",
                  }}>
                    {[
                      { bg: "#E8F5E9", border: "#A5D6A7", label: "Disponible" },
                      { bg: "#E3F2FD", border: "#90CAF9", label: "Con citas"  },
                      { bg: "#E0F7FC", border: "#80DEEA", label: "Completo"   },
                      { bg: "#F0F4F8", border: "transparent", label: "No trabaja" },
                    ].map((l) => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "12px", height: "12px",
                          backgroundColor: l.bg,
                          border: `1px solid ${l.border}`,
                          borderRadius: "3px", flexShrink: 0,
                        }} />
                        <span style={{ fontSize: "11px", color: "#8FA3B1" }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Panel de detalle del día ────────────────────────── */}
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, #0F2F45 0%, #1A4B6B 100%)",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
                {diaDetalle
                  ? new Date(diaDetalle + "T12:00:00").toLocaleDateString("es-BO", {
                      weekday: "long", day: "2-digit", month: "long",
                    })
                  : "Detalle del día"
                }
              </span>
            </div>

            <div style={{ padding: "16px", maxHeight: "420px", overflowY: "auto" }}>
              {!diaDetalle ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "36px 16px", gap: "10px",
                }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    backgroundColor: "#F0F4F8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <HiOutlineCursorClick style={{ fontSize: "22px", color: "#8FA3B1" }} />
                  </div>
                  <p style={{ fontSize: "13px", color: "#8FA3B1", textAlign: "center", margin: 0 }}>
                    Haz clic en un día con citas para ver el detalle
                  </p>
                </div>
              ) : citasDetalle.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#8FA3B1", textAlign: "center", padding: "24px 0", margin: 0 }}>
                  No hay citas para este día
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {citasDetalle.map((c) => (
                    <div key={c.id_cita} style={{
                      padding: "12px 14px", borderRadius: "10px",
                      backgroundColor: "#F8FBFD",
                      border: "1px solid #EEF4F8",
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: "4px",
                      }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A2B3C", fontVariantNumeric: "tabular-nums" }}>
                          {horaCorta(c.hora)}
                        </span>
                        <Badge estado={c.estado} />
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A2B3C", marginBottom: "2px" }}>
                        {c.paciente}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8FA3B1", marginBottom: "2px" }}>
                        {c.especialidad}
                      </div>
                      <div style={{ fontSize: "12px", color: "#4A6275" }}>
                        {c.motivo || "Sin motivo"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MedicoAgenda;