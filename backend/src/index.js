const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config(); // Es buena práctica cargarlo al inicio

// --- IMPORTAR BASE DE DATOS ---
const db = require("./config/db");

// --- IMPORTAR RUTAS ---
// Rutas existentes (carpeta /routes)
const authRoutes = require("./routes/authRoutes");
const equiposRoutes = require("./routes/equiposRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const movimientosRoutes = require("./routes/movimientosRoutes");
const empresasRoutes = require("./routes/empresasRoutes");
const serviciosRoutes = require("./routes/serviciosRoutes");
const proveedoresRoutes = require("./routes/proveedoresRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const alquileresRoutes = require("./routes/alquileresRoutes");

// Nuevas rutas (carpeta /src/routes)
// Nota: Si moviste el archivo a la carpeta 'routes' normal, quita el 'src/'
const clientesRoutes = require("./routes/clientesRoutes");

// --- MIDDLEWARE DE SEGURIDAD ---
const verifyToken = require("./middlewares/authMiddleware");

// --- INICIALIZAR APP ---
const app = express();

// --- MIDDLEWARES GLOBALES ---
app.use(cors());
app.use(morgan("dev")); // Logger de peticiones en consola
app.use(express.json()); // Para leer JSON en el body de las peticiones

// --- ARCHIVOS ESTÁTICOS (FOTOS) ---
app.use("/uploads", express.static("uploads"));

// ================= RUTAS DE LA API =================

// 1. Autenticación (Pública)
app.use("/api/auth", authRoutes);

// 2. Gestión de Inventario y RRHH (Protegidas)
app.use("/api/equipos", verifyToken, equiposRoutes);
app.use("/api/usuarios", verifyToken, usuariosRoutes);
app.use("/api/proveedores", verifyToken, proveedoresRoutes);
app.use("/api/empresas", verifyToken, empresasRoutes); // Empresas internas/facturación
app.use("/api/servicios", verifyToken, serviciosRoutes);

// 3. Renta de Equipos (Protegidas)
app.use("/api/alquileres", verifyToken, alquileresRoutes);
app.use("/api/clientes", verifyToken, clientesRoutes); // <--- NUEVO: Clientes externos

// 4. Operaciones y Trazabilidad (Protegidas)
// Movimientos e Historial comparten controlador
app.use("/api/movimientos", verifyToken, movimientosRoutes);
app.use("/api/historial", verifyToken, movimientosRoutes);

// 5. Utilidades (Protegidas)
app.use("/api/notificaciones", verifyToken, notificationRoutes);

// ===================================================

// --- RUTA DE PRUEBA DE BASE DE DATOS ---
app.get("/test-db", async (req, res) => {
	try {
		const result = await db.query("SELECT NOW()");
		res.json({
			message: "Conexión exitosa a Postgres 🐘",
			hora_servidor: result.rows[0].now,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al conectar con la BD" });
	}
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`\n🚀 Servidor corriendo en el puerto ${PORT}`);
	console.log(`📡 API lista en: http://localhost:${PORT}/api`);
});
