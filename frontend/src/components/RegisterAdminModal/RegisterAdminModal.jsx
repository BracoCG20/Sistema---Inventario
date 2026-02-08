import React, { useState } from "react";
import api from "../../services/api"; // Ajusta la ruta según tu estructura
import { toast } from "react-toastify";
import { FaTimes, FaSave, FaUserPlus } from "react-icons/fa";
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
	});

	const handleChange = (e) => {
		setNewUser({ ...newUser, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await api.post("/auth/register", newUser);
			toast.success("Usuario administrador creado exitosamente");
			onClose(); // Cerrar modal al terminar
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al crear usuario");
		}
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			{/* stopPropagation evita que se cierre al hacer clic dentro del formulario */}
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
						<label>Teléfono / WhatsApp</label>
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
							Registrar Usuario
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RegisterAdminModal;
