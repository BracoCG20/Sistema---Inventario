const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
	registrarEntrega,
	registrarDevolucion,
	obtenerHistorial,
	subirPdfFirmado,
	invalidarFirma,
	registrarEntregaConCorreo,
	registrarDevolucionConCorreo,
} = require("../controllers/movimientosController");

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración Disk (para guardar PDF firmados)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, "firmado-" + uniqueSuffix + path.extname(file.originalname));
	},
});
const upload = multer({ storage: storage });

// Configuración Memoria (para enviar correo al vuelo)
const uploadMem = multer({ storage: multer.memoryStorage() });

// --- RUTAS ---

// Rutas básicas
router.post("/entrega", registrarEntrega);
router.post("/devolucion", registrarDevolucion);
router.get("/", obtenerHistorial);
router.post(
	"/devolucion-con-correo",
	uploadMem.single("pdf"),
	registrarDevolucionConCorreo,
);

// Rutas de archivos (Firma)
router.post("/:id/subir-firmado", upload.single("pdf"), subirPdfFirmado);
router.put("/:id/invalidar", invalidarFirma);

// --- RUTA QUE FALTABA (SOLUCIÓN ERROR 404) ---
router.post(
	"/entrega-con-correo",
	uploadMem.single("pdf"),
	registrarEntregaConCorreo,
);

module.exports = router;
