const { Router } = require('express');
const router = Router();
const {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
} = require('../controllers/serviciosController');

// --- RUTAS DE SERVICIOS ---

// Obtener todos los servicios
router.get('/', getServicios);

// Crear un nuevo servicio
router.post('/', createServicio);

// Actualizar un servicio existente
router.put('/:id', updateServicio);

// Cambiar estado (Baja o Reactivación)
// Se espera que el body sea { "estado": "Cancelado" }
router.put('/:id/estado', cambiarEstadoServicio);

module.exports = router;
