const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const equiposRoutes = require('./routes/equiposRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const historialRoutes = require('./routes/historialRoutes');

const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middlewares/authMiddleware');

require('dotenv').config();

// Importamos la base de datos
const db = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/equipos', verifyToken, equiposRoutes);
app.use('/api/usuarios', verifyToken, usuariosRoutes);
app.use('/api/movimientos', verifyToken, movimientosRoutes);
app.use('/api/historial', verifyToken, historialRoutes);

// --- RUTA DE PRUEBA DE CONEXIÓN ---
app.get('/test-db', async (req, res) => {
  try {
    // Consulta simple para verificar que responde
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Conexión exitosa a Postgres 🐘',
      hora_servidor: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al conectar con la BD' });
  }
});
// ----------------------------------

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en el puerto ${PORT}`);
});
