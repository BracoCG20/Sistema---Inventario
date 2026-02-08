import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:4000/api", // Asegúrate de que este puerto sea el correcto
});

// --- INTERCEPTOR MÁGICO ---
// Antes de enviar cualquier petición, ejecuta esto:
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			// Agregamos el token a la cabecera Authorization
			// El formato estándar es "Bearer <token>"
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export default api;
