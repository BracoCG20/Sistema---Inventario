const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');

// 1. Importamos TU middleware de autenticación real
const verifyToken = require('../middlewares/authMiddleware');

// 2. Configuración de Multer (Igual que tus PDFs firmados, pero con prefijo 'comprobante-')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Apuntamos a la carpeta raíz de uploads
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

// --- RUTAS DE SERVICIOS (Protegidas con verifyToken) ---

// Obtener todos los servicios
router.get('/', verifyToken, getServicios);

// Crear un nuevo servicio
router.post('/', verifyToken, createServicio);

// Actualizar un servicio existente
router.put('/:id', verifyToken, updateServicio);

// Cambiar estado (Baja o Reactivación)
router.put('/:id/estado', verifyToken, cambiarEstadoServicio);

// --- RUTAS DE HISTORIAL DE PAGOS (Protegidas con verifyToken) ---

// Obtener historial de pagos de un servicio
router.get('/:id/pagos', verifyToken, getPagosPorServicio);

// Registrar un nuevo pago (soporta subida de PDF/Imagen en el campo 'comprobante')
router.post(
  '/:id/pagos',
  verifyToken,
  upload.single('comprobante'),
  registrarPago,
);

module.exports = router;
