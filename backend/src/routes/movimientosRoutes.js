const { Router } = require("express");
const router = Router();
const {
	registrarEntrega,
	registrarDevolucion,
	obtenerHistorial,
} = require("../controllers/movimientosController");

// POST /api/movimientos/entrega
router.post("/entrega", registrarEntrega);

// POST /api/movimientos/devolucion
router.post("/devolucion", registrarDevolucion);

// GET /api/movimientos (o /api/historial según cómo lo montes en index.js)
// Esto devuelve todo el historial con los nombres de empleados y equipos
router.get("/", obtenerHistorial);

module.exports = router;
