import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaLaptop,
  FaUsers,
  FaUndo,
  FaHistory,
  FaSignOutAlt,
  FaCog,
  FaUserCircle,
  FaBriefcase,
  FaServer,
  FaCloud,
} from 'react-icons/fa';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';

import './Sidebar.scss';
import logo from '../../assets/logo_gruposp.png';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // 1. OBTENER EL AÑO ACTUAL DINÁMICAMENTE
  const currentYear = new Date().getFullYear();

  const [user, setUser] = useState({
    nombre: 'Usuario',
    email: '',
    foto_url: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const routes = [
    { path: '/', name: 'Dashboard', icon: <FaHome /> },
    { path: '/equipos', name: 'Equipos', icon: <FaLaptop /> },
    { path: '/usuarios', name: 'Colaboradores', icon: <FaUsers /> },
    { path: '/servicios', name: 'Servicios', icon: <FaCloud /> },
    {
      path: '/entrega',
      name: 'Realizar Entrega',
      icon: <FaArrowRightArrowLeft />,
      type: 'entrega',
    },
    {
      path: '/devolucion',
      name: 'Devolución',
      icon: <FaUndo />,
      type: 'devolucion',
    },
    { path: '/historial', name: 'Historial', icon: <FaHistory /> },
    { path: '/configuracion', name: 'Configuración', icon: <FaCog /> },
  ];

  const avatarUrl = user.foto_url
    ? `http://localhost:4000${user.foto_url}`
    : null;

  return (
    <div
      className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className='logo-container'>
        <img
          src={logo}
          alt='Logo'
          className={!isOpen ? 'small-logo' : ''}
        />
      </div>

      <nav>
        {routes.map((route, index) => (
          <NavLink
            key={index}
            to={route.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${route.type ? route.type : ''}`
            }
            title={!isOpen ? route.name : ''}
          >
            <div className='icon-wrapper'>{route.icon}</div>
            <span className={`label ${isOpen ? 'show' : 'hide'}`}>
              {route.name}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className='footer-actions'>
        <div className={`user-mini-card ${!isOpen ? 'collapsed' : ''}`}>
          <div className='avatar'>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt='User'
              />
            ) : (
              <FaUserCircle />
            )}
          </div>
          <div className={`info ${isOpen ? 'show' : 'hide'}`}>
            <span className='name'>{user.nombre}</span>
            <span
              className='email'
              title={user.email}
            >
              {user.email}
            </span>
          </div>
        </div>

        <button
          className={`logout-btn ${!isOpen ? 'collapsed' : ''}`}
          onClick={handleLogout}
          title='Cerrar Sesión'
        >
          <span className='icon-wrapper'>
            <FaSignOutAlt />
          </span>
          <span className={`label ${isOpen ? 'show' : 'hide'}`}>
            Cerrar Sesión
          </span>
        </button>

        {/* 2. AQUÍ SE USA LA VARIABLE DINÁMICA */}
        {isOpen && <p className='copyright'>© {currentYear} Grupo SP</p>}
      </div>
    </div>
  );
};

export default Sidebar;
