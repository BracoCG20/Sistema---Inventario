const db = require('../config/db');

// 1. OBTENER TODOS LOS ALQUILERES
const getAlquileres = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*,
        e.marca, e.modelo, e.serie,
        u1.nombre as creador_nombre,
        u2.nombre as modificador_nombre
      FROM alquileres_equipos a
      JOIN equipos e ON a.equipo_id = e.id
      LEFT JOIN usuarios_admin u1 ON a.created_by_id = u1.id
      LEFT JOIN usuarios_admin u2 ON a.updated_by_id = u2.id
      ORDER BY 
        CASE WHEN a.estado = 'Activo' THEN 1 ELSE 2 END,
        a.fecha_inicio DESC
    `;
    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener alquileres:', error);
    res.status(500).json({ error: 'Error al cargar el historial' });
  }
};

// 2. REGISTRAR UN NUEVO ALQUILER (ACTUALIZADO CON ARCHIVO)
const createAlquiler = async (req, res) => {
  const usuarioId = req.user ? req.user.id : null;
  const {
    equipo_id,
    cliente_nombre,
    cliente_documento,
    cliente_telefono,
    precio_alquiler,
    moneda,
    frecuencia_pago,
    fecha_inicio,
    fecha_fin,
    observaciones,
  } = req.body;

  // Capturamos el nombre del archivo si multer lo procesó
  const archivoUrl = req.file ? req.file.filename : null;

  try {
    // Verificar que el equipo sea propio y operativo
    const checkEquipo = await db.query(
      'SELECT proveedor_id FROM equipos WHERE id = $1',
      [equipo_id],
    );

    if (checkEquipo.rows.length === 0)
      return res.status(404).json({ error: 'Equipo no encontrado' });
    if (checkEquipo.rows[0].proveedor_id !== null)
      return res
        .status(400)
        .json({ error: 'Este equipo pertenece a un proveedor externo.' });

    // VERIFICAR SI YA ESTÁ ALQUILADO
    const checkOcupado = await db.query(
      `SELECT id FROM alquileres_equipos 
             WHERE equipo_id = $1 
             AND estado = 'Activo' 
             AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)`,
      [equipo_id],
    );

    if (checkOcupado.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Este equipo ya se encuentra alquilado actualmente.' });
    }

    const query = `
            INSERT INTO alquileres_equipos 
            (equipo_id, cliente_nombre, cliente_documento, cliente_telefono, precio_alquiler, moneda, frecuencia_pago, fecha_inicio, fecha_fin, observaciones, created_by_id, estado, factura_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Activo', $12)
            RETURNING *
        `;
    const values = [
      equipo_id,
      cliente_nombre,
      cliente_documento || null,
      cliente_telefono || null,
      precio_alquiler,
      moneda,
      frecuencia_pago,
      fecha_inicio,
      fecha_fin || null,
      observaciones || null,
      usuarioId,
      archivoUrl, // <-- AQUÍ SE GUARDA EL ARCHIVO
    ];

    const newAlquiler = await db.query(query, values);
    res.status(201).json({
      message: 'Contrato registrado exitosamente',
      alquiler: newAlquiler.rows[0],
    });
  } catch (error) {
    console.error('Error al crear:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 3. EDITAR DATOS (ACTUALIZADO CON PROTECCIÓN DE NULOS Y SIN ESTADO)
const updateAlquiler = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;

  const {
    cliente_nombre,
    cliente_documento,
    cliente_telefono,
    precio_alquiler,
    moneda,
    frecuencia_pago,
    fecha_inicio,
    fecha_fin,
    observaciones, // Ya NO traemos "estado" porque el formulario no lo envía
  } = req.body;

  // Si subió un archivo nuevo al editar, lo capturamos
  const archivoUrl = req.file ? req.file.filename : null;

  try {
    // Limpiamos los valores vacíos ("") convirtiéndolos en null para que Postgres no dé error 500
    const docSeguro = cliente_documento || null;
    const telSeguro = cliente_telefono || null;
    const finSeguro = fecha_fin || null;
    const obsSegura = observaciones || null;

    let query, values;

    if (archivoUrl) {
      // Actualizamos todo, incluyendo el nuevo documento
      query = `
              UPDATE alquileres_equipos SET 
                cliente_nombre=$1, cliente_documento=$2, cliente_telefono=$3, precio_alquiler=$4, 
                moneda=$5, frecuencia_pago=$6, fecha_inicio=$7, fecha_fin=$8, 
                observaciones=$9, updated_at=NOW(), updated_by_id=$10, factura_url=$11
              WHERE id=$12 RETURNING *
            `;
      values = [
        cliente_nombre,
        docSeguro,
        telSeguro,
        precio_alquiler,
        moneda,
        frecuencia_pago,
        fecha_inicio,
        finSeguro,
        obsSegura,
        usuarioId,
        archivoUrl,
        id,
      ];
    } else {
      // Actualizamos todo, manteniendo el documento que ya tenía antes
      query = `
              UPDATE alquileres_equipos SET 
                cliente_nombre=$1, cliente_documento=$2, cliente_telefono=$3, precio_alquiler=$4, 
                moneda=$5, frecuencia_pago=$6, fecha_inicio=$7, fecha_fin=$8, 
                observaciones=$9, updated_at=NOW(), updated_by_id=$10
              WHERE id=$11 RETURNING *
            `;
      values = [
        cliente_nombre,
        docSeguro,
        telSeguro,
        precio_alquiler,
        moneda,
        frecuencia_pago,
        fecha_inicio,
        finSeguro,
        obsSegura,
        usuarioId,
        id,
      ];
    }

    const result = await db.query(query, values);

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'No se encontró el contrato' });

    res.json({ message: 'Contrato actualizado correctamente' });
  } catch (error) {
    console.error('Error al editar:', error);
    res.status(500).json({ error: 'Error al actualizar la base de datos' });
  }
};

// ... (El resto de las funciones: deleteAlquiler, activateAlquiler, uploadFactura y deleteFactura se mantienen idénticas a tu código original) ...
const deleteAlquiler = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  try {
    await db.query(
      `UPDATE alquileres_equipos SET estado = 'Cancelado', updated_at = NOW(), updated_by_id = $1 WHERE id = $2`,
      [usuarioId, id],
    );
    res.json({ message: 'Contrato cancelado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar' });
  }
};

const activateAlquiler = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  try {
    await db.query(
      `UPDATE alquileres_equipos SET estado = 'Activo', updated_at = NOW(), updated_by_id = $1 WHERE id = $2`,
      [usuarioId, id],
    );
    res.json({ message: 'Contrato reactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reactivar' });
  }
};

const uploadFactura = async (req, res) => {
  const { id } = req.params;
  const archivo = req.file ? req.file.filename : null;
  if (!archivo)
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  try {
    const result = await db.query(
      'UPDATE alquileres_equipos SET factura_url = $1 WHERE id = $2 RETURNING *',
      [archivo, id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ error: 'No se encontró el registro de alquiler' });
    res.json({ message: 'Documento subido con éxito', factura_url: archivo });
  } catch (error) {
    console.error('Error subida BD:', error);
    res
      .status(500)
      .json({ error: 'Error al registrar el archivo en la base de datos' });
  }
};

const deleteFactura = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE alquileres_equipos SET factura_url = NULL WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'No se encontró el contrato' });
    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
};

module.exports = {
  getAlquileres,
  createAlquiler,
  updateAlquiler,
  deleteAlquiler,
  activateAlquiler,
  uploadFactura,
  deleteFactura,
};
