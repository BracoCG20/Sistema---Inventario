import React from "react";
import {
	FaSave,
	FaEnvelope,
	FaWhatsapp,
	FaUserCheck,
	FaLaptop,
	FaBatteryFull,
	FaCheckCircle,
	FaExclamationTriangle,
} from "react-icons/fa";
import CustomSelect from "../Select/CustomSelect";

const DevolucionForm = ({
	usuariosOptions,
	formData,
	setFormData,
	equipoDetectado,
	handleUserChange,
	onAction, // Cambio: Recibe onAction en lugar de onSubmit
}) => {
	const estadoOptions = [
		{ value: "operativo", label: "Operativo" },
		{ value: "malogrado", label: "Malogrado" },
		{ value: "robado", label: "Robado" },
	];

	const labelStyle = {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		marginBottom: "10px",
		fontSize: "0.9rem",
		fontWeight: "700",
		color: "#4f46e5",
		textTransform: "uppercase",
	};

	const mostrarObservaciones =
		formData.estado_final === "malogrado" || formData.estado_final === "robado";
	const isFormValid =
		equipoDetectado && (!mostrarObservaciones || formData.observaciones.trim());

	return (
		<div
			className='table-container'
			style={{
				padding: "2rem",
				background: "white",
				borderRadius: "12px",
				boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
			}}
		>
			{/* Eliminamos la etiqueta <form> para manejar los botones manualmente */}
			<div>
				<div className='input-group'>
					<label style={labelStyle}>
						<FaUserCheck style={{ fontSize: "1.1rem" }} /> Usuario (Con equipo
						pendiente)
					</label>
					<CustomSelect
						options={usuariosOptions}
						value={
							usuariosOptions.find((o) => o.value === formData.empleado_id) ||
							null
						}
						onChange={handleUserChange}
						placeholder='Buscar usuario...'
					/>
				</div>

				{equipoDetectado ? (
					<div
						style={{
							marginTop: "1.5rem",
							padding: "15px",
							background: "#f0f9ff",
							border: "1px solid #bae6fd",
							borderRadius: "8px",
							display: "flex",
							alignItems: "center",
							gap: "15px",
						}}
					>
						<div
							style={{
								width: "50px",
								height: "50px",
								background: "#fff",
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#0284c7",
								fontSize: "1.5rem",
								boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
							}}
						>
							<FaLaptop />
						</div>
						<div>
							<span
								style={{
									display: "block",
									fontSize: "0.75rem",
									color: "#64748b",
									fontWeight: "700",
									textTransform: "uppercase",
								}}
							>
								EQUIPO A DEVOLVER
							</span>
							<strong
								style={{
									color: "#0f172a",
									fontSize: "1.1rem",
									display: "block",
								}}
							>
								{equipoDetectado.marca} {equipoDetectado.modelo}
							</strong>
							<div
								style={{
									fontSize: "0.85rem",
									color: "#334155",
									fontFamily: "monospace",
									marginTop: "2px",
								}}
							>
								S/N: {equipoDetectado.serie}
							</div>
						</div>
					</div>
				) : (
					<div
						style={{
							marginTop: "1.5rem",
							padding: "15px",
							background: "#f8fafc",
							border: "1px dashed #cbd5e1",
							borderRadius: "8px",
							color: "#94a3b8",
							fontStyle: "italic",
							textAlign: "center",
							fontSize: "0.9rem",
						}}
					>
						Seleccione un usuario para detectar automáticamente el equipo
						asignado.
					</div>
				)}

				<div className='input-group' style={{ marginTop: "1.5rem" }}>
					<label style={labelStyle}>
						<FaCheckCircle /> Estado de Recepción
					</label>
					<CustomSelect
						options={estadoOptions}
						value={
							estadoOptions.find((o) => o.value === formData.estado_final) ||
							null
						}
						onChange={(o) =>
							setFormData({
								...formData,
								estado_final: o?.value || "operativo",
							})
						}
					/>
				</div>

				{mostrarObservaciones && (
					<div className='input-group' style={{ marginTop: "1.5rem" }}>
						<label style={{ ...labelStyle, color: "#dc2626" }}>
							<FaExclamationTriangle /> Observaciones (Obligatorio)
						</label>
						<textarea
							value={formData.observaciones}
							onChange={(e) =>
								setFormData({ ...formData, observaciones: e.target.value })
							}
							placeholder='Describa el daño, incidente o detalles...'
							rows='3'
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "8px",
								border: "1px solid #fca5a5",
								background: "#fef2f2",
								fontFamily: "inherit",
								resize: "vertical",
							}}
						/>
					</div>
				)}

				<div style={{ marginTop: "1.5rem" }}>
					<label
						className='checkbox-card'
						style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}
					>
						<input
							type='checkbox'
							checked={formData.cargador}
							onChange={(e) =>
								setFormData({ ...formData, cargador: e.target.checked })
							}
							style={{ accentColor: "#e11d48" }}
						/>
						<span
							style={{
								color: "#9f1239",
								fontWeight: "600",
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<FaBatteryFull /> ¿Devuelve con cargador?
						</span>
					</label>
				</div>

				{/* BOTONES DE ACCIÓN (NUEVO) */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						marginTop: "2.5rem",
					}}
				>
					<button
						type='button'
						onClick={() => isFormValid && onAction("GUARDAR")}
						disabled={!isFormValid}
						className='btn-action'
						style={{
							background: !isFormValid ? "#cbd5e1" : "#64748b",
							color: "white",
							padding: "14px",
							borderRadius: "8px",
							border: "none",
							cursor: !isFormValid ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "10px",
							fontSize: "1rem",
							fontWeight: "600",
						}}
					>
						<FaSave /> Solo Guardar y Ver Constancia
					</button>

					<button
						type='button'
						onClick={() => isFormValid && onAction("EMAIL")}
						disabled={!isFormValid}
						className='btn-action'
						style={{
							background: !isFormValid ? "#cbd5e1" : "#0284c7",
							color: "white",
							padding: "14px",
							borderRadius: "8px",
							border: "none",
							cursor: !isFormValid ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "10px",
							fontSize: "1rem",
							fontWeight: "600",
						}}
					>
						<FaEnvelope /> Guardar y Enviar por Correo
					</button>

					<button
						type='button'
						onClick={() => isFormValid && onAction("WHATSAPP")}
						disabled={!isFormValid}
						className='btn-action'
						style={{
							background: !isFormValid ? "#cbd5e1" : "#16a34a",
							color: "white",
							padding: "14px",
							borderRadius: "8px",
							border: "none",
							cursor: !isFormValid ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "10px",
							fontSize: "1rem",
							fontWeight: "600",
						}}
					>
						<FaWhatsapp style={{ fontSize: "1.3rem" }} /> Guardar y Enviar por
						WhatsApp
					</button>
				</div>
			</div>
		</div>
	);
};

export default DevolucionForm;
