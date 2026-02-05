import { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.scss';

// Iconos
import {
  FaBars,
  FaTimes,
  FaLaptop,
  FaUsers,
  FaExchangeAlt,
  FaUndo,
  FaHistory,
  FaSignOutAlt,
  FaHome,
} from 'react-icons/fa';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Definimos el menú en un array para mantener el código limpio
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/equipos', label: 'Equipos', icon: <FaLaptop /> },
    { path: '/usuarios', label: 'Usuarios', icon: <FaUsers /> },
    { path: '/entrega', label: 'Entrega', icon: <FaExchangeAlt /> },
    { path: '/devolucion', label: 'Devolución', icon: <FaUndo /> },
    { path: '/historial', label: 'Historial', icon: <FaHistory /> },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Header: Logo y Toggle */}
      <div className='sidebar-header'>
        {!isCollapsed && <h3>Inventario</h3>}
        <button
          className='toggle-btn'
          onClick={toggleSidebar}
        >
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      {/* Navegación */}
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
            title={isCollapsed ? item.label : ''} // Tooltip nativo si está colapsado
          >
            <span className='icon'>{item.icon}</span>
            <span className='label'>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer: Logout */}
      <div className='sidebar-footer'>
        <button
          onClick={logout}
          className='logout-btn'
          title='Cerrar Sesión'
        >
          <FaSignOutAlt />
          {!isCollapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
