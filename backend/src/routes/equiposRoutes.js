const { Router } = require('express');
const router = Router();
const {
  getEquipos,
  createEquipo,
} = require('../controllers/equiposController');

router.get('/', getEquipos);
router.post('/', createEquipo);

module.exports = router;
