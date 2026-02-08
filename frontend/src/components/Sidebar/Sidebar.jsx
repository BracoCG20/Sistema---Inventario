import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // <--- 1. AGREGADO useNavigate
import { useAuth } from "../../context/AuthContext";
import {
	FaHome,
	FaLaptop,
	FaUsers,
	FaUndo,
	FaHistory,
	FaSignOutAlt,
	FaBars,
	FaChevronLeft,
	FaCog,
	FaUserCircle,
} from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";

import "./Sidebar.scss";
import logo from "../../assets/logo_gruposp.png";

const Sidebar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { logout } = useAuth();
	const navigate = useNavigate(); // <--- 2. INICIALIZAMOS EL HOOK

	const [user, setUser] = useState({
		nombre: "Usuario",
		email: "",
		foto_url: null,
	});

	useEffect(() => {
		const storedUser = localStorage.getItem("user_data");
		if (storedUser) {
			try {
				setUser(JSON.parse(storedUser));
			} catch (e) {
				console.error(e);
			}
		}
	}, []);

	// --- 3. NUEVA FUNCIÓN PARA CERRAR SESIÓN Y REDIRIGIR ---
	const handleLogout = () => {
		logout(); // Limpia el token y el estado global
		navigate("/login"); // <--- FUERZA LA REDIRECCIÓN
	};

	const routes = [
		{ path: "/", name: "Dashboard", icon: <FaHome /> },
		{ path: "/equipos", name: "Equipos", icon: <FaLaptop /> },
		{ path: "/usuarios", name: "Colaboradores", icon: <FaUsers /> },
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
		{ path: "/configuracion", name: "Configuración", icon: <FaCog /> },
	];

	const avatarUrl = user.foto_url
		? `http://localhost:4000${user.foto_url}`
		: null;

	return (
		<div
			className={`sidebar ${isOpen ? "open" : "collapsed"}`}
			onMouseEnter={() => setIsOpen(true)}
			onMouseLeave={() => setIsOpen(false)}
		>
			<div className='logo-container'>
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
						title={!isOpen ? route.name : ""}
					>
						<div className='icon-wrapper'>{route.icon}</div>
						<span className={`label ${isOpen ? "show" : "hide"}`}>
							{route.name}
						</span>
					</NavLink>
				))}
			</nav>

			<div className='footer-actions'>
				<div className={`user-mini-card ${!isOpen ? "collapsed" : ""}`}>
					<div className='avatar'>
						{avatarUrl ? <img src={avatarUrl} alt='User' /> : <FaUserCircle />}
					</div>
					<div className={`info ${isOpen ? "show" : "hide"}`}>
						<span className='name'>{user.nombre}</span>
						<span className='email' title={user.email}>
							{user.email}
						</span>
					</div>
				</div>

				<button
					className={`logout-btn ${!isOpen ? "collapsed" : ""}`}
					onClick={handleLogout} // <--- 4. USAMOS LA NUEVA FUNCIÓN AQUÍ
					title='Cerrar Sesión'
				>
					<span className='icon-wrapper'>
						<FaSignOutAlt />
					</span>
					<span className={`label ${isOpen ? "show" : "hide"}`}>
						Cerrar Sesión
					</span>
				</button>

				{isOpen && <p className='copyright'>© 2026 Grupo SP</p>}
			</div>
		</div>
	);
};

export default Sidebar;
