import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode"; // Asegúrate de importar esto así (versiones nuevas) o jwt_decode
import { toast } from "react-toastify";
import api from "../services/api";

export const AuthContext = createContext();

export const useAuth = () => {
	return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// Verificar sesión al cargar la página
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decoded = jwtDecode(token);

				// Verificar expiración (exp viene en segundos)
				const currentTime = Date.now() / 1000;
				if (decoded.exp < currentTime) {
					logout(); // Si expiró, limpiamos
				} else {
					// Restauramos el usuario desde el token
					setUser({
						id: decoded.id,
						role: decoded.role,
						// Nota: El token no suele tener el nombre para ahorrar espacio,
						// pero si lo necesitas visualmente puedes guardarlo en localStorage separado
						// o decodificar lo que hayas puesto en el payload.
						// Por ahora, con ID y Rol basta para permisos.
					});
				}
			} catch (error) {
				logout();
			}
		}
		setLoading(false);
	}, []);

	const login = async (email, password) => {
		try {
			const res = await api.post("/auth/login", { email, password });
			const { token, user: userData } = res.data; // userData viene del backend con nombre y rol

			localStorage.setItem("token", token);

			// Guardamos en el estado todos los datos que devolvió el backend
			setUser(userData);

			toast.success(res.data.message); // "Bienvenido..."
			return true;
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al iniciar sesión");
			return false;
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
		// Opcional: toast.info('Sesión cerrada');
		// window.location.href = '/login'; // O dejar que ProtectedRoute maneje la redirección
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};
