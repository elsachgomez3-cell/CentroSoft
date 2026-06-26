import { useState, useEffect } from "react";
import type { Especialidad, Horario, SlotDisponible } from "../../types";
import { getEspecialidadesService, getHorariosService } from "../../services/admin.service";
import api from "../../services/api";
import {
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineArrowLeft,
} from "react-icons/hi";

const CsSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    style={{
      padding: "9px 13px", border: "1.5px solid #D1E3EE",
      borderRadius: "8px", fontSize: "13px", fontFamily: "'Inter', sans-serif",
      color: "#1A2B3C", backgroundColor: "#FFFFFF", outline: "none",
      cursor: "pointer", minWidth: "200px",
    }}
  />
);

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#4A6275", marginBottom: "5px" }}>
    {children}
  </label>
);

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

const Spinner = () => (
  <div style={{
    width: "16px", height: "16px", border: "2px solid #D1E3EE",
    borderTopColor: "currentColor", borderRadius: "50%",
    animation: "cs-spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface DiaCalendario {
  fecha: string;
  diaNumero: number;
  estado: "disponible" | "no_trabaja" | "fuera_de_mes";
}

const AuxiliarCitas = () => {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [idEspecialidad, setIdEspecialidad] = useState("");
  const [idHorario, setIdHorario] = useState("");

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());

  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getEspecialidadesService().then(setEspecialidades).catch(() => {});
    getHorariosService().then(setHorarios).catch(() => setError("No se pudieron cargar los horarios"));
  }, []);

  const horariosFiltrados = horarios.filter(
    h => h.activo && (!idEspecialidad || h.id_especialidad === Number(idEspecialidad)),
  );

  const horarioSeleccionado = horarios.find(h => h.id_horario === Number(idHorario));

  const generarDiasMes = (): DiaCalendario[] => {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();

    const dias: DiaCalendario[] = [];

    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ fecha: "", diaNumero: 0, estado: "fuera_de_mes" });
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const fechaObj = new Date(anio, mes, d);
      const diaSemanaISO = (fechaObj.getDay() + 6) % 7;
      const fechaStr = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const trabaja = horarioSeleccionado
        ? horarioSeleccionado.dias.includes(diaSemanaISO)
        : false;

      dias.push({
        fecha: fechaStr,
        diaNumero: d,
        estado: trabaja ? "disponible" : "no_trabaja",
      });
    }

    return dias;
  };

  const diasMes = generarDiasMes();

  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
    setDiaSeleccionado(null);
  };

  const handleClickDia = async (dia: DiaCalendario) => {
    if (dia.estado !== "disponible" || !idHorario) return;
    setDiaSeleccionado(dia.fecha);
    setCargandoSlots(true);
    try {
      const res = await api.get("/citas/disponibilidad", {
        params: { id_horario: Number(idHorario), fecha: dia.fecha },
      });
      setSlots(res.data);
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`@keyframes cs-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineCalendar style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Disponibilidad de Citas
        </h4>
      </div>

      {error && <Alerta>{error}</Alerta>}

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <Lbl>Especialidad</Lbl>
            <CsSelect value={idEspecialidad} onChange={e => { setIdEspecialidad(e.target.value); setIdHorario(""); setDiaSeleccionado(null); }}>
              <option value="">Todas</option>
              {especialidades.map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}
            </CsSelect>
          </div>
          <div>
            <Lbl>Médico</Lbl>
            <CsSelect value={idHorario} onChange={e => { setIdHorario(e.target.value); setDiaSeleccionado(null); }}>
              <option value="">Selecciona un médico</option>
              {horariosFiltrados.map(h => (
                <option key={h.id_horario} value={h.id_horario}>{h.medico} — {h.especialidad}</option>
              ))}
            </CsSelect>
          </div>
        </div>
      </div>

      {idHorario && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <button onClick={() => cambiarMes(-1)} style={{ background: "none", border: "1.5px solid #D1E3EE", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#4A6275" }}>‹</button>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1A2B3C" }}>{MESES[mes]} {anio}</span>
            <button onClick={() => cambiarMes(1)} style={{ background: "none", border: "1.5px solid #D1E3EE", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#4A6275" }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "12px" }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#8FA3B1", padding: "6px 0" }}>{d}</div>
            ))}
            {diasMes.map((dia, i) => (
              <button
                key={i}
                disabled={dia.estado !== "disponible"}
                onClick={() => handleClickDia(dia)}
                style={{
                  aspectRatio: "1", borderRadius: "8px", border: "none",
                  cursor: dia.estado === "disponible" ? "pointer" : "default",
                  backgroundColor:
                    dia.estado === "fuera_de_mes" ? "transparent" :
                    diaSeleccionado === dia.fecha ? "#0EA5C8" :
                    dia.estado === "disponible" ? "#E8F5E9" : "#F0F4F8",
                  color:
                    dia.estado === "fuera_de_mes" ? "transparent" :
                    diaSeleccionado === dia.fecha ? "#FFFFFF" :
                    dia.estado === "disponible" ? "#2E7D32" : "#8FA3B1",
                  fontSize: "13px", fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {dia.diaNumero || ""}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#4A6275", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block" }} /> Hay horas disponibles
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#8FA3B1", display: "inline-block" }} /> No trabaja el médico
            </span>
          </div>
        </div>
      )}

      {diaSeleccionado && horarioSeleccionado && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #D1E3EE", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <button onClick={() => setDiaSeleccionado(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1", display: "flex" }}>
              <HiOutlineArrowLeft style={{ fontSize: "16px" }} />
            </button>
            <h5 style={{ fontSize: "15px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
              Horarios disponibles — Dr. {horarioSeleccionado.medico}
            </h5>
          </div>
          <p style={{ fontSize: "12px", color: "#8FA3B1", margin: "0 0 16px 26px" }}>
            {horarioSeleccionado.especialidad} · {diaSeleccionado}
          </p>

          {cargandoSlots ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}><Spinner /></div>
          ) : slots.length === 0 ? (
            <div style={{ color: "#8FA3B1", fontSize: "13px" }}>No hay horarios configurados para este día.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {slots.map(s => (
                <span
                  key={s.hora}
                  style={{
                    padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    border: "1.5px solid", borderColor: s.disponible ? "#2E7D32" : "#D1E3EE",
                    backgroundColor: s.disponible ? "#E8F5E9" : "#F8FBFD",
                    color: s.disponible ? "#2E7D32" : "#C4D4DF",
                    textDecoration: s.disponible ? "none" : "line-through",
                  }}
                >
                  {s.hora}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuxiliarCitas;