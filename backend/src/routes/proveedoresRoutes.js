const { Router } = require('express');
const router = Router();
const verifyToken = require('../middlewares/authMiddleware');
const {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  activateProveedor, // Importar nueva función
} = require('../controllers/proveedoresController');

// Todas las rutas protegidas
router.get('/', verifyToken, getProveedores);
router.post('/', verifyToken, createProveedor);
router.put('/:id', verifyToken, updateProveedor);
router.delete('/:id', verifyToken, deleteProveedor);
router.put('/:id/activate', verifyToken, activateProveedor); // Nueva ruta

module.exports = router;
