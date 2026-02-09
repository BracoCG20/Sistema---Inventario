const { Router } = require('express');
const router = Router();
const {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getMarcas, // Importar
  createMarca, // Importar
} = require('../controllers/equiposController');

// --- RUTAS DE MARCAS (Deben ir primero) ---
router.get('/marcas', getMarcas);
router.post('/marcas', createMarca);

// --- RUTAS DE EQUIPOS ---
router.get('/', getEquipos);
router.post('/', createEquipo);
router.put('/:id', updateEquipo);
router.delete('/:id', deleteEquipo);

module.exports = router;
