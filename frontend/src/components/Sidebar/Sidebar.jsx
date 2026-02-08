import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // <--- Asegúrate de importar tu contexto
import {
	FaHome,
	FaLaptop,
	FaUsers,
	FaPaperPlane,
	FaUndo,
	FaHistory,
	FaSignOutAlt, // Icono Cerrar Sesión
	FaBars, // Icono Hamburguesa
	FaChevronLeft,
	FaCog,
} from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

import "./Sidebar.scss";
import logo from "../../assets/logo_gruposp.png";

const Sidebar = () => {
	const [isOpen, setIsOpen] = useState(true); // Estado para colapsar
	const { logout } = useAuth(); // Función del AuthContext

	const routes = [
		{ path: "/", name: "Dashboard", icon: <FaHome /> },
		{ path: "/equipos", name: "Equipos", icon: <FaLaptop /> },
		{ path: "/usuarios", name: "Colaboradores", icon: <FaUsers /> },

		// SECCIÓN OPERATIVA
		{
			path: "/entrega",
			name: "Realizar Entrega",
			icon: <FaArrowRightArrowLeft />,
			type: "entrega",
		},
		{
			path: "/devolucion",
			name: "Devolución",
			icon: <FaUndo />,
			type: "devolucion",
		},

		{ path: "/historial", name: "Historial", icon: <FaHistory /> },
		{ path: "/configuracion", name: "Configuracion", icon: <FaCog /> },
	];

	const toggleSidebar = () => setIsOpen(!isOpen);

	return (
		<div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
			{/* BOTÓN PARA ENCOGER/EXPANDIR */}
			<div className='toggle-btn' onClick={toggleSidebar}>
				{isOpen ? <FaChevronLeft /> : <FaBars />}
			</div>

			<div className='logo-container'>
				{/* Si está colapsado, ocultamos el logo o mostramos una versión mini */}
				<img src={logo} alt='Logo' className={!isOpen ? "small-logo" : ""} />
			</div>

			<nav>
				{routes.map((route, index) => (
					<NavLink
						key={index}
						to={route.path}
						className={({ isActive }) =>
							`nav-item ${isActive ? "active" : ""} ${route.type ? route.type : ""}`
						}
						title={!isOpen ? route.name : ""} // Tooltip nativo cuando está cerrado
					>
						<span className='icon'>{route.icon}</span>
						{/* Ocultamos el texto si está colapsado */}
						<span
							className='label'
							style={{ display: isOpen ? "block" : "none" }}
						>
							{route.name}
						</span>
					</NavLink>
				))}
			</nav>

			<div className='footer-actions'>
				{/* BOTÓN CERRAR SESIÓN */}
				<button className='logout-btn' onClick={logout} title='Cerrar Sesión'>
					<span className='icon'>
						<FaSignOutAlt />
					</span>
					<span
						className='label'
						style={{ display: isOpen ? "block" : "none" }}
					>
						Cerrar Sesión
					</span>
				</button>

				{isOpen && <p className='copyright'>© 2026 Grupo SP</p>}
			</div>
		</div>
	);
};

export default Sidebar;
