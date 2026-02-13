import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaUserPlus, FaEdit, FaLock, FaSave } from "react-icons/fa";
import api from "../../services/api";
import Select from "react-select";
import CustomSelect from "../../components/Select/CustomSelect";
import "./AddUsuarioForm.scss";

const AddUsuarioForm = ({ onSuccess, usuarioToEdit }) => {
	const [formData, setFormData] = useState({
		dni: "",
		nombres: "",
		apellidos: "",
		correo: "",
		empresa: "",
		cargo: "",
		genero: "hombre",
		telefono: "",
	});

	// Estado para la lista de empresas
	const [empresaOptions, setEmpresaOptions] = useState([]);
	const [loadingEmpresas, setLoadingEmpresas] = useState(false);

	const genderOptions = [
		{ value: "hombre", label: "Hombre (Sr.)" },
		{ value: "mujer", label: "Mujer (Srta.)" },
	];

	// 1. CARGAR EMPRESAS AL INICIO
	useEffect(() => {
		const fetchEmpresas = async () => {
			setLoadingEmpresas(true);
			try {
				const res = await api.get("/empresas");
				const options = res.data.map((emp) => ({
					value: emp.razon_social,
					label: emp.razon_social,
				}));
				setEmpresaOptions(options);
			} catch (error) {
				console.error("Error al cargar empresas");
				toast.error("No se pudo cargar la lista de empresas");
			} finally {
				setLoadingEmpresas(false);
			}
		};
		fetchEmpresas();
	}, []);

	// 2. RELLENAR DATOS SI ES EDICIÓN
	useEffect(() => {
		if (usuarioToEdit) {
			setFormData({
				dni: usuarioToEdit.dni,
				nombres: usuarioToEdit.nombres,
				apellidos: usuarioToEdit.apellidos,
				correo: usuarioToEdit.correo,
				empresa: usuarioToEdit.empresa || "",
				cargo: usuarioToEdit.cargo || "",
				genero: usuarioToEdit.genero || "hombre",
				telefono: usuarioToEdit.telefono || "",
			});
		}
	}, [usuarioToEdit]);

	// Manejadores de cambios
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleEmpresaChange = (selectedOption) => {
		setFormData({
			...formData,
			empresa: selectedOption ? selectedOption.value : "",
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (usuarioToEdit) {
				// UPDATE
				await api.put(`/usuarios/${usuarioToEdit.id}`, formData);
				toast.success("Datos actualizados correctamente");
			} else {
				// CREATE
				await api.post("/usuarios", formData);
				toast.success("Colaborador registrado correctamente");
			}
			onSuccess();
		} catch (error) {
			console.error(error);
			toast.error("Error al guardar los datos");
		}
	};

	// Helper para saber si estamos editando
	const isEdit = !!usuarioToEdit;

	// Estilos para inputs deshabilitados (Visual)
	const disabledStyle = {
		background: "#f1f5f9",
		color: "#94a3b8",
		cursor: "not-allowed",
	};

	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			background: state.isDisabled ? "#f1f5f9" : "rgba(255, 255, 255, 0.9)",
			borderColor: state.isFocused ? "#7c3aed" : "#cbd5e1",
			borderRadius: "8px",
			padding: "2px",
			boxShadow: state.isFocused ? "0 0 0 1px #7c3aed" : "none",
			cursor: state.isDisabled ? "not-allowed" : "default",
			"&:hover": { borderColor: state.isDisabled ? "#cbd5e1" : "#7c3aed" },
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#7c3aed"
				: state.isFocused
					? "#f3f0ff"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
		}),
		singleValue: (provided, state) => ({
			...provided,
			color: state.isDisabled ? "#94a3b8" : "#334155",
		}),
	};

	return (
		<form className='equipo-form' onSubmit={handleSubmit}>
			{isEdit && (
				<div
					style={{
						marginBottom: "15px",
						fontSize: "0.9rem",
						color: "#b45309",
						background: "#fffbeb",
						padding: "10px",
						borderRadius: "8px",
						border: "1px solid #fcd34d",
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}
				>
					{/* --- MENSAJE ACTUALIZADO --- */}
					<FaLock /> Solo se permite editar contacto, cargo y empresa.
				</div>
			)}

			<div className='form-row'>
				<div className='input-group'>
					<label>DNI / Documento</label>
					<input
						name='dni'
						value={formData.dni}
						onChange={handleChange}
						required
						disabled={isEdit}
						style={isEdit ? disabledStyle : {}}
						placeholder='Ej: 77123456'
					/>
				</div>
				<div className='input-group'>
					<label>Género</label>
					<CustomSelect
						options={genderOptions}
						value={genderOptions.find((op) => op.value === formData.genero)}
						onChange={(op) =>
							setFormData({ ...formData, genero: op?.value || "hombre" })
						}
						isDisabled={isEdit}
						placeholder='Seleccione...'
					/>
				</div>
			</div>

			<div className='form-row'>
				<div className='input-group'>
					<label>Nombres</label>
					<input
						name='nombres'
						value={formData.nombres}
						onChange={handleChange}
						required
						disabled={isEdit}
						style={isEdit ? disabledStyle : {}}
						placeholder='Ej: Juan'
					/>
				</div>
				<div className='input-group'>
					<label>Apellidos</label>
					<input
						name='apellidos'
						value={formData.apellidos}
						onChange={handleChange}
						required
						disabled={isEdit}
						style={isEdit ? disabledStyle : {}}
						placeholder='Ej: Pérez'
					/>
				</div>
			</div>

			<div className='form-row'>
				<div className='input-group'>
					<label>Correo Electrónico</label>
					<input
						type='email'
						name='correo'
						value={formData.correo}
						onChange={handleChange}
						required
						placeholder='juan@empresa.com'
					/>
				</div>
				<div className='input-group'>
					<label>WhatsApp / Celular</label>
					<input
						name='telefono'
						type='tel'
						value={formData.telefono}
						onChange={handleChange}
						placeholder='+51 999 999 999'
					/>
				</div>
			</div>

			<div className='form-row'>
				<div className='input-group'>
					<label>Empresa</label>
					<Select
						options={empresaOptions}
						value={empresaOptions.find((op) => op.value === formData.empresa)}
						onChange={handleEmpresaChange}
						styles={customSelectStyles}
						placeholder={loadingEmpresas ? "Cargando..." : "Seleccione"}
						isLoading={loadingEmpresas}
						isClearable // <--- AHORA SIEMPRE SE PUEDE LIMPIAR Y EDITAR
						// Eliminamos la línea: isDisabled={isEdit}
					/>
				</div>

				<div className='input-group'>
					<label>Cargo</label>
					<input
						name='cargo'
						value={formData.cargo}
						onChange={handleChange}
						placeholder='Ej: Analista'
					/>
				</div>
			</div>

			<button type='submit' className='btn-submit'>
				{isEdit ? (
					<FaSave style={{ marginRight: "8px" }} />
				) : (
					<FaUserPlus style={{ marginRight: "8px" }} />
				)}
				{isEdit ? "Guardar Cambios" : "Registrar Colaborador"}
			</button>
		</form>
	);
};

export default AddUsuarioForm;
