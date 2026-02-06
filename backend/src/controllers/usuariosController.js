const db = require('../config/db');

// 1. Obtener todos los usuarios (empleados)
const getUsuarios = async (req, res) => {
  try {
    // CAMBIO: 'FROM usuarios' -> 'FROM empleados'
    const response = await db.query(
      'SELECT * FROM empleados ORDER BY nombres ASC',
    );
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// 2. Crear usuario
const createUsuario = async (req, res) => {
  const { dni, nombres, apellidos, correo, empresa, cargo, genero, telefono } =
    req.body;

  try {
    // CAMBIO: 'INSERT INTO usuarios' -> 'INSERT INTO empleados'
    const newUser = await db.query(
      'INSERT INTO empleados (dni, nombres, apellidos, correo, empresa, cargo, genero, telefono) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [dni, nombres, apellidos, correo, empresa, cargo, genero, telefono],
    );
    res.json(newUser.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// 3. Actualizar usuario
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { dni, nombres, apellidos, correo, empresa, cargo, genero, telefono } =
    req.body;

  try {
    // CAMBIO: 'UPDATE usuarios' -> 'UPDATE empleados'
    const result = await db.query(
      'UPDATE empleados SET dni=$1, nombres=$2, apellidos=$3, correo=$4, empresa=$5, cargo=$6, genero=$7, telefono=$8 WHERE id=$9 RETURNING *',
      [dni, nombres, apellidos, correo, empresa, cargo, genero, telefono, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado correctamente',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('Error SQL:', error.message);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// 4. Eliminar (Soft Delete)
const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    // CAMBIO CRÍTICO AQUÍ: 'UPDATE usuarios' -> 'UPDATE empleados'
    // El error 42P01 salía aquí porque buscaba la tabla 'usuarios'
    const result = await db.query(
      'UPDATE empleados SET activo = false WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario dado de baja correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

module.exports = { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
