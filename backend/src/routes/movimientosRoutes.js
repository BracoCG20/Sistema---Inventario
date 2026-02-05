const { Router } = require('express');
const router = Router();
const {
  registrarEntrega,
  registrarDevolucion,
} = require('../controllers/movimientosController');

// POST /api/movimientos/entrega
router.post('/entrega', registrarEntrega);

// POST /api/movimientos/devolucion
router.post('/devolucion', registrarDevolucion);

module.exports = router;
