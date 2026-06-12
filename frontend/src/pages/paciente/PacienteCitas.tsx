import { useState, useEffect } from "react";
import type { CitaDetalle, Horario, SlotDisponible } from "../../types";
import { getEspecialidadesService } from "../../services/admin.service";
import type { Especialidad } from "../../types";
import {
  getHorariosPorEspecialidadService,
  getDisponibilidadService,
  agendarCitaService,
  getMisCitasProgramadasService,
  reprogramarCitaService,
  cancelarCitaService,
} from "../../services/cita.service";
import {
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineBan,
  HiOutlineClock,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi";

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFecha = (fecha: string) => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
};

const BADGE_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  programada:  { bg: "#E0F7FC", color: "#0B85A3", label: "Programada"  },
  en_espera:   { bg: "#FFF8E1", color: "#F57F17", label: "En espera"   },
  atendida:    { bg: "#E8F5E9", color: "#2E7D32", label: "Atendida"    },
  cancelada:   { bg: "#FFEBEE", color: "#C62828", label: "Cancelada"   },
  inasistente: { bg: "#F0F4F8", color: "#4A6275", label: "Inasistente" },
};

// ── Estilos base de tabla ─────────────────────────────────────────────────

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

// ── Componentes base ──────────────────────────────────────────────────────

const Badge = ({ estado }: { estado: string }) => {
  const b = BADGE_ESTADO[estado] ?? { bg: "#F0F4F8", color: "#4A6275", label: estado };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 11px",
      borderRadius: "20px", whiteSpace: "nowrap",
      textTransform: "capitalize",
      backgroundColor: b.bg, color: b.color,
    }}>
      {b.label}
    </span>
  );
};

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
        backgroundColor: props.disabled ? "#F0F4F8" : "#FFFFFF",
        outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: props.disabled ? "not-allowed" : "text",
        ...(props.style as React.CSSProperties),
      }}
      onFocus={e => { if (!props.disabled) setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "9px 13px",
        border: `1.5px solid ${focused ? "#0EA5C8" : "#D1E3EE"}`,
        borderRadius: "8px", fontSize: "13px",
        fontFamily: "'Inter', sans-serif", color: "#1A2B3C",
        backgroundColor: props.disabled ? "#F0F4F8" : "#FFFFFF",
        outline: "none", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(14,165,200,0.18)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: props.disabled ? "not-allowed" : "pointer",
      }}
      onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
};

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{
    display: "block", fontSize: "12px", fontWeight: 500,
    color: "#4A6275", marginBottom: "5px",
  }}>
    {children}
  </label>
);

const Alerta = ({
  tipo, children, onRetry,
}: {
  tipo: "danger" | "success" | "warning" | "info";
  children: React.ReactNode;
  onRetry?: () => void;
}) => {
  const map = {
    danger:  { bg: "#FFEBEE", color: "#C62828", border: "#C62828", Icon: HiOutlineExclamationCircle },
    success: { bg: "#E8F5E9", color: "#2E7D32", border: "#2E7D32", Icon: HiOutlineCheckCircle      },
    warning: { bg: "#FFF8E1", color: "#F57F17", border: "#F57F17", Icon: HiOutlineExclamationCircle },
    info:    { bg: "#E0F7FC", color: "#0B85A3", border: "#0B85A3", Icon: HiOutlineInformationCircle },
  };
  const s = map[tipo];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 14px", borderRadius: "8px",
      backgroundColor: s.bg, color: s.color,
      borderLeft: `4px solid ${s.border}`,
      fontSize: "13px", marginBottom: "16px",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <s.Icon style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }} />
        <span>{children}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "none", border: `1px solid ${s.color}`,
            borderRadius: "6px", padding: "4px 10px",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
            color: s.color, whiteSpace: "nowrap",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

