const { Router } = require('express');
const router = Router();
const {
  getUsuarios,
  createUsuario,
} = require('../controllers/usuariosController');

router.get('/', getUsuarios);
router.post('/', createUsuario);

module.exports = router;
