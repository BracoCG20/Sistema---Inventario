const db = require('../config/db');

// 1. Obtener todos los equipos (ACTUALIZADO CON PROVEEDOR)
const getEquipos = async (req, res) => {
  try {
    const query = `
      SELECT e.*, 
             ua.nombre as creador_nombre, 
             ua.email as creador_email,
             ua.empresa as creador_empresa,
             ua.nombre as modificador_nombre, 
             ua.fecha_modificacion as fecha_modificacion_admin,
             AGE(CURRENT_DATE, COALESCE(e.fecha_compra, e.created_at)) as antiguedad_obj,
             COALESCE(e.ultima_observacion, 'Sin observaciones') as ultima_observacion,
             
             -- NUEVO: Datos del proveedor
             p.razon_social as nombre_proveedor,
             p.telefono as telefono_proveedor

      FROM equipos e
      LEFT JOIN usuarios_admin ua ON e.creado_por_id = ua.id
      LEFT JOIN proveedores p ON e.proveedor_id = p.id -- <--- EL JOIN MÁGICO
      ORDER BY e.created_at DESC
    `;
    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error SQL:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear un nuevo equipo (ACTUALIZADO)
const createEquipo = async (req, res) => {
  const creadoPor = req.user ? req.user.id : null;
  // Agregamos proveedor_id y fecha_fin_alquiler
  const {
    marca,
    modelo,
    serie,
    estado,
    especificaciones,
    fecha_compra,
    ultima_observacion,
    proveedor_id,
    fecha_fin_alquiler,
  } = req.body;

  try {
    const checkSerie = await db.query(
      'SELECT * FROM equipos WHERE serie = $1',
      [serie],
    );
    if (checkSerie.rows.length > 0) {
      return res.status(400).json({ error: 'El número de serie ya existe.' });
    }

    const newEquipo = await db.query(
      `INSERT INTO equipos 
       (marca, modelo, serie, estado, especificaciones, fecha_compra, creado_por_id, ultima_observacion, proveedor_id, fecha_fin_alquiler) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        marca,
        modelo,
        serie,
        estado || 'operativo',
        especificaciones,
        fecha_compra || null,
        creadoPor,
        ultima_observacion || null,
        proveedor_id || null, // <--- NUEVO
        fecha_fin_alquiler || null, // <--- NUEVO
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

// 3. Actualizar Equipo (ACTUALIZADO)
const updateEquipo = async (req, res) => {
  const { id } = req.params;
  const {
    marca,
    modelo,
    serie,
    estado,
    especificaciones,
    fecha_compra,
    ultima_observacion,
    proveedor_id,
    fecha_fin_alquiler,
  } = req.body;

  try {
    await db.query(
      `UPDATE equipos SET 
          marca=$1, 
          modelo=$2, 
          serie=$3, 
          estado=$4, 
          especificaciones=$5, 
          fecha_compra=$6,
          ultima_observacion=$7,
          proveedor_id=$8,         -- <--- NUEVO
          fecha_fin_alquiler=$9    -- <--- NUEVO
       WHERE id=$10`,
      [
        marca,
        modelo,
        serie,
        estado,
        especificaciones,
        fecha_compra || null,
        ultima_observacion || null,
        proveedor_id || null, // <--- NUEVO
        fecha_fin_alquiler || null, // <--- NUEVO
        id,
      ],
    );
    res.json({ message: 'Equipo actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// 4. ELIMINADA: La eliminación física fue reemplazada por la baja lógica.

// 5. NUEVO: Dar de Baja Equipo (Baja Lógica)
const deactivateEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE equipos SET activo = false WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo dado de baja correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar el equipo' });
  }
};

// 6. NUEVO: Reactivar Equipo
const activateEquipo = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE equipos SET activo = true WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo reactivado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reactivar el equipo' });
  }
};

// --- FUNCIONES PARA MARCAS ---

// 7. Obtener Marcas
const getMarcas = async (req, res) => {
  try {
    const response = await db.query('SELECT * FROM marcas ORDER BY nombre ASC');
    res.json(response.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar marcas' });
  }
};

// 8. Crear Marca
const createMarca = async (req, res) => {
  const { nombre } = req.body;
  try {
    const check = await db.query('SELECT * FROM marcas WHERE nombre = $1', [
      nombre.toUpperCase(),
    ]);

    if (check.rows.length > 0) {
      return res.json(check.rows[0]);
    }

    const newMarca = await db.query(
      'INSERT INTO marcas (nombre) VALUES ($1) RETURNING *',
      [nombre.toUpperCase()],
    );
    res.json(newMarca.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear marca' });
  }
};

module.exports = {
  getEquipos,
  createEquipo,
  updateEquipo,
  deactivateEquipo, // <-- Exportamos la función de baja
  activateEquipo, // <-- Exportamos la función de reactivación
  getMarcas,
  createMarca,
};
