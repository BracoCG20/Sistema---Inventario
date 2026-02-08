import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

// Creamos el contexto
export const AuthContext = createContext();

// Hook personalizado para usar el contexto más fácil (ESTO ES IMPORTANTE)
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	// 1. Cargar sesión al iniciar la app
	useEffect(() => {
		const checkUser = () => {
			try {
				const token = localStorage.getItem("token");
				const userData = localStorage.getItem("user_data");

				if (token && userData) {
					// Si hay datos, restauramos la sesión
					setUser(JSON.parse(userData));
				} else {
					// Si no hay datos, aseguramos que el usuario sea null
					setUser(null);
				}
			} catch (error) {
				console.error("Error recuperando sesión:", error);
				localStorage.clear(); // Limpiar si hay datos corruptos
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		checkUser();
	}, []);

	// 2. Función de Login
	const login = async (email, password) => {
		try {
			const res = await api.post("/auth/login", { email, password });

			// Asegúrate que tu backend devuelve { token, user }
			const { token, user } = res.data;

			if (token && user) {
				localStorage.setItem("token", token);
				localStorage.setItem("user_data", JSON.stringify(user));
				setUser(user);
				return { success: true }; // <--- ESTO ES LO QUE ESPERA TU LOGIN.JSX
			}

			return { success: false, message: "Respuesta del servidor inválida" };
		} catch (error) {
			console.error(error);
			return {
				success: false,
				message: error.response?.data?.error || "Error al iniciar sesión",
			};
		}
	};

	// 3. Función de Logout
	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user_data");
		setUser(null);
		// Opcional: Forzar recarga si la redirección falla
		// window.location.href = '/login';
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};
