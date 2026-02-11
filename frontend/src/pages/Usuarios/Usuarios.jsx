import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
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
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// --- LÓGICA DE ROL IDÉNTICA A CONFIGURACION Y EQUIPOS ---
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

	// 1. CARGAR DATOS (PERFIL PARA ROL + LISTA DE USUARIOS)
	const fetchData = async () => {
		setLoading(true);
		try {
			// Obtenemos el perfil para validar el rol (Igual que en Configuracion.jsx)
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id)); // Convertimos a número para comparar con 1

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

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	const filteredUsuarios = usuarios.filter((u) => {
		const term = searchTerm.toLowerCase();
		return (
			u.nombres.toLowerCase().includes(term) ||
			u.apellidos.toLowerCase().includes(term) ||
			u.dni.includes(term)
		);
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

			<div className='search-bar'>
				<FaSearch color='#94a3b8' />
				<input
					type='text'
					placeholder='Buscar por Nombre o DNI...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>No se encontraron colaboradores.</div>
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

														{/* RESTRICCIÓN DE ROL: Solo Superadmin (1) ve botón de baja */}
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
													/* Solo Superadmin puede reactivar */
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

							{/* PAGINACIÓN NUMÉRICA IGUAL A EQUIPOS */}
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

			{/* MODALES */}
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
