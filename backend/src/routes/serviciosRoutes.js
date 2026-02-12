const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');

// 1. Middleware de autenticación
const verifyToken = require('../middlewares/authMiddleware');

// 2. Configuración de Multer (Para guardar los PDFs en /uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'comprobante-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// 3. Importamos el Controlador
const {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
  getPagosPorServicio,
  registrarPago,
} = require('../controllers/serviciosController');

// --- RUTAS DE SERVICIOS ---
router.get('/', verifyToken, getServicios);
router.post('/', verifyToken, createServicio);
router.put('/:id', verifyToken, updateServicio);
router.put('/:id/estado', verifyToken, cambiarEstadoServicio);

// --- RUTAS DE HISTORIAL DE PAGOS ---
router.get('/:id/pagos', verifyToken, getPagosPorServicio);

// Registrar pago manual (con subida de archivo)
router.post(
  '/:id/pagos',
  verifyToken,
  upload.single('comprobante'),
  registrarPago,
);

module.exports = router;
