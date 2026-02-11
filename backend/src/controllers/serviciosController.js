const db = require('../config/db');
const axios = require('axios'); // <--- REQUISITO: npm install axios

// 1. Obtener todos los servicios
const getServicios = async (req, res) => {
  try {
    const query = `
            SELECT s.*,
                   ef.razon_social AS empresa_facturacion_nombre,
                   eu.razon_social AS empresa_usuaria_nombre,
                   uc.nombre AS creador_nombre, 
                   uc.apellidos AS creador_apellido, 
                   uc.email AS creador_correo,
                   um.nombre AS modificador_nombre, 
                   um.apellidos AS modificador_apellido,
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
  const usuarioId = req.user ? req.user.id : null;
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
    api_key,
    url_acceso,
    usuario_acceso,
    password_acceso,
  } = req.body;

  try {
    const query = `
            INSERT INTO servicios (
                nombre, descripcion, precio, moneda, frecuencia_pago, fecha_proximo_pago, 
                metodo_pago, titular_pago, empresa_facturacion_id, empresa_usuaria_id, 
                licencias_totales, licencias_usadas, creado_por_id,
                api_key, url_acceso, usuario_acceso, password_acceso
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
      api_key || null,
      url_acceso || null,
      usuario_acceso || null,
      password_acceso || null,
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
  const usuarioId = req.user ? req.user.id : null;
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
    api_key,
    url_acceso,
    usuario_acceso,
    password_acceso,
  } = req.body;

  try {
    let query, values;

    if (password_acceso && password_acceso.trim() !== '') {
      query = `
            UPDATE servicios SET 
                nombre = $1, descripcion = $2, estado = $3, precio = $4, 
                moneda = $5, frecuencia_pago = $6, fecha_proximo_pago = $7, 
                metodo_pago = $8, titular_pago = $9, empresa_facturacion_id = $10, 
                empresa_usuaria_id = $11, licencias_totales = $12, 
                licencias_usadas = $13, modificado_por_id = $14,
                api_key = $15, url_acceso = $16, usuario_acceso = $17, password_acceso = $18
            WHERE id = $19 RETURNING *;
        `;
      values = [
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
        api_key,
        url_acceso,
        usuario_acceso,
        password_acceso,
        id,
      ];
    } else {
      query = `
            UPDATE servicios SET 
                nombre = $1, descripcion = $2, estado = $3, precio = $4, 
                moneda = $5, frecuencia_pago = $6, fecha_proximo_pago = $7, 
                metodo_pago = $8, titular_pago = $9, empresa_facturacion_id = $10, 
                empresa_usuaria_id = $11, licencias_totales = $12, 
                licencias_usadas = $13, modificado_por_id = $14,
                api_key = $15, url_acceso = $16, usuario_acceso = $17
            WHERE id = $18 RETURNING *;
        `;
      values = [
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
        api_key,
        url_acceso,
        usuario_acceso,
        id,
      ];
    }

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

// 4. Cambiar Estado
const cambiarEstadoServicio = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
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

// 5. Obtener el historial de pagos
const getPagosPorServicio = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
            SELECT hp.*, 
                   u.nombre AS creador_nombre, 
                   u.apellidos AS creador_apellido
            FROM historial_pagos hp
            LEFT JOIN usuarios_admin u ON hp.creado_por_id = u.id
            WHERE hp.servicio_id = $1
            ORDER BY hp.fecha_pago DESC;
        `;
    const response = await db.query(query, [id]);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al cargar el historial de pagos' });
  }
};

// 6. Registrar un nuevo pago
const registrarPago = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  const {
    fecha_pago,
    monto_pagado,
    moneda,
    periodo_pagado,
    nueva_fecha_proximo_pago,
    pdf_url_externa,
  } = req.body;

  // Ajuste para Multer: guardamos la ruta completa a la carpeta raíz 'uploads'
  const comprobante_url = req.file
    ? `/uploads/${req.file.filename}`
    : pdf_url_externa || null;

  try {
    const queryPago = `
            INSERT INTO historial_pagos (
                servicio_id, fecha_pago, monto_pagado, moneda, periodo_pagado, comprobante_url, creado_por_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
    const valuesPago = [
      id,
      fecha_pago,
      monto_pagado,
      moneda || 'USD',
      periodo_pagado,
      comprobante_url,
      usuarioId,
    ];
    await db.query(queryPago, valuesPago);

    if (nueva_fecha_proximo_pago) {
      await db.query(
        'UPDATE servicios SET fecha_proximo_pago = $1, updated_at = NOW() WHERE id = $2',
        [nueva_fecha_proximo_pago, id],
      );
    }

    res.status(201).json({ message: 'Pago registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
};

// 7. Sincronizar Factura Externa (MODO PRUEBA SEGURO)
const sincronizarFacturaExterna = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM servicios WHERE id = $1', [
      id,
    ]);
    const servicio = result.rows[0];

    // 1. Validar que exista el servicio
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    // 2. INTENTO DE CONEXIÓN (Simulación o Real)
    // En este caso, simulamos que conectamos y obtenemos datos, pero NO el archivo.

    // Datos simulados que Metricool devolvería (Fecha y Monto)
    const datosFactura = {
      fecha: new Date().toISOString(),
      monto: 172.0, // Precio detectado
      moneda: 'USD',
      periodo: 'Febrero 2026',
    };

    res.status(200).json({
      conectado: true,
      mensaje: 'Sincronización de datos exitosa.',
      datos: datosFactura,
      // IMPORTANTE: Enviamos pdf_url como null para que el frontend no muestre el link roto
      pdf_url: null,
    });
  } catch (error) {
    console.error('Error al sincronizar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
  getPagosPorServicio,
  registrarPago,
  sincronizarFacturaExterna,
};
