const { Router } = require('express');
const router = Router();
const {
  getEquipos,
  createEquipo,
  updateEquipo,
  deactivateEquipo, // <-- Reemplaza a deleteEquipo
  activateEquipo, // <-- Nueva función importada
  getMarcas,
  createMarca,
} = require('../controllers/equiposController');

// --- RUTAS DE MARCAS (Deben ir primero) ---
router.get('/marcas', getMarcas);
router.post('/marcas', createMarca);

// --- RUTAS DE EQUIPOS ---
router.get('/', getEquipos);
router.post('/', createEquipo);
router.put('/:id', updateEquipo);

// --- RUTAS DE ESTADO (BAJA LÓGICA Y REACTIVACIÓN) ---
router.put('/:id/deactivate', deactivateEquipo); // Para dar de baja
router.put('/:id/activate', activateEquipo); // Para reactivar

module.exports = router;
