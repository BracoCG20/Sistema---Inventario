import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import Select from "react-select"; // <-- IMPORTACIÓN DE REACT-SELECT
import {
	FaPlus,
	FaUserTie,
	FaUser,
	FaWhatsapp,
	FaEdit,
	FaBan,
	FaEnvelope,
	FaExclamationTriangle,
	FaTimes,
	FaCheck,
	FaFileExcel,
	FaSearch,
	FaUndo,
	FaChevronLeft,
	FaChevronRight,
} from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import AddUsuarioForm from "./AddUsuarioForm";
import "./Usuarios.scss";

const Usuarios = () => {
	const [usuarios, setUsuarios] = useState([]);
	const [empresasOptions, setEmpresasOptions] = useState([]); // <-- ESTADO PARA EMPRESAS
	const [loading, setLoading] = useState(true);

	// Filtros
	const [searchTerm, setSearchTerm] = useState("");
	const [filterEmpresa, setFilterEmpresa] = useState({
		value: "todas",
		label: "Todas las Empresas",
	}); // <-- FILTRO DE EMPRESA

	const [userRole, setUserRole] = useState(null);

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Modales
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Selección
	const [usuarioToEdit, setUsuarioToEdit] = useState(null);
	const [usuarioToDelete, setUsuarioToDelete] = useState(null);

	// 1. CARGAR DATOS
	const fetchData = async () => {
		setLoading(true);
		try {
			// Obtenemos perfil
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id));

			// Obtenemos lista de empresas (para el filtro)
			try {
				const resEmpresas = await api.get("/empresas");
				const options = resEmpresas.data
					.filter((e) => e.estado === "Activo" || e.activo)
					.map((e) => ({
						value: e.nombre || e.razon_social,
						label: e.nombre || e.razon_social,
					}));
				setEmpresasOptions([
					{ value: "todas", label: "Todas las Empresas" },
					...options,
				]);
			} catch (err) {
				console.log("Error cargando empresas para el filtro", err);
				setEmpresasOptions([{ value: "todas", label: "Todas las Empresas" }]);
			}

			// Obtenemos usuarios
			const res = await api.get("/usuarios");
			const sorted = res.data.sort((a, b) => {
				if (a.activo === b.activo) return a.nombres.localeCompare(b.nombres);
				return a.activo ? -1 : 1;
			});
			setUsuarios(sorted);
		} catch (error) {
			console.error(error);
			toast.error("Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Reiniciar a la página 1 cuando cambia algún filtro
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterEmpresa]);

	// --- LÓGICA DE FILTRADO (Buscador + Empresa) ---
	const filteredUsuarios = usuarios.filter((u) => {
		// Filtro de texto
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			u.nombres.toLowerCase().includes(term) ||
			u.apellidos.toLowerCase().includes(term) ||
			(u.dni && u.dni.includes(term));

		// Filtro por empresa
		let matchesEmpresa = true;
		if (filterEmpresa.value !== "todas") {
			// Comparamos el valor del select con el nombre de la empresa del usuario
			matchesEmpresa = (u.empresa || "") === filterEmpresa.value;
		}

		return matchesSearch && matchesEmpresa;
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredUsuarios.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	const exportarExcel = () => {
		const dataParaExcel = filteredUsuarios.map((u) => ({
			ID: u.id,
			Estado: u.activo ? "ACTIVO" : "INACTIVO",
			DNI: u.dni || "-",
			Nombres: u.nombres,
			Apellidos: u.apellidos,
			"Correo Electrónico": u.correo,
			Empresa: u.empresa,
			Cargo: u.cargo,
			Género: u.genero,
			Teléfono: u.telefono || "-",
			"Registrado Por": u.creador_nombre || "Sistema",
			"Empresa de Registro": u.creador_empresa || "-",
			"Email Registro": u.creador_email || "-",
		}));
		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
		XLSX.writeFile(wb, "Reporte_Colaboradores.xlsx");
	};

	const handleAdd = () => {
		setUsuarioToEdit(null);
		setIsFormModalOpen(true);
	};
	const handleEdit = (user) => {
		setUsuarioToEdit(user);
		setIsFormModalOpen(true);
	};
	const confirmDelete = (user) => {
		setUsuarioToDelete(user);
		setIsDeleteModalOpen(true);
	};
	const executeDelete = async () => {
		if (!usuarioToDelete) return;
		try {
			await api.delete(`/usuarios/${usuarioToDelete.id}`);
			toast.success("Colaborador dado de baja");
			fetchData();
			setIsDeleteModalOpen(false);
			setUsuarioToDelete(null);
		} catch (error) {
			toast.error("Error al anular usuario");
		}
	};
	const handleActivate = async (user) => {
		try {
			await api.put(`/usuarios/${user.id}/activate`);
			toast.success(`Colaborador ${user.nombres} reactivado`);
			fetchData();
		} catch (error) {
			toast.error("Error al reactivar usuario");
		}
	};
	const handleFormSuccess = () => {
		setIsFormModalOpen(false);
		fetchData();
	};

	// Estilos personalizados para React-Select en la barra de filtros
	const customFilterStyles = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: "white",
			border: state.isFocused ? "1px solid #7c3aed" : "1px solid #e2e8f0",
			borderRadius: "12px",
			padding: "2px 6px",
			minHeight: "46px",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(124, 58, 237, 0.1)" : "none",
			cursor: "pointer",
			"&:hover": {
				borderColor: "#7c3aed",
			},
		}),
		indicatorSeparator: () => ({ display: "none" }),
		singleValue: (provided) => ({
			...provided,
			color: "#1e293b",
			fontWeight: "500",
			fontSize: "0.95rem",
		}),
		placeholder: (provided) => ({
			...provided,
			color: "#94a3b8",
			fontSize: "0.95rem",
		}),
		menu: (provided) => ({
			...provided,
			borderRadius: "12px",
			overflow: "hidden",
			zIndex: 9999,
			border: "1px solid #e2e8f0",
			boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#7c3aed"
				: state.isFocused
					? "#f8fafc"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
			fontSize: "0.9rem",
			padding: "10px 15px",
		}),
	};

	if (loading) return <div className='loading-state'>Cargando...</div>;

	return (
		<div className='usuarios-container'>
			<div className='page-header'>
				<h1>Directorio de Personal</h1>
				<div className='header-actions'>
					<button
						onClick={exportarExcel}
						className='btn-action-header btn-excel'
					>
						<FaFileExcel /> Exportar Excel
					</button>
					<button className='btn-action-header btn-add' onClick={handleAdd}>
						<FaPlus /> Nuevo Colaborador
					</button>
				</div>
			</div>

			{/* --- NUEVA BARRA DE FILTROS --- */}
			<div className='filters-bar'>
				<div className='search-input'>
					<FaSearch color='#94a3b8' />
					<input
						type='text'
						placeholder='Buscar por Nombre o DNI...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className='condition-filter'>
					<Select
						options={empresasOptions}
						value={filterEmpresa}
						onChange={setFilterEmpresa}
						styles={customFilterStyles}
						isSearchable={true}
						placeholder='Filtrar por Empresa'
					/>
				</div>
			</div>

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>
						No se encontraron colaboradores con los filtros actuales.
					</div>
				) : (
					<table>
						<thead>
							<tr>
								<th>Estado</th>
								<th>DNI</th>
								<th>Colaborador</th>
								<th>Correo Electrónico</th>
								<th>Contacto</th>
								<th>Empresa</th>
								<th>Cargo</th>
								<th className='center'>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((userItem) => {
								const isWoman = userItem.genero === "mujer";
								return (
									<tr
										key={userItem.id}
										className={!userItem.activo ? "inactive-row" : ""}
									>
										<td>
											<span
												className={`status-badge ${userItem.activo ? "operativo" : "malogrado"}`}
											>
												{userItem.activo ? "ACTIVO" : "INACTIVO"}
											</span>
										</td>
										<td>
											<span className='dni-text'>{userItem.dni}</span>
										</td>
										<td>
											<div className='user-avatar-cell'>
												<div
													className={`avatar-circle ${!userItem.activo ? "inactive" : isWoman ? "female" : "male"}`}
												>
													{isWoman ? <FaUser /> : <FaUserTie />}
												</div>
												<div className='user-info'>
													<span
														className={`name ${!userItem.activo ? "inactive" : ""}`}
													>
														{userItem.nombres} {userItem.apellidos}
													</span>
													{userItem.creador_nombre && (
														<span className='audit-text'>
															Reg: {userItem.creador_nombre}
														</span>
													)}
												</div>
											</div>
										</td>
										<td>
											<div className='email-cell'>
												<FaEnvelope /> {userItem.correo}
											</div>
										</td>
										<td>
											{userItem.telefono && userItem.activo ? (
												<a
													href={`https://wa.me/${userItem.telefono.replace(/\s+/g, "")}`}
													target='_blank'
													rel='noreferrer'
													className='whatsapp-btn'
												>
													<FaWhatsapp /> {userItem.telefono}
												</a>
											) : (
												<span className='no-contact'>-</span>
											)}
										</td>
										<td>
											<span className='empresa-text'>
												{userItem.empresa || "-"}
											</span>
										</td>
										<td>
											{userItem.cargo ? (
												<span className='cargo-badge'>{userItem.cargo}</span>
											) : (
												<span style={{ color: "#cbd5e1" }}>-</span>
											)}
										</td>
										<td>
											<div className='actions-cell'>
												{userItem.activo ? (
													<>
														<button
															className='action-btn edit'
															onClick={() => handleEdit(userItem)}
															title='Editar'
														>
															<FaEdit />
														</button>

														{userRole === 1 && (
															<button
																className='action-btn delete'
																onClick={() => confirmDelete(userItem)}
																title='Dar de baja'
															>
																<FaBan />
															</button>
														)}
													</>
												) : (
													userRole === 1 && (
														<button
															className='action-btn activate'
															onClick={() => handleActivate(userItem)}
															title='Reactivar Usuario'
														>
															<FaUndo />
														</button>
													)
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}

				{filteredUsuarios.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, filteredUsuarios.length)}
							</strong>{" "}
							de <strong>{filteredUsuarios.length}</strong>
						</div>
						<div className='controls'>
							<button
								onClick={() => paginate(currentPage - 1)}
								disabled={currentPage === 1}
							>
								<FaChevronLeft size={12} />
							</button>

							{[...Array(totalPages)].map((_, i) => {
								const pageNumber = i + 1;
								const isActive = currentPage === pageNumber;
								return (
									<button
										key={pageNumber}
										onClick={() => paginate(pageNumber)}
										className={isActive ? "active" : ""}
										disabled={isActive}
										style={isActive ? { opacity: 1, cursor: "default" } : {}}
									>
										{pageNumber}
									</button>
								);
							})}

							<button
								onClick={() => paginate(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								<FaChevronRight size={12} />
							</button>
						</div>
					</div>
				)}
			</div>

			<Modal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				title={usuarioToEdit ? "Editar Colaborador" : "Registrar Nuevo"}
			>
				<AddUsuarioForm
					onSuccess={handleFormSuccess}
					usuarioToEdit={usuarioToEdit}
				/>
			</Modal>

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title='Confirmar Baja'
			>
				<div className='confirm-modal-content'>
					<div className='warning-icon'>
						<FaExclamationTriangle />
					</div>
					<h3>¿Estás seguro?</h3>
					<p>
						Estás a punto de dar de baja a{" "}
						<strong>
							{usuarioToDelete?.nombres} {usuarioToDelete?.apellidos}
						</strong>
						.<br />
						Pasará a estado <strong>INACTIVO</strong>.
					</p>
					<div className='modal-actions'>
						<button
							className='btn-cancel'
							onClick={() => setIsDeleteModalOpen(false)}
						>
							<FaTimes /> Cancelar
						</button>
						<button className='btn-confirm' onClick={executeDelete}>
							<FaCheck /> Confirmar Baja
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default Usuarios;
