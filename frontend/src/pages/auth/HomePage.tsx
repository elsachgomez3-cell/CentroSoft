import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import logoImg from '../../assets/logo.png'
import {
  HiOutlineCalendar,
  HiOutlineBell,
  HiOutlineClipboardList,
  HiOutlineLockClosed,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClock,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineStar,
} from 'react-icons/hi'

const HomePage = () => {
  const navigate = useNavigate()
  const [seccionActiva, setSeccionActiva] = useState('inicio')
  const [menuAbierto, setMenuAbierto] = useState(false)

  const [formContacto, setFormContacto] = useState({
    nombre:  '',
    email:   '',
    asunto:  '',
    mensaje: ''
  })
  const [enviando,      setEnviando]      = useState(false)
  const [exitoContacto, setExitoContacto] = useState('')
  const [errorContacto, setErrorContacto] = useState('')

  const mostrarSeccion = (id: string) => {
    setSeccionActiva(id)
    setMenuAbierto(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navItems = [
    { label: 'Inicio',        id: 'inicio' },
    { label: 'Servicios',     id: 'servicios' },
    { label: 'Equipo médico', id: 'equipo' },
    { label: 'Acerca de',     id: 'acerca' },
    { label: 'Testimonios',   id: 'testimonios' },
    { label: 'Contacto',      id: 'contacto' },
  ]

  const servicios = [
    { icon: HiOutlineClipboardList, nombre: 'Medicina general',  desc: 'Atención médica integral para toda la familia.' },
    { icon: HiOutlineClipboardList, nombre: 'Pediatría',          desc: 'Cuidado especializado para niños y adolescentes.' },
    { icon: HiOutlineClipboardList, nombre: 'Cardiología',        desc: 'Diagnóstico y tratamiento de enfermedades del corazón.' },
    { icon: HiOutlineClipboardList, nombre: 'Ginecología',        desc: 'Salud integral de la mujer en todas sus etapas.' },
    { icon: HiOutlineClipboardList, nombre: 'Traumatología',      desc: 'Tratamiento de lesiones del sistema músculo-esquelético.' },
    { icon: HiOutlineClipboardList, nombre: 'Neurología',         desc: 'Diagnóstico de enfermedades del sistema nervioso.' },
  ]

  const medicos = [
    {
      nombre:       'Dr. Enrique Gomez',
      especialidad: 'Medicina general · Pediatría',
      descripcion:  'Médico con amplia experiencia en atención primaria y pediatría.',
      inicial:      'EG'
    },
    {
      nombre:       'Dr. Santos Gomez',
      especialidad: 'Cardiología · Medicina general',
      descripcion:  'Especialista en enfermedades cardiovasculares y medicina interna.',
      inicial:      'SG'
    },
  ]

  const testimonios = [
    {
      nombre:     'Juan Antonio C.',
      comentario: 'Pude agendar mi cita en minutos y recibí un recordatorio automático. El Dr. Gomez fue muy atento.',
      estrellas:  5
    },
    {
      nombre:     'María M.',
      comentario: 'Muy fácil de usar. Me gusta poder ver mi historial y reprogramar sin tener que llamar.',
      estrellas:  5
    },
    {
      nombre:     'Carlos T.',
      comentario: 'Sistema muy intuitivo. La atención médica fue de primera calidad. Lo recomiendo ampliamente.',
      estrellas:  4
    },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-main)', background: 'var(--cs-bg-base)', minHeight: '100vh' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        zIndex:          100,
        background:      'var(--cs-bg-surface)',
        borderBottom:    '1px solid var(--cs-border)',
        boxShadow:       'var(--cs-shadow-sm)',
        height:          '64px',
        display:         'flex',
        alignItems:      'center',
      }}>
        <div style={{
          maxWidth:      '1200px',
          margin:        '0 auto',
          padding:       '0 24px',
          width:         '100%',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          gap:           '16px',
        }}>

          {/* ── Logo ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <img
              src={logoImg}
              alt="CentroSoft"
              style={{ height: '36px', width: 'auto', display: 'block' }}
            />
               <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--cs-text-primary)' }}>
              Centro<span style={{ color: 'var(--cs-primary)' }}>Soft</span>
            </span>
          </div>
        
          {/* Nav items — desktop */}
          <ul style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '2px',
            listStyle:  'none',
            margin:     0,
            padding:    0,
          }} className="hp-nav-desktop">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => mostrarSeccion(item.id)}
                  style={{
                    background:    'none',
                    border:        'none',
                    padding:       '8px 14px',
                    borderRadius:  'var(--cs-radius-md)',
                    fontSize:      '14px',
                    fontWeight:    seccionActiva === item.id ? 600 : 500,
                    color:         seccionActiva === item.id ? 'var(--cs-primary)' : 'var(--cs-text-secondary)',
                    cursor:        'pointer',
                    transition:    'background 0.15s, color 0.15s',
                    fontFamily:    'var(--font-main)',
                    borderBottom:  seccionActiva === item.id
                      ? '2px solid var(--cs-primary)'
                      : '2px solid transparent',
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="cs-btn cs-btn-primary cs-btn-sm"
              onClick={() => navigate('/login')}
              style={{ flexShrink: 0 }}
            >
              Iniciar sesión
            </button>

            {/* Hamburguesa — mobile */}
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={{
                background:   'none',
                border:       '1px solid var(--cs-border)',
                borderRadius: 'var(--cs-radius-md)',
                padding:      '6px',
                cursor:       'pointer',
                color:        'var(--cs-text-secondary)',
                display:      'none',
                alignItems:   'center',
              }}
              className="hp-hamburger"
              aria-label="Abrir menú"
            >
              {menuAbierto
                ? <HiOutlineX size={20} />
                : <HiOutlineMenu size={20} />
              }
            </button>
          </div>

        </div>
      </nav>

      {/* Menú mobile desplegable */}
      {menuAbierto && (
        <div style={{
          position:   'fixed',
          top:        '64px',
          left:       0,
          right:      0,
          zIndex:     99,
          background: 'var(--cs-bg-surface)',
          borderBottom: '1px solid var(--cs-border)',
          boxShadow:  'var(--cs-shadow-md)',
          padding:    '12px 24px 16px',
        }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => mostrarSeccion(item.id)}
              style={{
                display:      'block',
                width:        '100%',
                textAlign:    'left',
                background:   seccionActiva === item.id ? 'var(--cs-primary-light)' : 'none',
                border:       'none',
                padding:      '12px 14px',
                borderRadius: 'var(--cs-radius-md)',
                fontSize:     '14px',
                fontWeight:   seccionActiva === item.id ? 600 : 500,
                color:        seccionActiva === item.id ? 'var(--cs-primary)' : 'var(--cs-text-primary)',
                cursor:       'pointer',
                fontFamily:   'var(--font-main)',
                marginBottom: '2px',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ paddingTop: '64px' }} />

      {/* ── SECCIÓN INICIO ─────────────────────────────────── */}
      {seccionActiva === 'inicio' && (
        <section style={{
          background: 'linear-gradient(135deg, var(--cs-secondary-dark) 0%, var(--cs-secondary) 60%, #1A6B8A 100%)',
          minHeight:  'calc(100vh - 64px)',
          display:    'flex',
          alignItems: 'center',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}
              className="hp-hero-grid">

              {/* Texto izquierda */}
              <div style={{ color: '#fff' }}>
                <div style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          '6px',
                  background:   'rgba(255,255,255,0.12)',
                  borderRadius: 'var(--cs-radius-full)',
                  padding:      '5px 14px',
                  fontSize:     '12px',
                  fontWeight:   600,
                  marginBottom: '20px',
                  color:        'rgba(255,255,255,0.9)',
                }}>
                  <HiOutlineCheckCircle size={14} />
                  Sistema de gestión médica
                </div>

                <h1 style={{ fontSize: '42px', fontWeight: 700, lineHeight: 1.2, marginBottom: '20px' }}>
                  Tu salud,<br />nuestra prioridad
                </h1>
                <p style={{ fontSize: '16px', lineHeight: 1.7, opacity: 0.85, marginBottom: '32px', maxWidth: '440px' }}>
                  CentroSoft conecta pacientes con profesionales de la salud
                  de forma rápida, segura y eficiente.
                </p>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
                  <button
                    className="cs-btn cs-btn-lg"
                    style={{ background: '#fff', color: 'var(--cs-secondary-dark)', fontWeight: 700 }}
                    onClick={() => navigate('/register')}
                  >
                    Regístrate gratis
                  </button>
                  <button
                    className="cs-btn"
                    style={{
                      background:  'transparent',
                      color:       '#fff',
                      border:      '1.5px solid rgba(255,255,255,0.5)',
                      display:     'flex',
                      alignItems:  'center',
                      gap:         '6px',
                    }}
                    onClick={() => mostrarSeccion('servicios')}
                  >
                    Ver servicios <HiOutlineChevronRight size={16} />
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  {[
                    { numero: '500+', label: 'Pacientes atendidos' },
                    { numero: '15+',  label: 'Médicos especialistas' },
                    { numero: '6',    label: 'Especialidades' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background:   'rgba(255,255,255,0.1)',
                      borderRadius: 'var(--cs-radius-md)',
                      padding:      '14px 12px',
                      textAlign:    'center',
                      border:       '1px solid rgba(255,255,255,0.12)',
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>{stat.numero}</div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cards derecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { Icon: HiOutlineCalendar,    titulo: 'Agenda en línea',  desc: 'Reserva tu cita médica en minutos desde cualquier dispositivo.' },
                  { Icon: HiOutlineBell,         titulo: 'Notificaciones',   desc: 'Recibe recordatorios automáticos de tus citas programadas.' },
                  { Icon: HiOutlineClipboardList,titulo: 'Historial médico', desc: 'Accede a tu historial de consultas en cualquier momento.' },
                  { Icon: HiOutlineLockClosed,   titulo: 'Datos seguros',    desc: 'Tu información personal está protegida con los más altos estándares.' },
                ].map(card => (
                  <div key={card.titulo} style={{
                    background:   'rgba(255,255,255,0.1)',
                    borderRadius: 'var(--cs-radius-lg)',
                    padding:      '20px 16px',
                    border:       '1px solid rgba(255,255,255,0.12)',
                    color:        '#fff',
                  }}>
                    <card.Icon size={26} style={{ marginBottom: '10px', opacity: 0.9 }} />
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>{card.titulo}</div>
                    <div style={{ fontSize: '12px', opacity: 0.75, lineHeight: 1.5 }}>{card.desc}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── SECCIÓN SERVICIOS ──────────────────────────────── */}
      {seccionActiva === 'servicios' && (
        <section style={{ background: 'var(--cs-bg-base)', minHeight: 'calc(100vh - 64px)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '10px' }}>
                Nuestros servicios
              </h2>
              <p style={{ color: 'var(--cs-text-secondary)', fontSize: '15px' }}>
                Contamos con una amplia gama de especialidades médicas
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '20px' }}>
              {servicios.map(s => (
                <div key={s.nombre} className="cs-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    width:          '52px',
                    height:         '52px',
                    borderRadius:   'var(--cs-radius-md)',
                    background:     'var(--cs-primary-light)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    margin:         '0 auto',
                  }}>
                    <s.icon size={24} style={{ color: 'var(--cs-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--cs-text-primary)', margin: 0 }}>
                    {s.nombre}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--cs-text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                    {s.desc}
                  </p>
                  <button
                    className="cs-btn cs-btn-secondary cs-btn-sm"
                    style={{ marginTop: 'auto', alignSelf: 'center' }}
                    onClick={() => navigate('/register')}
                  >
                    Agendar cita
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECCIÓN EQUIPO MÉDICO ──────────────────────────── */}
      {seccionActiva === 'equipo' && (
        <section style={{ background: 'var(--cs-bg-surface)', minHeight: 'calc(100vh - 64px)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '10px' }}>
                Nuestro equipo médico
              </h2>
              <p style={{ color: 'var(--cs-text-secondary)', fontSize: '15px' }}>
                Profesionales comprometidos con tu bienestar
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
              {medicos.map(m => (
                <div key={m.nombre} className="cs-card" style={{ textAlign: 'center' }}>
                  <div className="cs-avatar cs-avatar-lg" style={{ margin: '0 auto 16px' }}>
                    {m.inicial}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '4px' }}>
                    {m.nombre}
                  </h3>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cs-primary)', marginBottom: '10px' }}>
                    {m.especialidad}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--cs-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {m.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECCIÓN ACERCA DE ──────────────────────────────── */}
      {seccionActiva === 'acerca' && (
        <section style={{ background: 'var(--cs-bg-base)', minHeight: 'calc(100vh - 64px)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '10px' }}>
                Acerca de CentroSoft
              </h2>
              <p style={{ color: 'var(--cs-text-secondary)', fontSize: '15px' }}>
                Nuestra misión y visión como sistema de salud
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '20px' }}>
              {[
                {
                  label: 'Misión',
                  texto: 'Brindar un servicio de salud accesible, eficiente y de calidad a todos nuestros pacientes, utilizando tecnología innovadora para facilitar la gestión de citas médicas y mejorar la experiencia de atención.',
                },
                {
                  label: 'Visión',
                  texto: 'Ser el sistema de gestión médica líder en Bolivia, reconocido por la excelencia en el servicio, la innovación tecnológica y el compromiso con la salud y bienestar de la comunidad.',
                },
              ].map(item => (
                <div key={item.label} className="cs-card" style={{ textAlign: 'center' }}>
                  <div style={{
                    width:          '48px',
                    height:         '48px',
                    borderRadius:   'var(--cs-radius-md)',
                    background:     'var(--cs-primary-light)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    margin:         '0 auto 16px',
                  }}>
                    <HiOutlineCheckCircle size={22} style={{ color: 'var(--cs-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '14px' }}>
                    {item.label}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--cs-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECCIÓN TESTIMONIOS ────────────────────────────── */}
      {seccionActiva === 'testimonios' && (
        <section style={{ background: 'var(--cs-bg-surface)', minHeight: 'calc(100vh - 64px)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '10px' }}>
                Testimonios de pacientes
              </h2>
              <p style={{ color: 'var(--cs-text-secondary)', fontSize: '15px' }}>
                Lo que dicen nuestros pacientes
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '20px' }}>
              {testimonios.map(t => (
                <div key={t.nombre} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: t.estrellas }).map((_, i) => (
                      <HiOutlineStar key={i} size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                    ))}
                    {Array.from({ length: 5 - t.estrellas }).map((_, i) => (
                      <HiOutlineStar key={i + t.estrellas} size={16} style={{ color: 'var(--cs-border)' }} />
                    ))}
                  </div>
                  <p style={{
                    fontSize:   '13px',
                    color:      'var(--cs-text-secondary)',
                    lineHeight: 1.7,
                    fontStyle:  'italic',
                    margin:     0,
                    flex:       1,
                  }}>
                    "{t.comentario}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
                    <div className="cs-avatar cs-avatar-sm">
                      {t.nombre.charAt(0)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cs-text-primary)' }}>
                      {t.nombre}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECCIÓN CONTACTO ───────────────────────────────── */}
      {seccionActiva === 'contacto' && (
        <section style={{ background: 'var(--cs-bg-base)', minHeight: 'calc(100vh - 64px)', padding: '64px 24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '10px' }}>
                Contáctanos
              </h2>
              <p style={{ color: 'var(--cs-text-secondary)', fontSize: '15px' }}>
                Estamos aquí para ayudarte
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', alignItems: 'start' }}
              className="hp-contact-grid">

              {/* Info de contacto */}
              <div className="cs-card">
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '20px' }}>
                  Información de contacto
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { Icon: HiOutlineLocationMarker, label: 'Dirección', valor: 'Calle Principal #123' },
                    { Icon: HiOutlinePhone,           label: 'Teléfono',  valor: '73535262' },
                    { Icon: HiOutlineMail,            label: 'Correo',    valor: 'centrosoft@gmail.com' },
                    { Icon: HiOutlineClock,           label: 'Horarios',  valor: 'Lunes a viernes: 08:00 – 20:00' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width:          '36px',
                        height:         '36px',
                        borderRadius:   'var(--cs-radius-md)',
                        background:     'var(--cs-primary-light)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                      }}>
                        <item.Icon size={18} style={{ color: 'var(--cs-primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--cs-text-primary)' }}>
                          {item.valor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario */}
              <div className="cs-card">
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cs-text-primary)', marginBottom: '20px' }}>
                  Envíanos un mensaje
                </h3>

                {errorContacto && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <HiOutlineExclamationCircle size={18} />
                    {errorContacto}
                  </div>
                )}
                {exitoContacto && (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <HiOutlineCheckCircle size={18} />
                    {exitoContacto}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setErrorContacto('')
                  setExitoContacto('')
                  setEnviando(true)
                  try {
                    await api.post('/contacto', formContacto)
                    setExitoContacto('Mensaje enviado correctamente. Nos comunicaremos contigo pronto.')
                    setFormContacto({ nombre: '', email: '', asunto: '', mensaje: '' })
                  } catch {
                    setErrorContacto('Error al enviar el mensaje. Intenta nuevamente.')
                  } finally {
                    setEnviando(false)
                  }
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="cs-field-group">
                      <label className="cs-label">Nombre</label>
                      <input
                        className="cs-input"
                        placeholder="Tu nombre"
                        value={formContacto.nombre}
                        onChange={e => setFormContacto({ ...formContacto, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="cs-field-group">
                      <label className="cs-label">Email</label>
                      <input
                        type="email"
                        className="cs-input"
                        placeholder="tu@email.com"
                        value={formContacto.email}
                        onChange={e => setFormContacto({ ...formContacto, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="cs-field-group">
                    <label className="cs-label">Asunto</label>
                    <input
                      className="cs-input"
                      placeholder="¿En qué podemos ayudarte?"
                      value={formContacto.asunto}
                      onChange={e => setFormContacto({ ...formContacto, asunto: e.target.value })}
                      required
                    />
                  </div>

                  <div className="cs-field-group">
                    <label className="cs-label">Mensaje</label>
                    <textarea
                      className="cs-input cs-textarea"
                      rows={4}
                      placeholder="Escribe tu mensaje aquí..."
                      value={formContacto.mensaje}
                      onChange={e => setFormContacto({ ...formContacto, mensaje: e.target.value })}
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="cs-btn cs-btn-primary"
                    disabled={enviando}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {enviando ? (
                      <>
                        <span style={{
                          width:       '14px',
                          height:      '14px',
                          border:      '2px solid rgba(255,255,255,0.3)',
                          borderTop:   '2px solid #fff',
                          borderRadius:'50%',
                          display:     'inline-block',
                          animation:   'spin 0.7s linear infinite',
                        }} />
                        Enviando...
                      </>
                    ) : 'Enviar mensaje'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        background: 'var(--cs-bg-sidebar)',
        padding:    '24px',
        textAlign:  'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Políticas de seguridad',   onClick: () => alert('Políticas de seguridad de CentroSoft') },
              { label: 'Términos y condiciones',    onClick: () => alert('Términos y condiciones de CentroSoft') },
            ].map(link => (
              <button
                key={link.label}
                onClick={link.onClick}
                style={{
                  background:  'none',
                  border:      'none',
                  color:       'rgba(255,255,255,0.5)',
                  fontSize:    '13px',
                  cursor:      'pointer',
                  fontFamily:  'var(--font-main)',
                  transition:  'color 0.15s',
                  padding:     0,
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
          <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
            © 2026 CentroSoft — Sistema de Gestión Médica
          </small>
        </div>
      </footer>

      {/* ── ESTILOS RESPONSIVE INTERNOS ────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 767px) {
          .hp-nav-desktop { display: none !important; }
          .hp-hamburger   { display: flex !important; }
          .hp-hero-grid   { grid-template-columns: 1fr !important; }
          .hp-contact-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>

    </div>
  )
}

export default HomePage