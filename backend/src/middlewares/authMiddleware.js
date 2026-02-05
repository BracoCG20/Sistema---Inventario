const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // El token suele venir en el header: "Authorization: Bearer kjsdhfksjdhf..."
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ error: 'Acceso denegado. No hay token.' });
  }

  // Separamos "Bearer" del token
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Formato de token inválido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'palabra_secreta_super_segura';
    const decoded = jwt.verify(token, secret);

    // Guardamos los datos del usuario en la request para usarlos luego si queremos
    req.user = decoded;

    next(); // ¡Pase usted!
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = verifyToken;
