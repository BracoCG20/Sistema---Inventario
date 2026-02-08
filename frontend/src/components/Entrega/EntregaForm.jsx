import React from "react";
import {
	FaSave,
	FaEnvelope,
	FaWhatsapp,
	FaLaptop,
	FaUser,
} from "react-icons/fa";
import CustomSelect from "../Select/CustomSelect";

const EntregaForm = ({
	equiposOptions,
	usuariosOptions,
	formData,
	setFormData,
	onAction,
}) => {
	// Estilo para los títulos de los inputs
	const labelStyle = {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		marginBottom: "10px", // Separación del input
		fontSize: "0.95rem",
		fontWeight: "700",
		color: "#4f46e5", // Color Indigo/Morado vibrante
		textTransform: "uppercase",
		letterSpacing: "0.5px",
	};

	return (
		<div
			className='table-container'
			style={{
				padding: "2rem",
				background: "white",
				borderRadius: "12px",
				boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
			}}
		>
			{/* INPUT EQUIPO */}
			<div className='input-group'>
				<label style={labelStyle}>
					<FaLaptop style={{ fontSize: "1.1rem" }} />
					Equipo (Disponibles)
				</label>
				<CustomSelect
					options={equiposOptions}
					value={
						equiposOptions.find((op) => op.value === formData.equipo_id) || null
					}
					onChange={(op) =>
						setFormData({ ...formData, equipo_id: op?.value || "" })
					}
					placeholder='Seleccione un equipo...'
				/>
			</div>

			{/* INPUT COLABORADOR */}
			<div className='input-group' style={{ marginTop: "1.5rem" }}>
				<label style={labelStyle}>
					<FaUser style={{ fontSize: "1rem" }} />
					Colaborador (Sin equipo)
				</label>
				<CustomSelect
					options={usuariosOptions}
					value={
						usuariosOptions.find((op) => op.value === formData.empleado_id) ||
						null
					}
					onChange={(op) =>
						setFormData({ ...formData, empleado_id: op?.value || "" })
					}
					placeholder='Seleccione un colaborador...'
				/>
			</div>

			{/* CHECKBOX CARGADOR */}
			<div style={{ marginTop: "2rem" }}>
				<label
					className='checkbox-card'
					style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}
				>
					<input
						type='checkbox'
						checked={formData.cargador}
						onChange={(e) =>
							setFormData({ ...formData, cargador: e.target.checked })
						}
						style={{ accentColor: "#7c3aed" }}
					/>
					<span style={{ color: "#5b21b6", fontWeight: "600" }}>
						¿Incluye Cargador?
					</span>
				</label>
			</div>

			{/* BOTONES DE ACCIÓN */}
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
					onClick={() => onAction("GUARDAR")}
					className='btn-action'
					style={{
						background: "#64748b",
						color: "white",
						padding: "14px",
						borderRadius: "8px",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "10px",
						fontSize: "1rem",
						fontWeight: "600",
						transition: "0.2s",
					}}
				>
					<FaSave /> Solo Guardar y Ver Acta
				</button>

				<button
					type='button'
					onClick={() => onAction("EMAIL")}
					className='btn-action'
					style={{
						background: "#0284c7",
						color: "white",
						padding: "14px",
						borderRadius: "8px",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "10px",
						fontSize: "1rem",
						fontWeight: "600",
						transition: "0.2s",
					}}
				>
					<FaEnvelope /> Guardar y Enviar por Correo
				</button>

				<button
					type='button'
					onClick={() => onAction("WHATSAPP")}
					className='btn-action'
					style={{
						background: "#16a34a",
						color: "white",
						padding: "14px",
						borderRadius: "8px",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "10px",
						fontSize: "1rem",
						fontWeight: "600",
						transition: "0.2s",
					}}
				>
					<FaWhatsapp style={{ fontSize: "1.3rem" }} /> Guardar y Enviar por
					WhatsApp
				</button>
			</div>
		</div>
	);
};

export default EntregaForm;
