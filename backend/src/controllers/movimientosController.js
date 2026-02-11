const db = require("../config/db");
const transporter = require("../config/mailer");
const path = require("path");

// --- 1. REGISTRAR ENTREGA ---
const registrarEntrega = async (req, res) => {
	const adminId = req.user ? req.user.id : null;
	const { equipo_id, empleado_id, fecha, cargador, observaciones } = req.body;
	const client = await db.pool.connect();

	try {
		await client.query("BEGIN");

		const checkEquipo = await client.query(
			"SELECT disponible FROM equipos WHERE id = $1",
			[equipo_id],
		);
		if (checkEquipo.rows.length === 0) throw new Error("Equipo no encontrado");
		if (checkEquipo.rows[0].disponible === false)
			throw new Error("El equipo ya está asignado");

		const insertMov = `
        INSERT INTO movimientos 
        (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones, correo_enviado, registrado_por_id)
        VALUES ($1, $2, 'entrega', $3, $4, $5, NULL, $6)
        RETURNING id
    `;

		const movResult = await client.query(insertMov, [
			equipo_id,
			empleado_id,
			fecha,
			cargador,
			observaciones,
			adminId,
		]);

		await client.query("UPDATE equipos SET disponible = false WHERE id = $1", [
			equipo_id,
		]);
		await client.query("COMMIT");

		res.status(201).json({
			message: "Entrega registrada",
			movimiento_id: movResult.rows[0].id,
		});
	} catch (error) {
		await client.query("ROLLBACK");
		console.error(error);
		res.status(400).json({ error: error.message });
	} finally {
		client.release();
	}
};

// --- 2. REGISTRAR ENTREGA CON CORREO ---
const registrarEntregaConCorreo = async (req, res) => {
	const adminId = req.user ? req.user.id : null;
	const {
		equipo_id,
		empleado_id,
		cargador,
		destinatario,
		nombreEmpleado,
		tipoEquipo,
	} = req.body;
	const archivoPDF = req.file;

	const client = await db.pool.connect();
	let movimientoId = null;

	try {
		await client.query("BEGIN");

		const checkEquipo = await client.query(
			"SELECT disponible FROM equipos WHERE id = $1",
			[equipo_id],
		);
		if (
			checkEquipo.rows.length === 0 ||
			checkEquipo.rows[0].disponible === false
		) {
			throw new Error("El equipo no está disponible");
		}

		const cargadorBool = cargador === "true" || cargador === true;

		const insertMov = `
        INSERT INTO movimientos 
        (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, correo_enviado, registrado_por_id)
        VALUES ($1, $2, 'entrega', NOW(), $3, false, $4)
        RETURNING id
    `;
		const result = await client.query(insertMov, [
			equipo_id,
			empleado_id,
			cargadorBool,
			adminId,
		]);
		movimientoId = result.rows[0].id;

		await client.query("UPDATE equipos SET disponible = false WHERE id = $1", [
			equipo_id,
		]);
		await client.query("COMMIT");
	} catch (dbError) {
		await client.query("ROLLBACK");
		client.release();
		return res
			.status(400)
			.json({ error: dbError.message || "Error al guardar en BD" });
	}

	try {
		const cargadorBool = cargador === "true" || cargador === true;
		const textoCargador = cargadorBool ? "SÍ (Incluido)" : "NO (Solo equipo)";

		const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><style>body { font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; }</style></head>
    <body style="padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.15);">
            <div style="background-color: #7c3aed; padding: 40px 20px; text-align: center;">
                <img src="cid:logo" alt="Logo Grupo SP" style="max-width: 180px; display: block; background-color: #ffffff; border-radius: 20px; padding: 5px 20px; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">Acta de Entrega</h1>
                <p style="color: #ede9fe; margin: 5px 0 0 0; font-size: 13px;">Gestión de Talento Humano</p>
            </div>
            <div style="padding: 40px 30px; color: #334155;">
                <h2 style="color: #1e293b; margin-top: 0;">Hola, ${nombreEmpleado} 👋</h2>
                <p style="font-size: 16px; color: #475569;">Se ha registrado la entrega de una herramienta de trabajo a tu nombre.</p>
                <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">EQUIPO ASIGNADO</p>
                        <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${tipoEquipo}</p>
                    </div>
                    <div style="border-top: 1px solid #ddd6fe; padding-top: 15px;">
                        <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">¿INCLUYE CARGADOR?</p>
                        <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #4b5563;">${textoCargador}</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <div style="background-color: #ede9fe; color: #6d28d9; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block; border: 1px solid #8b5cf6;">
                        📎 Archivo Adjunto: Acta_Entrega.pdf
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">(Busca el PDF adjunto en este correo)</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

		const mailOptions = {
			from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
			to: destinatario,
			subject: `📢 Entrega de Equipo: ${tipoEquipo}`,
			html: htmlTemplate,
			attachments: [
				{ filename: "Acta_Entrega.pdf", content: archivoPDF.buffer },
				{
					filename: "logo_gruposp.png",
					path: path.join(__dirname, "../assets/logo_gruposp.png"),
					cid: "logo",
				},
			],
		};

		await transporter.sendMail(mailOptions);
		await db.query(
			"UPDATE movimientos SET correo_enviado = true WHERE id = $1",
			[movimientoId],
		);
		res
			.status(201)
			.json({ message: "Guardado y correo enviado correctamente" });
	} catch (mailError) {
		console.error("Error envío correo:", mailError);
		res.status(201).json({
			message: "Guardado, pero falló el envío de correo.",
			warning: true,
		});
	} finally {
		if (client) client.release();
	}
};

