import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Contexto de Autenticación
import { AuthProvider } from "./context/AuthContext";

// Layout Principal
import MainLayout from "./layout/MainLayout"; // Asegúrate de que esta ruta sea correcta según tu estructura

// Páginas (Módulos)
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Equipos from "./pages/Equipos/Equipos";
import Usuarios from "./pages/Usuarios/Usuarios";
import Proveedores from "./pages/Proveedores/Proveedores";
import Servicios from "./pages/Servicios/Servicios";
import Alquileres from "./pages/Alquileres/Alquileres";
import Entrega from "./pages/Entrega/Entrega";
import Devolucion from "./pages/Devolucion/Devolucion";
import Historial from "./pages/Historial/Historial";
import Configuracion from "./pages/Configuracion/Configuracion";

function App() {
	return (
		<BrowserRouter>
			{/* Proveedor de Autenticación envolviendo toda la app */}
			<AuthProvider>
				<Routes>
					{/* Ruta Pública: Login */}
					<Route path='/login' element={<Login />} />

					{/* Rutas Protegidas (Dentro del Layout con Sidebar) */}
					<Route path='/' element={<MainLayout />}>
						<Route index element={<Dashboard />} />

						{/* Gestión Principal */}
						<Route path='equipos' element={<Equipos />} />
						<Route path='usuarios' element={<Usuarios />} />
						<Route path='proveedores' element={<Proveedores />} />
						<Route path='servicios' element={<Servicios />} />

						{/* Nueva Sección: Renta de Equipos */}
						<Route path='alquileres' element={<Alquileres />} />

						{/* Operaciones */}
						<Route path='entrega' element={<Entrega />} />
						<Route path='devolucion' element={<Devolucion />} />

						{/* Reportes y Configuración */}
						<Route path='historial' element={<Historial />} />
						<Route path='configuracion' element={<Configuracion />} />
					</Route>

					{/* Redirección por defecto para rutas no encontradas */}
					<Route path='*' element={<Navigate to='/' />} />
				</Routes>

				{/* Notificaciones Globales (Toastify) */}
				<ToastContainer position='top-right' autoClose={3000} />
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
