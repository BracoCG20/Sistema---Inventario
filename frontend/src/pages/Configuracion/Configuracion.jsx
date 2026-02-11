import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import Select from "react-select";
import {
	FaUser,
	FaBuilding,
	FaCamera,
	FaSave,
	FaLock,
	FaEnvelope,
	FaWhatsapp,
	FaUserTie,
	FaPlus,
	FaList,
} from "react-icons/fa";
import "./Configuracion.scss";

// --- IMPORTACIÓN DE MODALES ---
import RegisterAdminModal from "../../components/RegisterAdminModal/RegisterAdminModal";
import UserListModal from "../../components/UserListModal/UserListModal";
import AddEmpresaModal from "../../components/EmpresaModal/AddEmpresaModal";
import EmpresaListModal from "../../components/EmpresaModal/EmpresaListModal";

const Configuracion = () => {
	// --- ESTADOS PARA MODALES ---
	const [showUserModal, setShowUserModal] = useState(false);
	const [showUserList, setShowUserList] = useState(false);

	const [showEmpresaModal, setShowEmpresaModal] = useState(false);
	const [showEmpresaList, setShowEmpresaList] = useState(false);
	const [empresaToEdit, setEmpresaToEdit] = useState(null);

	// --- ESTADOS DEL PERFIL Y ROL ---
	const [loading, setLoading] = useState(true);
	const [preview, setPreview] = useState(null);
	const [userRole, setUserRole] = useState(null); // Estado para el rol_id

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

	// --- ESTADO PARA SELECT DE EMPRESAS ---
	const [empresaOptions, setEmpresaOptions] = useState([]);
	const [loadingEmpresas, setLoadingEmpresas] = useState(false);

	// 1. CARGAR DATOS DEL PERFIL
	useEffect(() => {
		const fetchPerfil = async () => {
			try {
				const res = await api.get("/auth/perfil");
				const u = res.data;

				// CORRECCIÓN CLAVE: Convertimos explícitamente a número por si el backend lo envía como string ("1")
				setUserRole(Number(u.rol_id));

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

	// 2. CARGAR LISTA DE EMPRESAS (PARA EL SELECT)
	const fetchEmpresasOptions = async () => {
		setLoadingEmpresas(true);
		try {
			const res = await api.get("/empresas");
			const options = res.data.map((emp) => ({
				value: emp.razon_social,
				label: emp.razon_social,
			}));
			setEmpresaOptions(options);
		} catch (error) {
			console.error("Error al cargar empresas select", error);
		} finally {
			setLoadingEmpresas(false);
		}
	};

	useEffect(() => {
		fetchEmpresasOptions();
	}, []);

	// --- MANEJADORES ---
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleEmpresaChange = (selectedOption) => {
		setFormData({
			...formData,
			empresa: selectedOption ? selectedOption.value : "",
		});
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

	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
			padding: "2px",
			minHeight: "42px",
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
		input: (provided) => ({
			...provided,
			color: "#334155",
		}),
		singleValue: (provided) => ({
			...provided,
			color: "#334155",
		}),
	};

	if (loading) return <div className='loading-state'>Cargando perfil...</div>;

	const defaultImage = `https://ui-avatars.com/api/?name=${formData.nombre}+${formData.apellidos}&background=random`;

	return (
		<div className='config-container'>
			{/* --- ENCABEZADO CON ACCIONES --- */}
			<div className='header-actions'>
				<div className='page-header'>
					<h1>Configuración</h1>
				</div>

				{/* --- VALIDACIÓN DE ROL: Comparamos estrictamente con el número 1 --- */}
				{userRole === 1 && (
					<div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
						{/* GRUPO EMPRESAS */}
						<div className='button-group'>
							<button
								className='btn-main indigo'
								onClick={() => setShowEmpresaList(true)}
							>
								<FaList /> Ver Empresas
							</button>
							<button
								className='btn-main indigo-light'
								onClick={() => {
									setEmpresaToEdit(null);
									setShowEmpresaModal(true);
								}}
							>
								<FaPlus /> Nueva Empresa
							</button>
						</div>

						<div className='divider-vertical'></div>

						{/* GRUPO USUARIOS */}
						<div className='button-group'>
							<button
								className='btn-main blue'
								onClick={() => setShowUserList(true)}
							>
								<FaList /> Ver Usuarios
							</button>
							<button
								className='btn-main green'
								onClick={() => setShowUserModal(true)}
							>
								<FaPlus /> Nuevo Usuario
							</button>
						</div>
					</div>
				)}
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
							<Select
								options={empresaOptions}
								value={empresaOptions.find(
									(op) => op.value === formData.empresa,
								)}
								onChange={handleEmpresaChange}
								styles={customSelectStyles}
								placeholder={
									loadingEmpresas ? "Cargando..." : "Seleccione empresa..."
								}
								isLoading={loadingEmpresas}
								isClearable
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

			{/* --- MODALES --- */}
			{showUserModal && (
				<RegisterAdminModal onClose={() => setShowUserModal(false)} />
			)}
			{showUserList && <UserListModal onClose={() => setShowUserList(false)} />}

			{showEmpresaModal && (
				<AddEmpresaModal
					empresaToEdit={empresaToEdit}
					onClose={() => setShowEmpresaModal(false)}
					onSuccess={() => {
						setEmpresaToEdit(null);
						fetchEmpresasOptions();
					}}
				/>
			)}

			{showEmpresaList && (
				<EmpresaListModal
					onClose={() => setShowEmpresaList(false)}
					onEditEmpresa={(empresa) => {
						setEmpresaToEdit(empresa);
						setShowEmpresaModal(true);
					}}
				/>
			)}
		</div>
	);
};

export default Configuracion;