// --- 3. REGISTRAR DEVOLUCIÓN ---
const registrarDevolucion = async (req, res) => {
	const adminId = req.user ? req.user.id : null;
	const {
		equipo_id,
		empleado_id,
		fecha,
		cargador,
		observaciones,
		estado_final,
	} = req.body;
	const client = await db.pool.connect();

	try {
		await client.query("BEGIN");

		const insertMov = `
        INSERT INTO movimientos 
        (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_momento, registrado_por_id)
        VALUES ($1, $2, 'devolucion', $3, $4, $5, $6, $7)
    `;
		await client.query(insertMov, [
			equipo_id,
			empleado_id,
			fecha,
			cargador,
			observaciones,
			estado_final,
			adminId,
		]);

		await client.query(
			"UPDATE equipos SET disponible = true, estado = $1 WHERE id = $2",
			[estado_final, equipo_id],
		);
		await client.query("COMMIT");
		res.status(201).json({ message: "Devolución registrada" });
	} catch (error) {
		await client.query("ROLLBACK");
		console.error(error);
		res.status(500).json({ error: "Error al registrar devolución" });
	} finally {
		client.release();
	}
};

// --- 4. REGISTRAR DEVOLUCIÓN CON CORREO ---
const registrarDevolucionConCorreo = async (req, res) => {
	const adminId = req.user ? req.user.id : null;
	const {
		equipo_id,
		empleado_id,
		cargador,
		destinatario,
		nombreEmpleado,
		tipoEquipo,
		estado_final,
		observaciones,
	} = req.body;
	const archivoPDF = req.file;

	const client = await db.pool.connect();
	let movimientoId = null;

	try {
		await client.query("BEGIN");

		const cargadorBool = cargador === "true" || cargador === true;

		const insertMov = `
        INSERT INTO movimientos 
        (equipo_id, empleado_id, tipo, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_momento, correo_enviado, registrado_por_id)
        VALUES ($1, $2, 'devolucion', NOW(), $3, $4, $5, false, $6)
        RETURNING id
    `;
		const result = await client.query(insertMov, [
			equipo_id,
			empleado_id,
			cargadorBool,
			observaciones,
			estado_final,
			adminId,
		]);
		movimientoId = result.rows[0].id;

		await client.query(
			"UPDATE equipos SET disponible = true, estado = $1 WHERE id = $2",
			[estado_final, equipo_id],
		);

		await client.query("COMMIT");
	} catch (dbError) {
		await client.query("ROLLBACK");
		client.release();
		console.error(dbError);
		return res
			.status(400)
			.json({ error: dbError.message || "Error al guardar en BD" });
	}

	try {
		const cargadorBool = cargador === "true" || cargador === true;
		const textoCargador = cargadorBool
			? "SÍ (Devuelto)"
			: "NO (Falta cargador)";
		const colorEstado = estado_final === "operativo" ? "#16a34a" : "#dc2626";

		const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><style>body { font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; }</style></head>
    <body style="padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.1);">
            <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
                <img src="cid:logo" alt="Logo" style="max-width: 180px; display: block; background-color: #ffffff; border-radius: 20px; padding: 5px 20px; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">Constancia de Devolución</h1>
            </div>
            <div style="padding: 40px 30px; color: #334155;">
                <h2 style="color: #1e293b;">Hola, ${nombreEmpleado}</h2>
                <p>Se ha registrado la devolución de tu equipo de trabajo.</p>
                
                <div style="background-color: #fef2f2; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
                    <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">EQUIPO DEVUELTO</p>
                    <p style="margin:4px 0 15px 0; font-size:18px; font-weight:700; color:#1e293b;">${tipoEquipo}</p>
                    
                    <div style="display:flex; justify-content:space-between; border-top:1px solid #ddd6fe; padding-top:15px;">
                        <div>
                            <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">ESTADO FINAL</p>
                            <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:${colorEstado}; text-transform:uppercase;">${estado_final}</p>
                        </div>
                        <div>
                            <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">CARGADOR</p>
                            <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:#4b5563;">${textoCargador}</p>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <div style="background-color: #ede9fe; color: #6d28d9; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block;">
                        📎 Archivo Adjunto: Constancia_Devolucion.pdf
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

		const mailOptions = {
			from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
			to: destinatario,
			subject: `🔄 Devolución Registrada: ${tipoEquipo}`,
			html: htmlTemplate,
			attachments: [
				{
					filename: "Constancia_Devolucion.pdf",
					content: archivoPDF.buffer,
				},
				{
					filename: "logo_gruposp.png",
					path: path.join(__dirname, "../assets/logo_gruposp.png"),
					cid: "logo",
				},
			],
		};

		await transporter.sendMail(mailOptions);
		await db.query(
			"UPDATE movimientos SET correo_enviado = true WHERE id = $1",
			[movimientoId],
		);
		res.status(201).json({ message: "Devolución guardada y correo enviado" });
	} catch (mailError) {
		console.error("Error envío correo:", mailError);
		res.status(201).json({
			message: "Guardado, pero falló el envío de correo.",
			warning: true,
		});
	} finally {
		if (client) client.release();
	}
};

