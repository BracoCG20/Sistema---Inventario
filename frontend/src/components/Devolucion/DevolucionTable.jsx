import React from "react";
import {
	FaHistory,
	FaCheck,
	FaTimes,
	FaFilePdf,
	FaCircle,
	FaUpload,
	FaEye,
	FaBan,
	FaEnvelope,
	FaExclamationTriangle,
} from "react-icons/fa";

const DevolucionTable = ({
	historial,
	onVerPdf,
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

	const getStatusBadge = (estado) => {
		switch (estado) {
			case "operativo":
				return {
					color: "#16a34a",
					bg: "#dcfce7",
					text: "Operativo",
					icon: FaCheck,
				};
			case "malogrado":
				return {
					color: "#ea580c",
					bg: "#ffedd5",
					text: "Malogrado",
					icon: FaTimes,
				};
			case "robado":
				return {
					color: "#dc2626",
					bg: "#fee2e2",
					text: "Robado",
					icon: FaTimes,
				};
			default:
				return {
					color: "#64748b",
					bg: "#f1f5f9",
					text: estado || "-",
					icon: FaCircle,
				};
		}
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
				<FaHistory style={{ marginRight: "8px" }} /> Últimas Devoluciones
			</h3>
			<table>
				<thead>
					<tr>
						<th>Fecha y Hora</th>
						<th>Equipo Devuelto</th>
						<th>Usuario</th>
						<th style={{ textAlign: "center" }}>Estado</th>
						<th style={{ textAlign: "center" }}>Carg.</th>
						<th style={{ textAlign: "center" }}>Correo</th>
						<th style={{ textAlign: "center" }}>Acta</th>
						<th style={{ textAlign: "center" }}>Firma</th>
					</tr>
				</thead>
				<tbody>
					{historial.map((h) => {
						const status = getStatusBadge(h.estado_equipo_momento);
						const StatusIcon = status.icon;
						return (
							<tr key={h.id}>
								<td>
									<span
										style={{
											fontSize: "0.85rem",
											fontWeight: "600",
											color: "#475569",
										}}
									>
										{formatDateTime(h.fecha_movimiento)}
									</span>
								</td>
								<td>
									<strong style={{ color: "#334155" }}>{h.modelo}</strong>
									<br />
									<small style={{ fontFamily: "monospace", color: "#64748b" }}>
										S/N: {h.serie}
									</small>
								</td>
								<td>
									<span style={{ fontSize: "0.9rem" }}>
										{h.empleado_nombre} {h.empleado_apellido}
									</span>
								</td>

								{/* ESTADO FINAL */}
								<td style={{ textAlign: "center" }}>
									<div
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: "5px",
											padding: "4px 10px",
											borderRadius: "20px",
											background: status.bg,
											color: status.color,
											fontSize: "0.75rem",
											fontWeight: "700",
											textTransform: "uppercase",
										}}
									>
										<StatusIcon size={10} /> {status.text}
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
											title='Correo enviado'
										/>
									)}
									{h.correo_enviado === false && (
										<FaExclamationTriangle
											style={{ color: "#ef4444", fontSize: "1.1rem" }}
											title='Error envío'
										/>
									)}
									{h.correo_enviado === null && (
										<span style={{ color: "#cbd5e1" }}>-</span>
									)}
								</td>

								{/* PDF GENERADO */}
								<td style={{ textAlign: "center" }}>
									<button
										onClick={() => onVerPdf(h)}
										style={{
											border: "none",
											background: "transparent",
											cursor: "pointer",
											color: "#ef4444",
											fontSize: "1.2rem",
										}}
										title='Ver Constancia'
									>
										<FaFilePdf />
									</button>
								</td>

								{/* PDF FIRMADO (SUBIDA) */}
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
												title='Invalidar'
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
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default DevolucionTable;
