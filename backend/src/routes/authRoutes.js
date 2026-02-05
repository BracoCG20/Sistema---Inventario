const { Router } = require('express');
const router = Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

module.exports = router;
