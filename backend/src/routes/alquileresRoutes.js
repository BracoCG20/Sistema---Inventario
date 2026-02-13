const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");
const verifyToken = require("../middlewares/authMiddleware");
const {
	getAlquileres,
	createAlquiler,
	updateAlquiler,
	deleteAlquiler,
	activateAlquiler,
	uploadFactura,
	deleteFactura,
} = require("../controllers/alquileresController");

// --- CONFIGURACIÓN DE ALMACENAMIENTO PARA FACTURAS ---
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/"); // Asegúrate de que esta carpeta exista
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, "factura-" + uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

// --- RUTAS PROTEGIDAS ---

// Listar y Crear
router.get("/", verifyToken, getAlquileres);
router.post("/", verifyToken, createAlquiler);

// Editar y Estados
router.put("/:id", verifyToken, updateAlquiler);
router.delete("/:id", verifyToken, deleteAlquiler);
router.put("/:id/activate", verifyToken, activateAlquiler);

// Subida de Archivos (Facturas)
// El campo 'archivo' debe coincidir con el FormData del Frontend
router.post(
	"/:id/subir-factura",
	verifyToken,
	upload.single("archivo"),
	uploadFactura,
);
router.post(
	"/:id/subir-factura",
	verifyToken,
	upload.single("archivo"),
	uploadFactura,
);
router.delete("/:id/eliminar-factura", verifyToken, deleteFactura);

module.exports = router;