const BtnPrimary = ({ children, onClick, type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void;
  type?: "button" | "submit"; disabled?: boolean;
}) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
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
const BtnDanger = ({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
}) => (
  <button
    type="submit" onClick={onClick} disabled={disabled}
    style={{
      padding: "9px 20px",
      backgroundColor: disabled ? "#8FA3B1" : "#C62828",
      color: "#fff", border: "none", borderRadius: "8px",
      fontSize: "13px", fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', sans-serif",
      display: "inline-flex", alignItems: "center", gap: "6px",
      transition: "background 0.2s",
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = "#B71C1C"; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? "#8FA3B1" : "#C62828"; }}
  >
    {children}
  </button>
);

const BtnWarning = ({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
}) => (
  <button
    type="submit" onClick={onClick} disabled={disabled}
    style={{
      padding: "9px 20px",
      backgroundColor: disabled ? "#8FA3B1" : "#F57F17",
      color: "#fff", border: "none", borderRadius: "8px",
      fontSize: "13px", fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter', sans-serif",
      display: "inline-flex", alignItems: "center", gap: "6px",
      transition: "background 0.2s",
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = "#E65100"; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = disabled ? "#8FA3B1" : "#F57F17"; }}
  >
    {children}
  </button>
);

// ── Spinner ───────────────────────────────────────────────────────────────

