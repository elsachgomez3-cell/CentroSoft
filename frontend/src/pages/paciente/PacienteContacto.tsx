import {
  HiOutlineOfficeBuilding,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClock,
} from "react-icons/hi";

// ── Ítem de contacto ──────────────────────────────────────────────────────

const ContactItem = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
    <div style={{
      width: "40px", height: "40px", borderRadius: "10px",
      backgroundColor: iconBg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon style={{ fontSize: "19px", color: iconColor }} />
    </div>
    <div>
      <div style={{
        fontSize: "11px", fontWeight: 600, color: "#8FA3B1",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px",
      }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "#1A2B3C", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────

const PacienteContacto = () => {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineOfficeBuilding style={{ fontSize: "22px", color: "#0EA5C8" }} />
        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2B3C", margin: 0 }}>
          Información de Contacto
        </h4>
      </div>

      {/* Grid de dos columnas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
        maxWidth: "900px",
      }}>

        {/* ── Columna izquierda — datos de contacto ── */}
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          overflow: "hidden",
        }}>
          {/* Header de marca */}
          <div style={{
            padding: "20px 24px",
            background: "linear-gradient(135deg, #0F2F45 0%, #1A4B6B 100%)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <HiOutlineOfficeBuilding style={{ fontSize: "20px", color: "#00D4FF" }} />
            <span style={{
              fontSize: "16px", fontWeight: 700,
              letterSpacing: "0.08em",
            }}>
              <span style={{ color: "#FFFFFF" }}>Centro</span>
              <span style={{ color: "#00D4FF" }}>Soft</span>
            </span>
          </div>

          {/* Ítems */}
          <div style={{
            padding: "24px",
            display: "flex", flexDirection: "column", gap: "20px",
          }}>
            <ContactItem
              icon={HiOutlineLocationMarker}
              iconBg="#E0F7FC"
              iconColor="#0B85A3"
              label="Dirección"
              value="Calle Principal #123"
            />
            <ContactItem
              icon={HiOutlinePhone}
              iconBg="#E8F5E9"
              iconColor="#2E7D32"
              label="Teléfono"
              value="73535262"
            />
            <ContactItem
              icon={HiOutlineMail}
              iconBg="#FFF8E1"
              iconColor="#F57F17"
              label="Correo"
              value="centrosoft@gmail.com"
            />
            <ContactItem
              icon={HiOutlineClock}
              iconBg="#EDE7F6"
              iconColor="#4527A0"
              label="Horarios"
              value="Lunes a Viernes: 08:00 – 20:00"
            />
          </div>
        </div>

        {/* ── Columna derecha — mapa ── */}
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #D1E3EE", boxShadow: "0 1px 3px rgba(15,47,69,0.08)",
          overflow: "hidden",
          minHeight: "320px",
        }}>
          <iframe
            title="Ubicación CentroSoft"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d60586.46153393906!2d-68.22915685!3d-16.502585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915f21438d9a9a9d%3A0x5d7c6f1e9b3e4e2a!2sEl%20Alto%2C%20Bolivia!5e0!3m2!1ses-419!2sbo!4v1717000000000!5m2!1ses-419!2sbo"
            width="100%"
            height="100%"
            style={{ border: 0, display: "block", minHeight: "320px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </div>
  );
};

export default PacienteContacto;