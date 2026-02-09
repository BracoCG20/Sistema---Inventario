import React, { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import Select from "react-select";
import "./RegisterAdminModal.scss";

const RegisterAdminModal = ({ onClose }) => {
	const [newUser, setNewUser] = useState({
		nombre: "",
		apellidos: "",
		email: "",
		password: "",
		cargo: "",
		empresa: "",
		telefono: "",
		rol_id: 2, // Por defecto ID 2 (ej. Admin normal)
	});

	// --- OPCIONES CON IDs DE TU BASE DE DATOS ---
	const roleOptions = [
		{ value: 2, label: "Administrador" }, // ID 2 en BD
		{ value: 1, label: "Super Administrador" }, // ID 1 en BD
	];

	// Estilos personalizados para react-select
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
			padding: "2px",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#4f46e5"
				: state.isFocused
					? "#e0e7ff"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
		}),
	};

	const handleChange = (e) => {
		setNewUser({ ...newUser, [e.target.name]: e.target.value });
	};

	// Al seleccionar, guardamos el value (que es el ID numérico) en rol_id
	const handleRoleChange = (selectedOption) => {
		setNewUser({ ...newUser, rol_id: selectedOption.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await api.post("/auth/register", newUser);
			toast.success("Usuario creado exitosamente");
			onClose();
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al crear usuario");
		}
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>
						<FaUserPlus /> Registrar Nuevo Administrador
					</h2>
					<button className='btn-close' onClick={onClose}>
						<FaTimes />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className='form-row'>
						<div className='input-group'>
							<label>Nombre *</label>
							<input
								type='text'
								name='nombre'
								required
								onChange={handleChange}
								value={newUser.nombre}
							/>
						</div>
						<div className='input-group'>
							<label>Apellidos</label>
							<input
								type='text'
								name='apellidos'
								onChange={handleChange}
								value={newUser.apellidos}
							/>
						</div>
					</div>

					<div className='input-group'>
						<label>Email (Usuario) *</label>
						<input
							type='email'
							name='email'
							required
							onChange={handleChange}
							value={newUser.email}
						/>
					</div>

					<div className='input-group'>
						<label>Contraseña *</label>
						<input
							type='password'
							name='password'
							required
							onChange={handleChange}
							value={newUser.password}
						/>
					</div>

					{/* SELECT DE ROLES */}
					<div className='input-group'>
						<label>Rol de Acceso *</label>
						<Select
							options={roleOptions}
							// Buscamos la opción que coincida con el ID actual para mostrarla
							value={roleOptions.find((op) => op.value === newUser.rol_id)}
							onChange={handleRoleChange}
							styles={customSelectStyles}
							placeholder='Seleccione un rol'
							isSearchable={false}
						/>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Empresa</label>
							<input
								type='text'
								name='empresa'
								onChange={handleChange}
								value={newUser.empresa}
							/>
						</div>
						<div className='input-group'>
							<label>Cargo</label>
							<input
								type='text'
								name='cargo'
								onChange={handleChange}
								value={newUser.cargo}
							/>
						</div>
					</div>

					<div className='input-group'>
						<label>Teléfono</label>
						<input
							type='text'
							name='telefono'
							onChange={handleChange}
							value={newUser.telefono}
						/>
					</div>

					<div className='modal-actions'>
						<button type='button' className='btn-cancel' onClick={onClose}>
							Cancelar
						</button>
						<button type='submit' className='btn-confirm'>
							Registrar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RegisterAdminModal;
