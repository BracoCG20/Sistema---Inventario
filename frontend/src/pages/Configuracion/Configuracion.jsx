import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import {
	FaUser,
	FaBuilding,
	FaCamera,
	FaSave,
	FaLock,
	FaEnvelope,
	FaWhatsapp,
	FaUserTie,
	FaPlus, // Importamos el icono más
} from "react-icons/fa";

// Importamos el archivo de estilos propios de la página
import "./Configuracion.scss";

// IMPORTANTE: Importamos el componente del Modal que creamos aparte
import RegisterAdminModal from "../../components/RegisterAdminModal/RegisterAdminModal";

const Configuracion = () => {
	// --- ESTADO PARA EL MODAL ---
	const [showModal, setShowModal] = useState(false);

	// --- ESTADOS DEL PERFIL ---
	const [loading, setLoading] = useState(true);
	const [preview, setPreview] = useState(null);
	const [formData, setFormData] = useState({
		nombre_usuario: "",
		nombre: "",
		apellidos: "",
		email: "",
		password: "",
		empresa: "",
		cargo: "",
		telefono: "",
	});
	const [fotoFile, setFotoFile] = useState(null);

	// Cargar datos del perfil
	useEffect(() => {
		const fetchPerfil = async () => {
			try {
				const res = await api.get("/auth/perfil");
				const u = res.data;
				setFormData({
					nombre_usuario: u.nombre_usuario || "",
					nombre: u.nombre || "",
					apellidos: u.apellidos || "",
					email: u.email || "",
					password: "",
					empresa: u.empresa || "",
					cargo: u.cargo || "",
					telefono: u.telefono || "",
				});
				if (u.foto_url) {
					setPreview(`http://localhost:4000${u.foto_url}`);
				}
			} catch (error) {
				console.error(error);
				toast.error("Error al cargar perfil");
			} finally {
				setLoading(false);
			}
		};
		fetchPerfil();
	}, []);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFotoFile(file);
			setPreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const toastId = toast.loading("Guardando cambios...");

		const data = new FormData();
		Object.keys(formData).forEach((key) => {
			data.append(key, formData[key]);
		});
		if (fotoFile) {
			data.append("foto", fotoFile);
		}

		try {
			await api.put("/auth/perfil", data, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.update(toastId, {
				render: "Perfil actualizado ✅",
				type: "success",
				isLoading: false,
				autoClose: 3000,
			});
		} catch (error) {
			console.error(error);
			toast.update(toastId, {
				render: "Error al actualizar ❌",
				type: "error",
				isLoading: false,
				autoClose: 3000,
			});
		}
	};

	if (loading) return <div className='loading-state'>Cargando perfil...</div>;

	// Avatar por defecto si no hay imagen (evita errores de carga)
	const defaultImage = `https://ui-avatars.com/api/?name=${formData.nombre}+${formData.apellidos}&background=random`;

	return (
		<div className='config-container'>
			{/* --- ENCABEZADO CON BOTÓN DE AGREGAR --- */}
			<div className='header-actions'>
				<div className='page-header'>
					<h1>Configuración de Perfil</h1>
				</div>
				{/* Botón que abre el modal */}
				<button className='btn-add-user' onClick={() => setShowModal(true)}>
					<FaPlus /> Nuevo Usuario
				</button>
			</div>

			{/* --- FORMULARIO DE EDICIÓN DE PERFIL --- */}
			<form onSubmit={handleSubmit} className='config-grid'>
				{/* TARJETA IZQUIERDA: FOTO */}
				<div className='card profile-card'>
					<div className='photo-wrapper'>
						<img
							src={preview || defaultImage}
							alt='Perfil'
							onError={(e) => {
								e.target.src = defaultImage;
							}}
						/>
						<label htmlFor='fotoInput' className='btn-camera'>
							<FaCamera />
						</label>
						<input
							id='fotoInput'
							type='file'
							accept='image/*'
							onChange={handleImageChange}
							style={{ display: "none" }}
						/>
					</div>
					<h3>
						{formData.nombre} {formData.apellidos}
					</h3>
					<p className='role-text'>{formData.cargo || "Sin cargo definido"}</p>

					<hr className='divider' />

					<div className='input-group'>
						<label>
							<FaUser /> Nombre de Usuario
						</label>
						<input
							type='text'
							name='nombre_usuario'
							value={formData.nombre_usuario}
							onChange={handleChange}
							placeholder='ej. jdoe'
							className='input-field'
						/>
					</div>
				</div>

				{/* TARJETA DERECHA: DATOS */}
				<div className='card details-card'>
					<h3 className='section-title'>Información Personal</h3>

					<div className='form-row'>
						<div className='input-group'>
							<label>Nombres</label>
							<input
								type='text'
								name='nombre'
								value={formData.nombre}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
						<div className='input-group'>
							<label>Apellidos</label>
							<input
								type='text'
								name='apellidos'
								value={formData.apellidos}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>
								<FaEnvelope /> Correo Electrónico
							</label>
							<input
								type='email'
								name='email'
								value={formData.email}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
						<div className='input-group'>
							<label>
								<FaWhatsapp /> WhatsApp / Teléfono
							</label>
							<input
								type='text'
								name='telefono'
								value={formData.telefono}
								onChange={handleChange}
								placeholder='+51 999...'
								className='input-field'
							/>
						</div>
					</div>

					<h3 className='section-title mt-large'>Información Corporativa</h3>

					<div className='form-row'>
						<div className='input-group'>
							<label>
								<FaBuilding /> Empresa
							</label>
							<input
								type='text'
								name='empresa'
								value={formData.empresa}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
						<div className='input-group'>
							<label>
								<FaUserTie /> Cargo
							</label>
							<input
								type='text'
								name='cargo'
								value={formData.cargo}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
					</div>

					<h3 className='section-title mt-large'>Seguridad</h3>

					<div className='input-group'>
						<label>
							<FaLock /> Cambiar Contraseña
						</label>
						<input
							type='password'
							name='password'
							value={formData.password}
							onChange={handleChange}
							placeholder='Dejar en blanco para mantener la actual'
							className='input-field input-gray'
						/>
					</div>

					<button type='submit' className='btn-save'>
						<FaSave /> Guardar Cambios
					</button>
				</div>
			</form>

			{/* --- RENDERIZADO DEL MODAL (COMPONENTE APARTE) --- */}
			{showModal && <RegisterAdminModal onClose={() => setShowModal(false)} />}
		</div>
	);
};

export default Configuracion;