// --- 5. OBTENER HISTORIAL (CORREGIDO TIEMPO DE USO Y EMPRESAS) ---
const obtenerHistorial = async (req, res) => {
	try {
		const query = `
        SELECT 
            m.id, m.fecha_movimiento, m.tipo, m.cargador_incluido as cargador, 
            m.observaciones, m.empleado_id, m.equipo_id, 
            m.pdf_firmado_url, m.firma_valida, m.correo_enviado,
            m.estado_equipo_momento,
            e.marca, e.modelo, e.serie, 
            emp.nombres as empleado_nombre, 
            emp.apellidos as empleado_apellido,
            emp.dni,    
            emp.genero,
            emp.empresa as empleado_empresa,   -- <--- NUEVO: Empresa del colaborador
            u.nombre as admin_nombre, 
            u.email as admin_correo,
            u.empresa as admin_empresa,        -- <--- NUEVO: Empresa del administrador

            -- LÓGICA DE TIEMPO DE USO INTELIGENTE --
            CASE 
                -- Si es una ENTREGA, calculamos cuánto tiempo lleva o llevó
                WHEN m.tipo = 'entrega' THEN 
                    AGE(
                        -- Buscamos si existe una devolución POSTERIOR para este equipo/usuario
                        COALESCE(
                            (SELECT MIN(m2.fecha_movimiento)
                             FROM movimientos m2 
                             WHERE m2.equipo_id = m.equipo_id 
                               AND m2.empleado_id = m.empleado_id 
                               AND m2.tipo = 'devolucion' 
                               AND m2.fecha_movimiento > m.fecha_movimiento),
                            NOW() -- Si no hay devolución, calculamos hasta HOY
                        ),
                        m.fecha_movimiento
                    )
                -- Si es DEVOLUCIÓN, lo dejamos vacío (NULL) como pediste
                ELSE NULL 
            END as tiempo_uso

        FROM movimientos m
        JOIN equipos e ON m.equipo_id = e.id
        JOIN empleados emp ON m.empleado_id = emp.id
        LEFT JOIN usuarios_admin u ON m.registrado_por_id = u.id
        ORDER BY m.fecha_movimiento DESC
    `;
		const response = await db.query(query);
		res.json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener historial" });
	}
};

// --- 6. SUBIR PDF FIRMADO ---
const subirPdfFirmado = async (req, res) => {
	const { id } = req.params;
	const archivo = req.file;
	if (!archivo) return res.status(400).json({ error: "No hay archivo" });

	try {
		const url = `/uploads/${archivo.filename}`;
		await db.query(
			"UPDATE movimientos SET pdf_firmado_url = $1, firma_valida = true WHERE id = $2",
			[url, id],
		);
		res.json({ message: "Archivo guardado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error BD" });
	}
};

// --- 7. INVALIDAR FIRMA ---
const invalidarFirma = async (req, res) => {
	const { id } = req.params;
	try {
		await db.query(
			"UPDATE movimientos SET firma_valida = false WHERE id = $1",
			[id],
		);
		res.json({ message: "Documento invalidado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al invalidar" });
	}
};

module.exports = {
	registrarEntrega,
	registrarEntregaConCorreo,
	registrarDevolucion,
	registrarDevolucionConCorreo,
	obtenerHistorial,
	subirPdfFirmado,
	invalidarFirma,
};
