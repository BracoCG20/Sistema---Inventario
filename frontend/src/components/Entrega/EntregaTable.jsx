import React from "react";
import {
	FaHistory,
	FaCheck,
	FaTimes,
	FaFilePdf,
	FaUpload,
	FaBan,
	FaEye,
	FaEnvelope,
	FaExclamationTriangle,
} from "react-icons/fa";

const EntregaTable = ({
	historial,
	onVerPdfOriginal,
	onVerFirmado,
	onSubirClick,
	onInvalidar,
}) => {
	const formatDateTime = (isoString) => {
		if (!isoString) return "-";
		const date = new Date(
			isoString.endsWith("Z") ? isoString : `${isoString}Z`,
		);
		return date.toLocaleString("es-PE", {
			timeZone: "America/Lima",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div className='table-container' style={{ height: "fit-content" }}>
			<h3
				style={{
					padding: "1rem",
					borderBottom: "1px solid #eee",
					fontSize: "1.1rem",
					color: "#1e293b",
				}}
			>
				<FaHistory style={{ marginRight: "8px" }} /> Estado de Actas
			</h3>
			<table>
				{/* CORRECCIÓN CRÍTICA: Todo el thead sin espacios entre etiquetas */}
				<thead>
					<tr>
						<th>Datos Entrega</th>
						<th style={{ textAlign: "center" }}>Carg.</th>
						<th style={{ textAlign: "center" }}>Correo</th>
						<th style={{ textAlign: "center" }}>Acta Gen.</th>
						<th style={{ textAlign: "center" }}>Firma Empleado</th>
					</tr>
				</thead>
				<tbody>
					{historial.map((h) => (
						<tr key={h.id}>
							{/* DATOS */}
							<td>
								<strong style={{ color: "#334155", fontSize: "0.9rem" }}>
									{h.empleado_nombre} {h.empleado_apellido}
								</strong>
								<div
									style={{
										fontSize: "0.8rem",
										color: "#64748b",
										marginTop: "4px",
									}}
								>
									{h.modelo}
								</div>
								<div
									style={{
										fontSize: "0.75rem",
										color: "#0284c7",
										fontWeight: "600",
									}}
								>
									{formatDateTime(h.fecha_movimiento)}
								</div>
							</td>

							{/* CARGADOR */}
							<td style={{ textAlign: "center" }}>
								{h.cargador ? (
									<FaCheck color='#16a34a' />
								) : (
									<FaTimes color='#ef4444' />
								)}
							</td>

							{/* ESTADO CORREO */}
							<td style={{ textAlign: "center" }}>
								{h.correo_enviado === true && (
									<FaEnvelope
										style={{ color: "#16a34a", fontSize: "1.1rem" }}
										title='Correo enviado correctamente'
									/>
								)}
								{h.correo_enviado === false && (
									<FaExclamationTriangle
										style={{ color: "#ef4444", fontSize: "1.1rem" }}
										title='Error al enviar correo'
									/>
								)}
								{h.correo_enviado === null && (
									<span style={{ color: "#cbd5e1" }}>-</span>
								)}
							</td>

							{/* PDF ORIGINAL */}
							<td style={{ textAlign: "center" }}>
								<button
									onClick={() => onVerPdfOriginal(h)}
									style={{
										border: "none",
										background: "transparent",
										cursor: "pointer",
										color: "#64748b",
										fontSize: "1.2rem",
									}}
									title='Ver Acta Generada Original'
								>
									<FaFilePdf />
								</button>
							</td>

							{/* ESTADO FIRMA / SUBIDA */}
							<td style={{ textAlign: "center" }}>
								{!h.pdf_firmado_url && (
									<button
										onClick={() => onSubirClick(h.id)}
										style={{
											background: "#3b82f6",
											color: "white",
											border: "none",
											padding: "6px 12px",
											borderRadius: "6px",
											cursor: "pointer",
											fontSize: "0.85rem",
											display: "flex",
											alignItems: "center",
											gap: "6px",
											margin: "0 auto",
										}}
									>
										<FaUpload /> Subir
									</button>
								)}

								{h.pdf_firmado_url && h.firma_valida !== false && (
									<div
										style={{
											display: "flex",
											gap: "12px",
											justifyContent: "center",
											alignItems: "center",
										}}
									>
										<button
											onClick={() => onVerFirmado(h.pdf_firmado_url)}
											style={{
												color: "#16a34a",
												background: "#dcfce7",
												border: "1px solid #86efac",
												borderRadius: "6px",
												padding: "6px",
												cursor: "pointer",
												fontSize: "1.1rem",
											}}
											title='Ver Firmado'
										>
											<FaEye />
										</button>
										<button
											onClick={() => onInvalidar(h.id)}
											style={{
												color: "#ef4444",
												background: "#fee2e2",
												border: "1px solid #fca5a5",
												borderRadius: "6px",
												padding: "6px",
												cursor: "pointer",
												fontSize: "1.1rem",
											}}
											title='Invalidar Firma'
										>
											<FaBan />
										</button>
									</div>
								)}

								{h.pdf_firmado_url && h.firma_valida === false && (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: "5px",
										}}
									>
										<span
											style={{
												color: "#ef4444",
												fontSize: "0.7rem",
												fontWeight: "bold",
												background: "#fee2e2",
												padding: "2px 6px",
												borderRadius: "4px",
											}}
										>
											RECHAZADO
										</span>
										<button
											onClick={() => onSubirClick(h.id)}
											style={{
												background: "#f59e0b",
												color: "white",
												border: "none",
												padding: "4px 8px",
												borderRadius: "4px",
												cursor: "pointer",
												fontSize: "0.75rem",
											}}
										>
											<FaUpload /> Re-subir
										</button>
									</div>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default EntregaTable;
