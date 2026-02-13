import React, { useState, useEffect } from "react";
import Select from "react-select";
import { FaSave, FaTimes } from "react-icons/fa";
import "./AlquilerForm.scss";

const AlquilerForm = ({ onSubmit, initialData, equipos, onClose }) => {
	const [formData, setFormData] = useState({
		equipo_id: "",
		cliente_nombre: "",
		cliente_documento: "",
		cliente_telefono: "",
		precio_alquiler: "",
		moneda: "USD",
		frecuencia_pago: "Mensual",
		fecha_inicio: "",
		fecha_fin: "",
		observaciones: "",
	});

	useEffect(() => {
		if (initialData) {
			setFormData({
				...initialData,
				cliente_nombre: initialData.cliente_nombre || "",
				fecha_inicio: initialData.fecha_inicio
					? initialData.fecha_inicio.split("T")[0]
					: "",
				fecha_fin: initialData.fecha_fin
					? initialData.fecha_fin.split("T")[0]
					: "",
			});
		}
	}, [initialData]);

	const equipoOptions = equipos.map((eq) => ({
		value: eq.id,
		label: `${eq.marca} ${eq.modelo} - ${eq.serie}`,
	}));

	const monedaOptions = [
		{ value: "USD", label: "USD ($)" },
		{ value: "PEN", label: "PEN (S/)" },
	];

	const frecuenciaOptions = [
		{ value: "Mensual", label: "Mensual" },
		{ value: "Semestral", label: "Semestral" },
		{ value: "Anual", label: "Anual" },
		{ value: "Unico", label: "Pago Único" },
	];

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSelectChange = (selectedOption, actionMeta) => {
		setFormData({
			...formData,
			[actionMeta.name]: selectedOption ? selectedOption.value : "",
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
	};

	// --- ESTILOS REACT-SELECT (CENTRADOS PERFECTAMENTE) ---
	const customStyles = {
		control: (provided, state) => ({
			...provided,
			minHeight: "45px",
			height: "45px",
			borderColor: state.isFocused ? "#8b5cf6" : "#cbd5e1",
			borderRadius: "8px",
			boxShadow: state.isFocused
				? "0 0 0 3px rgba(139, 92, 246, 0.15)"
				: "none",
			"&:hover": { borderColor: "#8b5cf6" },
		}),
		valueContainer: (provided) => ({
			...provided,
			padding: "0 14px", // Solo padding lateral, sin forzar height
		}),
		input: (provided) => ({
			...provided,
			margin: "0px",
			padding: "0px",
		}),
		indicatorsContainer: (provided) => ({
			...provided,
			height: "45px", // Forzamos altura en el contenedor de iconos para que no empuje el texto
		}),
		indicatorSeparator: () => ({ display: "none" }),
		singleValue: (provided) => ({
			...provided,
			color: "#1f2937",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#8b5cf6"
				: state.isFocused
					? "#f3f4f6"
					: "transparent",
			color: state.isSelected ? "white" : "#1f2937",
			cursor: "pointer",
		}),
	};

	const getSelectedOption = (options, value) =>
		options.find((op) => op.value === value) || null;

	return (
		<form onSubmit={handleSubmit} className='form-grid'>
			<div className='form-group full-width'>
				<label>Equipo (Solo Propios)</label>
				<Select
					name='equipo_id'
					options={equipoOptions}
					value={getSelectedOption(equipoOptions, formData.equipo_id)}
					onChange={handleSelectChange}
					placeholder='-- Buscar Equipo --'
					styles={customStyles}
					isDisabled={!!initialData}
					required
				/>
			</div>
			{/* DATOS DEL CLIENTE AMPLIADOS */}
			<div className='form-group full-width'>
				<label>Nombre o Razón Social del Cliente</label>
				<input
					type='text'
					name='cliente_nombre'
					value={formData.cliente_nombre}
					onChange={handleChange}
					required
				/>
			</div>

			<div className='form-group-row'>
				<div className='form-group'>
					<label>DNI / RUC</label>
					<input
						type='text'
						name='cliente_documento'
						value={formData.cliente_documento}
						onChange={handleChange}
						placeholder='Opcional'
					/>
				</div>
				<div className='form-group'>
					<label>Teléfono de Contacto</label>
					<input
						type='text'
						name='cliente_telefono'
						value={formData.cliente_telefono}
						onChange={handleChange}
						placeholder='Opcional'
					/>
				</div>
			</div>

			{/* CLIENTE COMO INPUT DE TEXTO */}
			<div className='form-group full-width'>
				<label>Cliente (Renta a:)</label>
				<input
					type='text'
					name='cliente_nombre'
					value={formData.cliente_nombre}
					onChange={handleChange}
					placeholder='Nombre del cliente o empresa...'
					required
				/>
			</div>

			<div className='form-group-row'>
				<div className='form-group'>
					<label>Precio Alquiler</label>
					<input
						type='number'
						name='precio_alquiler'
						step='0.01'
						value={formData.precio_alquiler}
						onChange={handleChange}
						placeholder='0.00'
						required
					/>
				</div>
				<div className='form-group'>
					<label>Moneda</label>
					<Select
						name='moneda'
						options={monedaOptions}
						value={getSelectedOption(monedaOptions, formData.moneda)}
						onChange={handleSelectChange}
						styles={customStyles}
						isSearchable={false}
					/>
				</div>
			</div>

			<div className='form-group full-width'>
				<label>Frecuencia de Pago</label>
				<Select
					name='frecuencia_pago'
					options={frecuenciaOptions}
					value={getSelectedOption(frecuenciaOptions, formData.frecuencia_pago)}
					onChange={handleSelectChange}
					styles={customStyles}
					isSearchable={false}
				/>
			</div>

			<div className='form-group-row'>
				<div className='form-group'>
					<label>Fecha Inicio</label>
					<input
						type='date'
						name='fecha_inicio'
						value={formData.fecha_inicio}
						onChange={handleChange}
						required
					/>
				</div>
				<div className='form-group'>
					<label>Fecha Fin (Opcional)</label>
					<input
						type='date'
						name='fecha_fin'
						value={formData.fecha_fin}
						onChange={handleChange}
					/>
				</div>
			</div>

			<div className='form-group full-width'>
				<label>Observaciones del Contrato</label>
				<textarea
					name='observaciones'
					rows='3'
					value={formData.observaciones}
					onChange={handleChange}
					placeholder='Detalles adicionales...'
				></textarea>
			</div>

			<div className='form-actions'>
				<button type='button' className='btn-cancel' onClick={onClose}>
					<FaTimes /> Cancelar
				</button>
				<button type='submit' className='btn-submit'>
					<FaSave /> Guardar Contrato
				</button>
			</div>
		</form>
	);
};

export default AlquilerForm;
