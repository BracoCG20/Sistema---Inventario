const { Router } = require('express');
const router = Router();
const {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} = require('../controllers/equiposController');

router.get('/', getEquipos);
router.post('/', createEquipo);
router.put('/:id', updateEquipo);
router.delete('/:id', deleteEquipo);

module.exports = router;
