const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');
const {
  getAlquileres,
  createAlquiler,
  updateAlquiler,
  deleteAlquiler,
  activateAlquiler,
  uploadFactura,
  deleteFactura,
} = require('../controllers/alquileresController');

// --- CONFIGURACIÓN DE ALMACENAMIENTO PARA FACTURAS/CONTRATOS ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista en la raíz de tu backend
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'factura-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// --- RUTAS PROTEGIDAS ---

// Listar alquileres
router.get('/', verifyToken, getAlquileres);

// Crear y Editar Alquileres (AHORA CON SOPORTE PARA ARCHIVOS)
// Agregamos upload.single("archivo") para que Express sepa leer el FormData
router.post('/', verifyToken, upload.single('archivo'), createAlquiler);
router.put('/:id', verifyToken, upload.single('archivo'), updateAlquiler);

// Cambios de estado (Baja / Reactivar)
router.delete('/:id', verifyToken, deleteAlquiler);
router.put('/:id/activate', verifyToken, activateAlquiler);

// Subida de Archivos Independiente (En caso de que se suba desde la vista previa)
router.post(
  '/:id/subir-factura',
  verifyToken,
  upload.single('archivo'),
  uploadFactura,
);

// Eliminar el archivo adjunto
router.delete('/:id/eliminar-factura', verifyToken, deleteFactura);

module.exports = router;
