import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaTimes, FaBuilding } from "react-icons/fa";
import "../RegisterAdminModal/RegisterAdminModal.scss";

const AddEmpresaModal = ({ onClose, onSuccess, empresaToEdit }) => {
	const [empresa, setEmpresa] = useState({
		razon_social: "",
		ruc: "",
		direccion: "",
		distrito: "",
		provincia: "",
		telefono: "",
		email_contacto: "",
		sitio_web: "",
	});

	// RELLENAR DATOS SI ESTAMOS EDITANDO
	useEffect(() => {
		if (empresaToEdit) {
			setEmpresa({
				razon_social: empresaToEdit.razon_social || "",
				ruc: empresaToEdit.ruc || "",
				direccion: empresaToEdit.direccion || "",
				distrito: empresaToEdit.distrito || "",
				provincia: empresaToEdit.provincia || "",
				telefono: empresaToEdit.telefono || "",
				email_contacto: empresaToEdit.email_contacto || "",
				sitio_web: empresaToEdit.sitio_web || "",
			});
		}
	}, [empresaToEdit]);

	const handleChange = (e) => {
		setEmpresa({ ...empresa, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (empresaToEdit) {
				await api.put(`/empresas/${empresaToEdit.id}`, empresa);
				toast.success("Empresa actualizada exitosamente");
			} else {
				await api.post("/empresas", empresa);
				toast.success("Empresa registrada exitosamente");
			}
			onSuccess();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al guardar empresa");
		}
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>
						<FaBuilding />{" "}
						{empresaToEdit ? "Editar Empresa" : "Registrar Empresa"}
					</h2>
					<button className='btn-close' onClick={onClose}>
						<FaTimes />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className='input-group'>
						<label>Razón Social *</label>
						<input
							name='razon_social'
							required
							value={empresa.razon_social}
							onChange={handleChange}
						/>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>RUC *</label>
							<input
								name='ruc'
								required
								value={empresa.ruc}
								onChange={handleChange}
								maxLength={11}
							/>
						</div>
						<div className='input-group'>
							<label>Teléfono</label>
							<input
								name='telefono'
								value={empresa.telefono}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className='input-group'>
						<label>Dirección Fiscal</label>
						<input
							name='direccion'
							value={empresa.direccion}
							onChange={handleChange}
						/>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Distrito</label>
							<input
								name='distrito'
								value={empresa.distrito}
								onChange={handleChange}
							/>
						</div>
						<div className='input-group'>
							<label>Provincia</label>
							<input
								name='provincia'
								value={empresa.provincia}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Email de Contacto</label>
							<input
								type='email'
								name='email_contacto'
								value={empresa.email_contacto}
								onChange={handleChange}
							/>
						</div>
						<div className='input-group'>
							<label>Sitio Web</label>
							<input
								type='text'
								name='sitio_web'
								value={empresa.sitio_web}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className='modal-actions'>
						<button type='button' className='btn-cancel' onClick={onClose}>
							Cancelar
						</button>
						<button type='submit' className='btn-confirm'>
							{empresaToEdit ? "Actualizar" : "Guardar"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddEmpresaModal;
