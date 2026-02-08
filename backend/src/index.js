const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// Importar rutas
const equiposRoutes = require("./routes/equiposRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const movimientosRoutes = require("./routes/movimientosRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");

// Middleware de autenticación
const verifyToken = require("./middlewares/authMiddleware");

require("dotenv").config();

// Importamos la base de datos
const db = require("./config/db");

const app = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// --- RUTAS PÚBLICAS ---
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));

// --- RUTAS PROTEGIDAS ---
app.use("/api/equipos", verifyToken, equiposRoutes);
app.use("/api/usuarios", verifyToken, usuariosRoutes);

// Movimientos e Historial (usan el mismo controlador)
app.use("/api/movimientos", verifyToken, movimientosRoutes);
app.use("/api/historial", verifyToken, movimientosRoutes);

// Notificaciones (Correo y WhatsApp)
app.use("/api/notificaciones", verifyToken, notificationRoutes);

// --- RUTA DE PRUEBA DE CONEXIÓN ---
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

// 2. Iniciar Servidor Express
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`\n🚀 Servidor corriendo en el puerto ${PORT}`);
});
