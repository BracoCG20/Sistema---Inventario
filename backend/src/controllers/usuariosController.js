const db = require('../config/db');

// 1. Obtener todos los empleados (Activos)
const getUsuarios = async (req, res) => {
  try {
    const response = await db.query(
      'SELECT * FROM empleados ORDER BY apellidos ASC',
    );
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// 2. Registrar un nuevo empleado
const createUsuario = async (req, res) => {
  const { dni, nombres, apellidos, correo, empresa, cargo } = req.body;

  try {
    // Validación básica: DNI duplicado
    const checkDni = await db.query('SELECT * FROM empleados WHERE dni = $1', [
      dni,
    ]);
    if (checkDni.rows.length > 0) {
      return res.status(400).json({ error: 'El DNI ya está registrado.' });
    }

    const newUsuario = await db.query(
      `INSERT INTO empleados (dni, nombres, apellidos, correo, empresa, cargo) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [dni, nombres, apellidos, correo, empresa, cargo],
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: newUsuario.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
};
