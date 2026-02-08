const transporter = require("../config/mailer");
const path = require("path"); // <--- IMPORTANTE: Necesario para buscar la imagen

const enviarCorreoEntrega = async (req, res) => {
	try {
		const { destinatario, nombreEmpleado, tipoEquipo, cargador } = req.body;
		const archivoPDF = req.file;

		if (!archivoPDF) {
			return res.status(400).json({ error: "No se generó el PDF adjunto" });
		}

		const incluyeCargador = cargador === "true" || cargador === true;
		const textoCargador = incluyeCargador
			? "SÍ (Incluido)"
			: "NO (Solo equipo)";

		// --- DISEÑO HTML CON LOGO ---
		const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
            </style>
        </head>
        <body style="background-color: #f3f4f6; padding: 40px 0;">
            
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.15);">
                
                <div style="background-color: #7c3aed; padding: 40px 20px; text-align: center;">
                    
                    <img src="cid:logo" alt="Logo Grupo SP" style="background-color: #ffffff; border-radius: 20px; padding: 5px 20px; max-width: 180px; display: block; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
                    
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                        Acta de Entrega
                    </h1>
                    <p style="color: #ede9fe; margin: 5px 0 0 0; font-size: 13px; font-weight: 500;">
                        Gestión de Talento Humano
                    </p>
                </div>

                <div style="padding: 40px 30px; color: #334155;">
                    <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Hola, ${nombreEmpleado} 👋</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                        Te informamos que se ha registrado la entrega de una nueva herramienta de trabajo asignada a tu nombre.
                    </p>

                    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px;">
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">EQUIPO ASIGNADO</p>
                            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${tipoEquipo}</p>
                        </div>
                        <div style="border-top: 1px solid #ddd6fe; padding-top: 15px;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">¿INCLUYE CARGADOR?</p>
                            <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #4b5563;">${textoCargador}</p>
                        </div>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; margin-top: 25px;">
                        Adjunto a este correo encontrarás el documento <strong>PDF</strong> con el acta de entrega formal.
                    </p>

                    <div style="margin-top: 35px; text-align: center;">
                        <div style="background-color: #ede9fe; color: #6d28d9; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block; border: 1px solid #8b5cf6;">
                            📎 Archivo Adjunto: Acta_Entrega.pdf
                        </div>
                        <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">(Busca el archivo adjunto en el correo)</p>
                    </div>
                </div>

                <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600;">Grupo SP</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">Mensaje automático, no responder.</p>
                </div>
            </div>
        </body>
        </html>
        `;

		// Configuración del correo
		const mailOptions = {
			from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
			to: destinatario,
			subject: `📢 Entrega de Equipo: ${tipoEquipo}`,
			html: htmlTemplate,
			attachments: [
				{
					// 1. El PDF Generado
					filename: "Acta_Entrega.pdf",
					content: archivoPDF.buffer,
					contentType: "application/pdf",
				},
				{
					// 2. El Logo Incrustado (CID)
					filename: "logo_gruposp.png",
					path: path.join(__dirname, "../assets/logo_gruposp.png"), // <--- RUTA DE TU IMAGEN
					cid: "logo", // <--- ESTO CONECTA CON <img src="cid:logo">
				},
			],
		};

		await transporter.sendMail(mailOptions);
		res.json({ message: "Correo enviado exitosamente" });
	} catch (error) {
		console.error("Error enviando correo:", error);
		res.status(500).json({ error: "Falló el envío del correo" });
	}
};

module.exports = { enviarCorreoEntrega };
