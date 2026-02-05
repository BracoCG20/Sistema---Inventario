const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const result = await db.query(
      'SELECT * FROM usuarios_admin WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // 2. Comparar contraseña (la que envían vs la encriptada en DB)
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar Token JWT
    // IMPORTANTE: En producción, usa una palabra secreta larga en tu .env
    const secret = process.env.JWT_SECRET || 'palabra_secreta_super_segura';

    const token = jwt.sign(
      { id: user.id, role: 'admin' }, // Payload (datos dentro del token)
      secret,
      { expiresIn: '8h' }, // El token expira en 8 horas
    );

    res.json({
      message: 'Bienvenido',
      token,
      user: { id: user.id, nombre: user.nombre },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { login };
