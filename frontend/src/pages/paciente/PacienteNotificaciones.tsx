import { useState, useEffect } from "react";
import {
  getMisNotificacionesService,
  marcarLeidaService,
  marcarTodasLeidasService,
} from "../../services/notificacion.service";
import type { Notificacion } from "../../services/notificacion.service";
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineSortDescending,
  HiOutlineSortAscending,
  HiOutlineCalendar,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineInformationCircle,
} from "react-icons/hi";

// ── Utilidades ────────────────────────────────────────────────────────────

const formatFechaHora = (fecha: string) =>
  new Date(fecha).toLocaleString("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// Icono según tipo — react-icons, sin emojis
const IconoPorTipo = ({ tipo }: { tipo: string }) => {
  const map: Record<string, React.ReactNode> = {
    cita_agendada:     <HiOutlineCalendar   style={{ fontSize: "20px", color: "#0B85A3" }} />,
    cita_cancelada:    <HiOutlineX          style={{ fontSize: "20px", color: "#C62828" }} />,
    cita_reprogramada: <HiOutlineRefresh    style={{ fontSize: "20px", color: "#F57F17" }} />,
    recordatorio:      <HiOutlineClock      style={{ fontSize: "20px", color: "#4527A0" }} />,
    sistema:           <HiOutlineInformationCircle style={{ fontSize: "20px", color: "#4A6275" }} />,
  };
  const icon = map[tipo] ?? <HiOutlineBell style={{ fontSize: "20px", color: "#4A6275" }} />;

  // Color de fondo según tipo
  const bgMap: Record<string, string> = {
    cita_agendada:     "#E0F7FC",
    cita_cancelada:    "#FFEBEE",
    cita_reprogramada: "#FFF8E1",
    recordatorio:      "#EDE7F6",
    sistema:           "#F0F4F8",
  };
  const bg = bgMap[tipo] ?? "#F0F4F8";

  return (
    <div style={{
      width: "40px", height: "40px", borderRadius: "10px",
      backgroundColor: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {icon}
    </div>
  );
};

// Color del borde izquierdo según tipo
const borderColorPorTipo = (tipo: string): string => {
  const map: Record<string, string> = {
    cita_agendada:     "#0EA5C8",
    cita_cancelada:    "#C62828",
    cita_reprogramada: "#F57F17",
    recordatorio:      "#7C3AED",
    sistema:           "#8FA3B1",
  };
  return map[tipo] ?? "#8FA3B1";
};

// ── Componentes base ──────────────────────────────────────────────────────

const BtnFiltro = ({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "7px 14px",
      backgroundColor: active ? "#0EA5C8" : "transparent",
      color: active ? "#FFFFFF" : "#4A6275",
      border: `1.5px solid ${active ? "#0EA5C8" : "#D1E3EE"}`,
      borderRadius: "8px",
      fontSize: "12px", fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      transition: "all 0.15s",
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.borderColor = "#0EA5C8";
        e.currentTarget.style.color = "#0EA5C8";
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.borderColor = "#D1E3EE";
        e.currentTarget.style.color = "#4A6275";
      }
    }}
  >
    {children}
  </button>
);

const BtnSecondaryCompact = ({
  onClick, children,
}: {
  onClick: () => void; children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "7px 14px",
      backgroundColor: "transparent",
      color: "#0EA5C8",
      border: "1.5px solid #0EA5C8",
      borderRadius: "8px",
      fontSize: "12px", fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Inter', sans-serif",
      whiteSpace: "nowrap",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#E0F7FC"; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
  >
    {children}
  </button>
);

// ── Componente principal ──────────────────────────────────────────────────

const PacienteNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando,       setCargando]       = useState(true);
  const [filtro,         setFiltro]         = useState<"todas" | "no_leidas">("todas");
  const [orden,          setOrden]          = useState<"recientes" | "antiguas">("recientes");

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      const data = await getMisNotificacionesService();
      setNotificaciones(data);
    } catch {
      console.error("Error al cargar notificaciones");
    } finally {
      setCargando(false);
    }
  };

  const handleMarcarLeida = async (id: number) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true } : n)),
    );
    window.dispatchEvent(
      new CustomEvent("notif-leida", { detail: { delta: -1 } }),
    );
    try {
      await marcarLeidaService(id);
    } catch {
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id_notificacion === id ? { ...n, leida: false } : n,
        ),
      );
      window.dispatchEvent(
        new CustomEvent("notif-leida", { detail: { delta: +1 } }),
      );
      console.error("Error al marcar como leída");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida).length;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    window.dispatchEvent(
      new CustomEvent("notif-leida", { detail: { delta: -pendientes } }),
    );
    try {
      await marcarTodasLeidasService();
    } catch {
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: false })));
      window.dispatchEvent(
        new CustomEvent("notif-leida", { detail: { delta: +pendientes } }),
      );
      console.error("Error al marcar todas como leídas");
    }
  };

  const notificacionesFiltradas = notificaciones
    .filter((n) => (filtro === "no_leidas" ? !n.leida : true))
    .sort((a, b) => {
      const diff =
        new Date(a.fecha_envio).getTime() - new Date(b.fecha_envio).getTime();
      return orden === "recientes" ? -diff : diff;
    });

  const cantidadNoLeidas = notificaciones.filter((n) => !n.leida).length;

  // ── Spinner ───────────────────────────────────────────────────────────

  if (cargando) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
      <div style={{
        width: "36px", height: "36px",
        border: "3px solid #D1E3EE", borderTopColor: "#0EA5C8",
        borderRadius: "50%", animation: "cs-spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Encabezado */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HiOutlineBell style={{ fontSize: "22px", color: "#0EA5C8" }} />
          <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
            Notificaciones
          </h4>
          {cantidadNoLeidas > 0 && (
            <span style={{
              fontSize: "11px", fontWeight: 700,
              padding: "2px 9px", borderRadius: "20px",
              backgroundColor: "#FFEBEE", color: "#C62828",
            }}>
              {cantidadNoLeidas} nuevas
            </span>
          )}
        </div>

        {cantidadNoLeidas > 0 && (
          <BtnSecondaryCompact onClick={handleMarcarTodasLeidas}>
            <HiOutlineCheckCircle style={{ fontSize: "15px" }} />
            Marcar todas como leídas
          </BtnSecondaryCompact>
        )}
      </div>

      {/* Controles — filtro + orden en una sola línea */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        alignItems: "center", gap: "8px",
        padding: "12px 16px",
        backgroundColor: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #D1E3EE",
        boxShadow: "0 1px 3px rgba(15,47,69,0.06)",
      }}>
        {/* Filtro */}
        <BtnFiltro active={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas ({notificaciones.length})
        </BtnFiltro>
        <BtnFiltro active={filtro === "no_leidas"} onClick={() => setFiltro("no_leidas")}>
          No leídas ({cantidadNoLeidas})
        </BtnFiltro>

        {/* Separador visual */}
        <div style={{ width: "1px", height: "24px", backgroundColor: "#D1E3EE", margin: "0 4px" }} />

        {/* Orden */}
        <span style={{ fontSize: "12px", color: "#8FA3B1", fontWeight: 500 }}>Ordenar:</span>
        <BtnFiltro active={orden === "recientes"} onClick={() => setOrden("recientes")}>
          <HiOutlineSortDescending style={{ fontSize: "13px" }} />
          Recientes
        </BtnFiltro>
        <BtnFiltro active={orden === "antiguas"} onClick={() => setOrden("antiguas")}>
          <HiOutlineSortAscending style={{ fontSize: "13px" }} />
          Antiguas
        </BtnFiltro>
      </div>

      {/* Lista de notificaciones / estado vacío */}
      {notificacionesFiltradas.length === 0 ? (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          padding: "56px 24px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "12px",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: "#F0F4F8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <HiOutlineBell style={{ fontSize: "26px", color: "#8FA3B1" }} />
          </div>
          <p style={{ fontSize: "14px", color: "#8FA3B1", margin: 0 }}>
            No tienes notificaciones
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {notificacionesFiltradas.map((n) => (
            <div
              key={n.id_notificacion}
              style={{
                backgroundColor: n.leida ? "#FFFFFF" : "#F8FDFF",
                borderRadius: "12px",
                border: "1px solid #D1E3EE",
                borderLeft: `4px solid ${n.leida ? "#D1E3EE" : borderColorPorTipo(n.tipo)}`,
                boxShadow: "0 1px 3px rgba(15,47,69,0.06)",
                padding: "16px 20px",
                opacity: n.leida ? 0.85 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: "12px",
              }}>
                {/* Ícono + contenido */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 }}>
                  <IconoPorTipo tipo={n.tipo} />
                  <div style={{ flex: 1 }}>
                    {/* Título + dot */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1A2B3C" }}>
                        {n.titulo}
                      </span>
                      {!n.leida && (
                        <span style={{
                          width: "8px", height: "8px", borderRadius: "50%",
                          backgroundColor: "#0EA5C8", flexShrink: 0,
                          display: "inline-block",
                        }} />
                      )}
                    </div>
                    {/* Mensaje */}
                    <p style={{
                      fontSize: "13px", color: "#4A6275",
                      margin: "0 0 6px 0", lineHeight: 1.5,
                    }}>
                      {n.mensaje}
                    </p>
                    {/* Fecha */}
                    <span style={{
                      fontSize: "11px", color: "#8FA3B1",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {formatFechaHora(n.fecha_envio)}
                    </span>
                  </div>
                </div>

                {/* Botón marcar leída */}
                {!n.leida && (
                  <BtnSecondaryCompact onClick={() => handleMarcarLeida(n.id_notificacion)}>
                    <HiOutlineCheckCircle style={{ fontSize: "14px" }} />
                    Marcar leída
                  </BtnSecondaryCompact>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PacienteNotificaciones;