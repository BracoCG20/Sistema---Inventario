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
  // Agregamos fecha_compra al destructuring
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
    // Agregamos la columna fecha_compra
    const newEquipo = await db.query(
      `INSERT INTO equipos (marca, modelo, serie, estado, especificaciones, fecha_compra) 
              VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        marca,
        modelo,
        serie,
        estado || 'operativo',
        especificaciones,
        fecha_compra || null, // Si viene vacío, guarda NULL
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

// 3. Actualizar Equipo
const updateEquipo = async (req, res) => {
  const { id } = req.params;
  // Agregamos fecha_compra al update
  const { marca, modelo, serie, estado, especificaciones, fecha_compra } =
    req.body;

  try {
    await db.query(
      'UPDATE equipos SET marca=$1, modelo=$2, serie=$3, estado=$4, especificaciones=$5, fecha_compra=$6 WHERE id=$7',
      [
        marca,
        modelo,
        serie,
        estado,
        especificaciones,
        fecha_compra || null,
        id,
      ],
    );
    res.json({ message: 'Equipo actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// 4. Eliminar Equipo
const deleteEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM equipos WHERE id = $1', [id]);
    res.json({ message: 'Equipo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'No se puede eliminar (probablemente tiene historial asociado)',
    });
  }
};

module.exports = { getEquipos, createEquipo, updateEquipo, deleteEquipo };
