const { Router } = require('express');
const router = Router();
const { getHistorial } = require('../controllers/historialController');

router.get('/', getHistorial);

module.exports = router;
