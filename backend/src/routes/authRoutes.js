const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Importar controladores y middleware
const {
	login,
	getPerfil,
	updatePerfil,
	register,
	getAllUsers,
	toggleUserStatus,
	adminUpdatePassword,
} = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");

// --- CONFIGURACIÓN DE MULTER (Subida de Imágenes) ---

// Crear carpeta uploads si no existe (sube 2 niveles desde src/routes)
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Nombre único: perfil-TIMESTAMP-RANDOM.ext
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, "perfil-" + uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

// --- DEFINICIÓN DE RUTAS ---

// Ruta Pública
router.post("/login", login);

// Rutas Protegidas (Requieren Token)
router.get("/perfil", verifyToken, getPerfil);
router.put("/perfil", verifyToken, upload.single("foto"), updatePerfil);
router.post("/register", verifyToken, register);

router.get("/users", verifyToken, getAllUsers); // Obtener lista
router.put("/users/:id/status", verifyToken, toggleUserStatus); // Activar/Inactivar
router.put("/users/:id/password", verifyToken, adminUpdatePassword); // Cambiar contraseña

module.exports = router;
