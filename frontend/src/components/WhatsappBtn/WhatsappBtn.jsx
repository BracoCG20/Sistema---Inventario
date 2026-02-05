import { FaWhatsapp } from 'react-icons/fa';

const WhatsappBtn = () => {
  // Configura aquí el número (código país + número)
  const phoneNumber = '51999999999';
  const message = 'Hola, necesito soporte con el sistema de inventario.';

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target='_blank'
      rel='noopener noreferrer'
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '35px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        zIndex: 1000,
        transition: 'transform 0.3s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      title='Contactar Soporte'
    >
      <FaWhatsapp />
    </a>
  );
};

export default WhatsappBtn;