const Spinner = ({ small }: { small?: boolean }) => (
  <>
    <div style={{
      width: small ? "16px" : "20px",
      height: small ? "16px" : "20px",
      border: `2px solid #D1E3EE`,
      borderTopColor: "#0EA5C8",
      borderRadius: "50%",
      animation: "cs-spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
    <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Componente principal ──────────────────────────────────────────────────

const PacienteCitas = () => {
  const [tab, setTab] = useState<"agendar" | "programadas" | "reprogramar" | "cancelar">("agendar");

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [citasProgramadas, setCitasProgramadas] = useState<CitaDetalle[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [espSeleccionada, setEspSeleccionada] = useState(0);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horSeleccionado, setHorSeleccionado] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cargandoSlots, setCargandoSlots] = useState(false);

  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaDetalle | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevosSlots, setNuevosSlots] = useState<SlotDisponible[]>([]);
  const [nuevaHora, setNuevaHora] = useState("");
  const [cargandoNuevos, setCargandoNuevos] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setError("");
    try {
      const esp = await getEspecialidadesService();
      setEspecialidades(esp.filter((e) => e.activa));
    } catch {
      setError("No se pudieron cargar las especialidades. Verifica tu conexión.");
    }
    try {
      const citas = await getMisCitasProgramadasService();
      setCitasProgramadas(citas);
    } catch {
      setError(
        (prev) => prev || "No se pudieron cargar tus citas. Verifica tu conexión.",
      );
    }
  };

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(""), 4000);
  };

  const handleEspecialidadChange = async (id: number) => {
    setEspSeleccionada(id);
    setHorSeleccionado(0);
    setSlots([]);
    setHoraSeleccionada("");
    if (id === 0) { setHorarios([]); return; }
    try {
      const h = await getHorariosPorEspecialidadService(id);
      setHorarios(h);
    } catch {
      setError("Error al cargar médicos disponibles");
    }
  };

  const handleFechaChange = async (fecha: string) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada("");
    setSlots([]);
    if (!fecha || !horSeleccionado) return;
    setCargandoSlots(true);
    try {
      const s = await getDisponibilidadService(horSeleccionado, fecha);
      setSlots(s);
    } catch {
      setError("Error al cargar disponibilidad");
    } finally {
      setCargandoSlots(false);
    }
  };

  const handleHorarioChange = async (id: number) => {
    setHorSeleccionado(id);
    setHoraSeleccionada("");
    setSlots([]);
    if (!fechaSeleccionada || !id) return;
    setCargandoSlots(true);
    try {
      const s = await getDisponibilidadService(id, fechaSeleccionada);
      setSlots(s);
    } catch {
      setError("Error al cargar disponibilidad");
    } finally {
      setCargandoSlots(false);
    }
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!horSeleccionado || !fechaSeleccionada || !horaSeleccionada) {
      setError("Completa todos los campos: médico, fecha y hora");
      return;
    }
    setCargando(true);
    try {
      await agendarCitaService({
        id_horario: horSeleccionado,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        motivo: motivo || undefined,
      });
      setEspSeleccionada(0);
      setHorSeleccionado(0);
      setFechaSeleccionada("");
      setSlots([]);
      setHoraSeleccionada("");
      setMotivo("");
      const citas = await getMisCitasProgramadasService();
      setCitasProgramadas(citas);
      mostrarExito("Cita agendada correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al agendar la cita");
    } finally {
      setCargando(false);
    }
  };

  const handleNuevaFechaChange = async (fecha: string) => {
    setNuevaFecha(fecha);
    setNuevaHora("");
    setNuevosSlots([]);
    if (!fecha || !citaSeleccionada) return;
    const citasRaw = await getMisCitasProgramadasService();
    const citaRaw = citasRaw.find((c) => c.id_cita === citaSeleccionada.id_cita);
    if (!citaRaw) return;
    setCargandoNuevos(true);
    try {
      const res = await getMisCitasProgramadasService();
      const c = res.find((c) => c.id_cita === citaSeleccionada.id_cita) as any;
      if (c?.id_horario) {
        const s = await getDisponibilidadService(c.id_horario, fecha);
        setNuevosSlots(s);
      }
    } catch {
      setError("Error al cargar disponibilidad");
    } finally {
      setCargandoNuevos(false);
    }
  };

  const handleReprogramar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaSeleccionada || !nuevaFecha || !nuevaHora) {
      setError("Selecciona la nueva fecha y hora");
      return;
    }
    setCargando(true);
    try {
      const citasConHorario = await fetch(
        `http://localhost:3000/citas/mis-citas-programadas`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      ).then((r) => r.json());
      const citaConHorario = citasConHorario.find(
        (c: any) => c.id_cita === citaSeleccionada.id_cita,
      );
      await reprogramarCitaService(citaSeleccionada.id_cita, {
        id_horario: citaConHorario?.id_horario || 1,
        fecha: nuevaFecha,
        hora: nuevaHora,
        motivo_cambio: "Reprogramación solicitada por paciente",
      });
      setCitaSeleccionada(null);
      setNuevaFecha("");
      setNuevosSlots([]);
      setNuevaHora("");
      const citas = await getMisCitasProgramadasService();
      setCitasProgramadas(citas);
      mostrarExito("Cita reprogramada correctamente");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al reprogramar");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaSeleccionada) return;
    if (!motivoCancelacion.trim()) {
      setError("Ingresa el motivo de la cancelación");
      return;
    }
    setCargando(true);
    try {
      await cancelarCitaService(citaSeleccionada.id_cita, motivoCancelacion);
      setCitaSeleccionada(null);
      setMotivoCancelacion("");
      const citas = await getMisCitasProgramadasService();
      setCitasProgramadas(citas);
      mostrarExito("Cita cancelada correctamente");
    } catch {
      setError("Error al cancelar la cita");
    } finally {
      setCargando(false);
    }
  };

  const _hoy = new Date();
  const hoy = `${_hoy.getFullYear()}-${String(_hoy.getMonth() + 1).padStart(2, "0")}-${String(_hoy.getDate()).padStart(2, "0")}`;

  // ── Definición de tabs ─────────────────────────────────────────────────

  const TABS = [
    { key: "agendar",     label: "Nueva cita",   Icon: HiOutlinePlus       },
    { key: "programadas", label: `Mis citas (${citasProgramadas.length})`, Icon: HiOutlineCalendar },
    { key: "reprogramar", label: "Reprogramar",  Icon: HiOutlineRefresh    },
    { key: "cancelar",    label: "Cancelar",     Icon: HiOutlineBan        },
  ] as const;

  // ── Render slots (reutilizable para agendar y reprogramar) ─────────────

  const renderSlots = (
    slotList: SlotDisponible[],
    selected: string,
    onSelect: (h: string) => void,
    accentColor: string,
    accentLight: string,
  ) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {slotList.map((s) => {
        const isSelected = selected === s.hora;
        return (
          <button
            key={s.hora}
            type="button"
            disabled={!s.disponible}
            onClick={() => s.disponible && onSelect(s.hora)}
            style={{
              width: "100px",
              padding: "10px 8px",
              borderRadius: "10px",
              border: `1.5px solid ${
                isSelected ? accentColor : s.disponible ? "#D1E3EE" : "#EEF4F8"
              }`,
              backgroundColor: isSelected
                ? accentColor
                : s.disponible
                ? "#FFFFFF"
                : "#F8FBFD",
              color: isSelected ? "#FFFFFF" : s.disponible ? "#1A2B3C" : "#C4D4DF",
              cursor: s.disponible ? "pointer" : "not-allowed",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s",
              fontFamily: "'Inter', sans-serif",
              boxShadow: isSelected ? `0 2px 8px ${accentLight}` : "none",
            }}
          >
            {isSelected ? (
              <HiOutlineCheckCircle style={{ fontSize: "16px" }} />
            ) : s.disponible ? (
              <HiOutlineClock style={{ fontSize: "16px", color: accentColor }} />
            ) : (
              <HiOutlineLockClosed style={{ fontSize: "14px" }} />
            )}
            <span style={{ fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {s.hora.substring(0, 5)}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.85 }}>
              {isSelected ? "Seleccionado" : s.disponible ? "Disponible" : "Ocupado"}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ── JSX principal ──────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes cs-spin { to { transform: rotate(360deg); } }
        .cs-tr:hover td { background-color: #F8FBFD !important; }
        .cs-tr-selected td { background-color: #E0F7FC !important; }
        .cs-tr-danger td  { background-color: #FFF5F5 !important; }
      `}</style>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Mis Citas
        </h4>
      </div>

      {/* Alertas */}
      {error && (
        <Alerta tipo="danger" onRetry={() => cargarDatosIniciales()}>
          {error}
        </Alerta>
      )}
      {exito && <Alerta tipo="success">{exito}</Alerta>}

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "4px", flexWrap: "wrap",
        borderBottom: "2px solid #D1E3EE",
        paddingBottom: "0",
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key); setError(""); }}
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
                transition: "color 0.15s, border-color 0.15s",
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

      {/* ── AGENDAR ─────────────────────────────────────────────────────── */}
      {tab === "agendar" && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #EEF4F8",
            backgroundColor: "#F8FBFD",
          }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1A2B3C" }}>
              Agendar Cita Médica
            </span>
          </div>
          <div style={{ padding: "24px" }}>
            <form onSubmit={handleAgendar}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>

                {/* Especialidad */}
                <div>
                  <Lbl>Especialidad</Lbl>
                  <CsSelect
                    value={espSeleccionada}
                    onChange={(e) => handleEspecialidadChange(parseInt(e.target.value))}
                  >
                    <option value={0}>Seleccionar especialidad</option>
                    {especialidades.map((e) => (
                      <option key={e.id_especialidad} value={e.id_especialidad}>
                        {e.nombre}
                      </option>
                    ))}
                  </CsSelect>
                </div>

                {/* Médico */}
                <div>
                  <Lbl>Médico</Lbl>
                  <CsSelect
                    value={horSeleccionado}
                    onChange={(e) => handleHorarioChange(parseInt(e.target.value))}
                    disabled={horarios.length === 0}
                  >
                    <option value={0}>Seleccionar médico</option>
                    {horarios.map((h) => (
                      <option key={h.id_horario} value={h.id_horario}>
                        {h.medico}
                      </option>
                    ))}
                  </CsSelect>
                </div>

                {/* Fecha */}
                <div>
                  <Lbl>Fecha</Lbl>
                  <CsInput
                    type="date"
                    min={hoy}
                    value={fechaSeleccionada}
                    onChange={(e) => handleFechaChange(e.target.value)}
                    disabled={!horSeleccionado}
                  />
                </div>
              </div>

              {/* Slots de horario */}
              {fechaSeleccionada && horSeleccionado && (
                <div style={{ marginTop: "20px" }}>
                  <Lbl>Horarios disponibles</Lbl>
                  {cargandoSlots ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" }}>
                      <Spinner small />
                      <span style={{ fontSize: "13px", color: "#4A6275" }}>Cargando disponibilidad...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <Alerta tipo="warning">
                      No hay horarios disponibles para esta fecha. El médico podría no trabajar ese día.
                    </Alerta>
                  ) : (
                    renderSlots(slots, horaSeleccionada, setHoraSeleccionada, "#0EA5C8", "rgba(14,165,200,0.25)")
                  )}

                  {horaSeleccionada && (
                    <div style={{
                      marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "8px 14px", borderRadius: "8px",
                      backgroundColor: "#E8F5E9", color: "#2E7D32",
                      fontSize: "13px", fontWeight: 500,
                    }}>
                      <HiOutlineCheckCircle style={{ fontSize: "16px" }} />
                      Hora seleccionada: <strong style={{ fontVariantNumeric: "tabular-nums" }}>{horaSeleccionada}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Motivo */}
              <div style={{ marginTop: "20px" }}>
                <Lbl>Motivo de consulta</Lbl>
                <CsInput
                  placeholder="Describe brevemente el motivo de tu consulta"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              <div style={{ marginTop: "20px" }}>
                <BtnPrimary type="submit" disabled={cargando || !horaSeleccionada}>
                  {cargando ? (
                    <><Spinner small /><span>Agendando...</span></>
                  ) : (
                    <><HiOutlinePlus style={{ fontSize: "15px" }} />Agendar cita</>
                  )}
                </BtnPrimary>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MIS CITAS PROGRAMADAS ───────────────────────────────────────── */}
      {tab === "programadas" && (
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
              {citasProgramadas.length} cita{citasProgramadas.length !== 1 ? "s" : ""} registrada{citasProgramadas.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Fecha", "Hora", "Doctor", "Especialidad", "Estado"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citasProgramadas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                      No tienes citas programadas
                    </td>
                  </tr>
                ) : (
                  citasProgramadas.map((c) => (
                    <tr key={c.id_cita} className="cs-tr">
                      <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{formatFecha(c.fecha)}</td>
                      <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{c.hora.substring(0, 5)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.medico}</td>
                      <td style={{ ...tdStyle, fontSize: "12px", color: "#4A6275" }}>{c.especialidad}</td>
                      <td style={tdStyle}><Badge estado={c.estado} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPROGRAMAR ─────────────────────────────────────────────────── */}
      {tab === "reprogramar" && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #EEF4F8",
            backgroundColor: "#F8FBFD",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A6275" }}>
              Paso 1 — Selecciona la cita que deseas reprogramar
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["", "Fecha", "Hora", "Doctor", "Estado"].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citasProgramadas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                      No tienes citas programadas para reprogramar
                    </td>
                  </tr>
                ) : (
                  citasProgramadas.map((c) => {
                    const sel = citaSeleccionada?.id_cita === c.id_cita;
                    return (
                      <tr
                        key={c.id_cita}
                        className={sel ? "cs-tr-selected" : "cs-tr"}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (sel) { setCitaSeleccionada(null); setNuevaFecha(""); setNuevosSlots([]); setNuevaHora(""); }
                          else     { setCitaSeleccionada(c);    setNuevaFecha(""); setNuevosSlots([]); setNuevaHora(""); }
                        }}
                      >
                        <td style={{ ...tdStyle, width: "40px" }}>
                          <div style={{
                            width: "18px", height: "18px", borderRadius: "50%",
                            border: `2px solid ${sel ? "#0EA5C8" : "#D1E3EE"}`,
                            backgroundColor: sel ? "#0EA5C8" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {sel && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{formatFecha(c.fecha)}</td>
                        <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{c.hora.substring(0, 5)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{c.medico}</td>
                        <td style={tdStyle}><Badge estado={c.estado} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {citaSeleccionada && (
            <div style={{ padding: "24px", borderTop: "1px solid #EEF4F8" }}>
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A6275" }}>
                  Paso 2 — Elige la nueva fecha y hora
                </span>
              </div>
              <form onSubmit={handleReprogramar}>
                <div style={{ maxWidth: "240px", marginBottom: "20px" }}>
                  <Lbl>Nueva fecha</Lbl>
                  <CsInput
                    type="date"
                    min={hoy}
                    value={nuevaFecha}
                    onChange={(e) => handleNuevaFechaChange(e.target.value)}
                  />
                </div>

                {cargandoNuevos ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Spinner small />
                    <span style={{ fontSize: "13px", color: "#4A6275" }}>Cargando disponibilidad...</span>
                  </div>
                ) : nuevosSlots.length > 0 ? (
                  <div style={{ marginBottom: "20px" }}>
                    <Lbl>Horarios disponibles</Lbl>
                    {renderSlots(nuevosSlots, nuevaHora, setNuevaHora, "#F57F17", "rgba(245,127,23,0.2)")}
                    {nuevaHora && (
                      <div style={{
                        marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "8px 14px", borderRadius: "8px",
                        backgroundColor: "#FFF8E1", color: "#F57F17",
                        fontSize: "13px", fontWeight: 500,
                      }}>
                        <HiOutlineCheckCircle style={{ fontSize: "16px" }} />
                        Nueva hora: <strong style={{ fontVariantNumeric: "tabular-nums" }}>{nuevaHora}</strong>
                      </div>
                    )}
                  </div>
                ) : nuevaFecha ? (
                  <Alerta tipo="warning">No hay disponibilidad para esa fecha.</Alerta>
                ) : null}

                <BtnWarning disabled={cargando || !nuevaHora}>
                  {cargando ? (
                    <><Spinner small /><span>Reprogramando...</span></>
                  ) : (
                    <><HiOutlineRefresh style={{ fontSize: "15px" }} />Reprogramar cita</>
                  )}
                </BtnWarning>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── CANCELAR ────────────────────────────────────────────────────── */}
      {tab === "cancelar" && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #EEF4F8",
            backgroundColor: "#F8FBFD",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A6275" }}>
              Selecciona la cita que deseas cancelar
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["", "Fecha", "Hora", "Doctor", "Estado"].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {citasProgramadas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#8FA3B1", padding: "40px" }}>
                      No tienes citas para cancelar
                    </td>
                  </tr>
                ) : (
                  citasProgramadas.map((c) => {
                    const sel = citaSeleccionada?.id_cita === c.id_cita;
                    return (
                      <tr
                        key={c.id_cita}
                        className={sel ? "cs-tr-danger" : "cs-tr"}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (sel) { setCitaSeleccionada(null); setMotivoCancelacion(""); }
                          else     { setCitaSeleccionada(c);    setMotivoCancelacion(""); }
                        }}
                      >
                        <td style={{ ...tdStyle, width: "40px" }}>
                          <div style={{
                            width: "18px", height: "18px", borderRadius: "50%",
                            border: `2px solid ${sel ? "#C62828" : "#D1E3EE"}`,
                            backgroundColor: sel ? "#C62828" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {sel && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{formatFecha(c.fecha)}</td>
                        <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{c.hora.substring(0, 5)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{c.medico}</td>
                        <td style={tdStyle}><Badge estado={c.estado} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {citaSeleccionada && (
            <div style={{ padding: "24px", borderTop: "1px solid #EEF4F8" }}>
              <form onSubmit={handleCancelar}>
                <div style={{ marginBottom: "16px" }}>
                  <Lbl>Motivo de la cancelación <span style={{ color: "#C62828" }}>*</span></Lbl>
                  <CsInput
                    placeholder="Describe el motivo de la cancelación"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    required
                  />
                </div>
                <BtnDanger disabled={cargando}>
                  {cargando ? (
                    <><Spinner small /><span>Cancelando...</span></>
                  ) : (
                    <><HiOutlineX style={{ fontSize: "15px" }} />Cancelar cita</>
                  )}
                </BtnDanger>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PacienteCitas;