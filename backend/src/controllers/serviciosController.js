const db = require('../config/db');

// 1. Obtener todos los servicios (Con datos cruzados de auditoría y empresas)
const getServicios = async (req, res) => {
  try {
    const query = `
            SELECT s.*,
                   ef.razon_social AS empresa_facturacion_nombre,
                   eu.razon_social AS empresa_usuaria_nombre,
                   uc.nombre AS creador_nombre, 
                   uc.apellidos AS creador_apellido, 
                   uc.email AS creador_correo, -- <--- AQUÍ ESTABA EL ERROR (cambiado de correo a email)
                   um.nombre AS modificador_nombre, 
                   um.apellidos AS modificador_apellido,
                   -- Calculamos licencias libres al vuelo
                   (s.licencias_totales - s.licencias_usadas) AS licencias_libres
            FROM servicios s
            LEFT JOIN empresas ef ON s.empresa_facturacion_id = ef.id
            LEFT JOIN empresas eu ON s.empresa_usuaria_id = eu.id
            LEFT JOIN usuarios_admin uc ON s.creado_por_id = uc.id
            LEFT JOIN usuarios_admin um ON s.modificado_por_id = um.id
            ORDER BY s.created_at DESC;
        `;
    const response = await db.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al cargar los servicios' });
  }
};

// 2. Crear un nuevo servicio
const createServicio = async (req, res) => {
  const usuarioId = req.user ? req.user.id : null; // Quién lo registra
  const {
    nombre,
    descripcion,
    precio,
    moneda,
    frecuencia_pago,
    fecha_proximo_pago,
    metodo_pago,
    titular_pago,
    empresa_facturacion_id,
    empresa_usuaria_id,
    licencias_totales,
    licencias_usadas,
  } = req.body;

  try {
    const query = `
            INSERT INTO servicios (
                nombre, descripcion, precio, moneda, frecuencia_pago, fecha_proximo_pago, 
                metodo_pago, titular_pago, empresa_facturacion_id, empresa_usuaria_id, 
                licencias_totales, licencias_usadas, creado_por_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
    const values = [
      nombre,
      descripcion,
      precio || 0,
      moneda || 'USD',
      frecuencia_pago,
      fecha_proximo_pago || null,
      metodo_pago,
      titular_pago,
      empresa_facturacion_id || null,
      empresa_usuaria_id || null,
      licencias_totales || 0,
      licencias_usadas || 0,
      usuarioId,
    ];

    const response = await db.query(query, values);
    res
      .status(201)
      .json({ message: 'Servicio registrado', servicio: response.rows[0] });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al registrar el servicio' });
  }
};

// 3. Actualizar un servicio
const updateServicio = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null; // Quién lo modifica
  const {
    nombre,
    descripcion,
    estado,
    precio,
    moneda,
    frecuencia_pago,
    fecha_proximo_pago,
    metodo_pago,
    titular_pago,
    empresa_facturacion_id,
    empresa_usuaria_id,
    licencias_totales,
    licencias_usadas,
  } = req.body;

  try {
    const query = `
            UPDATE servicios SET 
                nombre = $1, descripcion = $2, estado = $3, precio = $4, 
                moneda = $5, frecuencia_pago = $6, fecha_proximo_pago = $7, 
                metodo_pago = $8, titular_pago = $9, empresa_facturacion_id = $10, 
                empresa_usuaria_id = $11, licencias_totales = $12, 
                licencias_usadas = $13, modificado_por_id = $14
            WHERE id = $15 RETURNING *;
        `;
    const values = [
      nombre,
      descripcion,
      estado,
      precio,
      moneda,
      frecuencia_pago,
      fecha_proximo_pago || null,
      metodo_pago,
      titular_pago,
      empresa_facturacion_id || null,
      empresa_usuaria_id || null,
      licencias_totales || 0,
      licencias_usadas || 0,
      usuarioId,
      id,
    ];

    const response = await db.query(query, values);
    if (response.rowCount === 0)
      return res.status(404).json({ error: 'Servicio no encontrado' });

    res
      .status(200)
      .json({ message: 'Servicio actualizado', servicio: response.rows[0] });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar el servicio' });
  }
};

// 4. Cambiar Estado (Baja Lógica en lugar de eliminar)
const cambiarEstadoServicio = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // Puede ser 'Inactivo', 'Cancelado', 'Activo'
  const usuarioId = req.user ? req.user.id : null;

  try {
    await db.query(
      'UPDATE servicios SET estado = $1, modificado_por_id = $2 WHERE id = $3',
      [estado, usuarioId, id],
    );
    res.status(200).json({ message: `El servicio ahora está ${estado}` });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del servicio' });
  }
};

module.exports = {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
};
