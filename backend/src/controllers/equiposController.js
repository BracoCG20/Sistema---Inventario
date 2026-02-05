const db = require('../config/db');

// 1. Obtener todos los equipos
const getEquipos = async (req, res) => {
  try {
    const response = await db.query(
      'SELECT * FROM equipos ORDER BY created_at DESC',
    );
    res.status(200).json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

// 2. Crear un nuevo equipo
const createEquipo = async (req, res) => {
  // Desestructuramos lo que envía el Frontend
  const { marca, modelo, serie, estado, especificaciones, fecha_compra } =
    req.body;

  try {
    // Validamos duplicados de serie antes de insertar
    const checkSerie = await db.query(
      'SELECT * FROM equipos WHERE serie = $1',
      [serie],
    );
    if (checkSerie.rows.length > 0) {
      return res.status(400).json({ error: 'El número de serie ya existe.' });
    }

    // Insertamos
    // Nota: 'especificaciones' debe llegar como un objeto JSON desde el frontend
    const newEquipo = await db.query(
      `INSERT INTO equipos (marca, modelo, serie, estado, especificaciones, fecha_compra) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        marca,
        modelo,
        serie,
        estado || 'operativo',
        especificaciones,
        fecha_compra,
      ],
    );

    res.status(201).json({
      message: 'Equipo registrado correctamente',
      equipo: newEquipo.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el equipo' });
  }
};

module.exports = {
  getEquipos,
  createEquipo,
};
