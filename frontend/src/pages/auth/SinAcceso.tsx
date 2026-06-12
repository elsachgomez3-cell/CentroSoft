import { useNavigate } from 'react-router-dom'
import { HiShieldExclamation } from 'react-icons/hi'

const SinAcceso = () => {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F0F4F8',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #D1E3EE',
          boxShadow: '0 4px 12px rgba(15, 47, 69, 0.10)',
          padding: '48px 40px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Ícono */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#FFEBEE',
            marginBottom: '20px',
          }}
        >
          <HiShieldExclamation style={{ fontSize: '36px', color: '#C62828' }} />
        </div>

        {/* Título */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1A2B3C',
            marginBottom: '10px',
          }}
        >
          Acceso denegado
        </h2>

        {/* Descripción */}
        <p
          style={{
            fontSize: '14px',
            color: '#4A6275',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}
        >
          No tienes permisos para ver esta página.
        </p>

        {/* Botón */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '11px 20px',
            backgroundColor: '#0EA5C8',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0B85A3')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0EA5C8')}
        >
          Volver al login
        </button>
      </div>
    </div>
  )
}

export default SinAcceso