const { Router } = require('express');
const router = Router();
const {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} = require('../controllers/usuariosController');

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;
