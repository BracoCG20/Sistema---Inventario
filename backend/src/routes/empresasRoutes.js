const { Router } = require('express');
const router = Router();
const {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa, // Inactivar (baja lógica)
  activateEmpresa, // Reactivar
} = require('../controllers/empresasController');

// Rutas base: /api/empresas
router.get('/', getEmpresas);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa); // Inactivar
router.put('/:id/activate', activateEmpresa); // Reactivar

module.exports = router;
