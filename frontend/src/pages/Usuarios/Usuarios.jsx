import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
// Iconos
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
	FaSearch, // Para el buscador
	FaUndo, // Para el botón de reactivar
	FaChevronLeft,
	FaChevronRight,
} from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import AddUsuarioForm from "./AddUsuarioForm";
import "../Equipos/Equipos.scss";

const Usuarios = () => {
	const [usuarios, setUsuarios] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState(""); // Estado del buscador

	// --- PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8; // Máximo 8 por página

	// --- ESTADOS DE MODALES ---
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// --- ESTADOS DE SELECCIÓN ---
	const [usuarioToEdit, setUsuarioToEdit] = useState(null);
	const [usuarioToDelete, setUsuarioToDelete] = useState(null);

	const fetchUsuarios = async () => {
		try {
			const res = await api.get("/usuarios");
			const sorted = res.data.sort((a, b) => {
				if (a.activo === b.activo) return a.nombres.localeCompare(b.nombres);
				return a.activo ? -1 : 1;
			});
			setUsuarios(sorted);
		} catch (error) {
			toast.error("Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsuarios();
	}, []);

	// Resetear página al buscar
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	// --- FILTRADO ---
	const filteredUsuarios = usuarios.filter((u) => {
		const term = searchTerm.toLowerCase();
		return (
			u.nombres.toLowerCase().includes(term) ||
			u.apellidos.toLowerCase().includes(term) ||
			u.dni.includes(term)
		);
	});

	// --- PAGINACIÓN LÓGICA ---
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredUsuarios.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	// --- EXPORTAR EXCEL ---
	const exportarExcel = () => {
		// Exportamos TODOS los filtrados (o todos los usuarios si no hay filtro)
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
			"Registrado Por (Nombre)": u.creador_nombre || "Sistema",
			"Registrado Por (Email)": u.creador_email || "-",
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

	// Confirmar Baja
	const confirmDelete = (user) => {
		setUsuarioToDelete(user);
		setIsDeleteModalOpen(true);
	};

	// Ejecutar Baja (Soft Delete)
	const executeDelete = async () => {
		if (!usuarioToDelete) return;
		try {
			await api.delete(`/usuarios/${usuarioToDelete.id}`);
			toast.success("Colaborador dado de baja");
			fetchUsuarios();
			setIsDeleteModalOpen(false);
			setUsuarioToDelete(null);
		} catch (error) {
			console.error(error);
			toast.error("Error al anular usuario");
		}
	};

	// NUEVO: Ejecutar Reactivación
	const handleActivate = async (user) => {
		try {
			await api.put(`/usuarios/${user.id}/activate`);
			toast.success(`Colaborador ${user.nombres} reactivado`);
			fetchUsuarios();
		} catch (error) {
			console.error(error);
			toast.error("Error al reactivar usuario");
		}
	};

	const handleFormSuccess = () => {
		setIsFormModalOpen(false);
		fetchUsuarios();
	};

	if (loading) return <div style={{ padding: "2rem" }}>Cargando...</div>;

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Directorio de Personal</h1>

				<div style={{ display: "flex", gap: "10px" }}>
					<button
						onClick={exportarExcel}
						className='btn-add'
						style={{ background: "#10b981", borderColor: "#10b981" }}
					>
						<FaFileExcel /> Exportar Excel
					</button>

					<button className='btn-add' onClick={handleAdd}>
						<FaPlus /> Nuevo Colaborador
					</button>
				</div>
			</div>

			{/* --- BARRA DE BÚSQUEDA NUEVA --- */}
			<div
				style={{
					marginBottom: "20px",
					background: "white",
					padding: "10px 15px",
					borderRadius: "8px",
					border: "1px solid #e2e8f0",
					display: "flex",
					alignItems: "center",
					gap: "10px",
				}}
			>
				<FaSearch color='#94a3b8' />
				<input
					type='text'
					placeholder='Buscar por Nombre o DNI...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					style={{
						border: "none",
						outline: "none",
						width: "100%",
						fontSize: "0.95rem",
						color: "#334155",
					}}
				/>
			</div>

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div
						className='no-data'
						style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}
					>
						No se encontraron colaboradores.
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
								<th>Cargo</th>
								<th style={{ textAlign: "center" }}>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((user) => {
								const isWoman = user.genero === "mujer";
								const rowStyle = !user.activo
									? { opacity: 0.7, background: "#f8fafc" } // Un poco más visible que antes
									: {};

								return (
									<tr key={user.id} style={rowStyle}>
										<td>
											{user.activo ? (
												<span
													className='status-badge operativo'
													style={{ fontSize: "0.65rem" }}
												>
													ACTIVO
												</span>
											) : (
												<span
													className='status-badge malogrado'
													style={{ fontSize: "0.65rem" }}
												>
													INACTIVO
												</span>
											)}
										</td>

										<td style={{ fontWeight: "bold", color: "#64748b" }}>
											{user.dni}
										</td>

										<td>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "10px",
												}}
											>
												<div
													style={{
														background: user.activo
															? isWoman
																? "#fce7f3"
																: "#e0e7ff"
															: "#e2e8f0",
														color: user.activo
															? isWoman
																? "#db2777"
																: "#4338ca"
															: "#94a3b8",
														padding: "10px",
														borderRadius: "50%",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														width: "40px",
														height: "40px",
													}}
												>
													{isWoman ? <FaUser /> : <FaUserTie />}
												</div>
												<div
													style={{ display: "flex", flexDirection: "column" }}
												>
													<span
														style={{
															fontWeight: "600",
															color: user.activo ? "#1e293b" : "#94a3b8",
														}}
													>
														{user.nombres} {user.apellidos}
													</span>
													{user.creador_nombre && (
														<span
															style={{ fontSize: "0.65rem", color: "#94a3b8" }}
														>
															Reg: {user.creador_nombre}
														</span>
													)}
												</div>
											</div>
										</td>

										<td>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													color: "#64748b",
													fontSize: "0.9rem",
												}}
											>
												<FaEnvelope
													style={{ marginRight: "8px", color: "#94a3b8" }}
												/>
												{user.correo}
											</div>
										</td>

										<td>
											{user.telefono && user.activo ? (
												<a
													href={`https://wa.me/${user.telefono.replace(/\s+/g, "")}`}
													target='_blank'
													rel='noreferrer'
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: "5px",
														background: "#dcfce7",
														color: "#16a34a",
														padding: "4px 10px",
														borderRadius: "20px",
														textDecoration: "none",
														fontWeight: "600",
														fontSize: "0.8rem",
														border: "1px solid #bbf7d0",
													}}
												>
													<FaWhatsapp style={{ fontSize: "1rem" }} />{" "}
													{user.telefono}
												</a>
											) : (
												<span style={{ color: "#cbd5e1" }}>-</span>
											)}
										</td>

										<td>
											<div style={{ display: "flex", flexDirection: "column" }}>
												<span style={{ fontSize: "0.85rem", color: "#475569" }}>
													{user.empresa}
												</span>
												<span
													className='status-badge mantenimiento'
													style={{
														marginTop: "4px",
														width: "fit-content",
														fontSize: "0.65rem",
													}}
												>
													{user.cargo}
												</span>
											</div>
										</td>

										<td style={{ textAlign: "center" }}>
											<div
												style={{
													display: "flex",
													gap: "8px",
													justifyContent: "center",
												}}
											>
												{user.activo ? (
													// OPCIONES SI ESTÁ ACTIVO: EDITAR Y DAR DE BAJA
													<>
														<button
															className='action-btn'
															onClick={() => handleEdit(user)}
															style={{ color: "#f59e0b" }}
															title='Editar'
														>
															<FaEdit />
														</button>
														<button
															className='action-btn'
															onClick={() => confirmDelete(user)}
															style={{ color: "#ef4444" }}
															title='Dar de baja'
														>
															<FaBan />
														</button>
													</>
												) : (
													// OPCIÓN SI ESTÁ INACTIVO: REACTIVAR
													<button
														className='action-btn'
														onClick={() => handleActivate(user)}
														style={{
															color: "#10b981",
															background: "#ecfdf5",
															padding: "5px",
															borderRadius: "50%",
														}}
														title='Reactivar Usuario'
													>
														<FaUndo />
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}

				{/* --- PAGINACIÓN FOOTER --- */}
				{filteredUsuarios.length > 0 && (
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "15px 20px",
							borderTop: "1px solid #e2e8f0",
							background: "#f8fafc",
						}}
					>
						<div style={{ color: "#64748b", fontSize: "0.9rem" }}>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, filteredUsuarios.length)}
							</strong>{" "}
							de <strong>{filteredUsuarios.length}</strong>
						</div>
						<div style={{ display: "flex", gap: "5px" }}>
							<button
								onClick={() => paginate(currentPage - 1)}
								disabled={currentPage === 1}
								style={{
									padding: "6px 12px",
									border: "1px solid #e2e8f0",
									borderRadius: "6px",
									background: "white",
									cursor: currentPage === 1 ? "not-allowed" : "pointer",
									color: "#64748b",
								}}
							>
								<FaChevronLeft size={12} />
							</button>
							<button
								onClick={() => paginate(currentPage + 1)}
								disabled={currentPage === totalPages}
								style={{
									padding: "6px 12px",
									border: "1px solid #e2e8f0",
									borderRadius: "6px",
									background: "white",
									cursor:
										currentPage === totalPages ? "not-allowed" : "pointer",
									color: "#64748b",
								}}
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
				<div style={{ padding: "1rem", textAlign: "center" }}>
					<div
						style={{
							fontSize: "3rem",
							color: "#f59e0b",
							marginBottom: "1rem",
							background: "#fffbeb",
							width: "80px",
							height: "80px",
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							margin: "0 auto 1rem auto",
						}}
					>
						<FaExclamationTriangle />
					</div>

					<h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>
						¿Estás seguro?
					</h3>
					<p style={{ color: "#64748b", marginBottom: "2rem" }}>
						Estás a punto de dar de baja a{" "}
						<strong>
							{usuarioToDelete?.nombres} {usuarioToDelete?.apellidos}
						</strong>
						.<br />
						Pasará a estado <strong>INACTIVO</strong>.
					</p>

					<div
						style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
					>
						<button
							onClick={() => setIsDeleteModalOpen(false)}
							style={{
								padding: "10px 20px",
								borderRadius: "8px",
								border: "1px solid #cbd5e1",
								background: "white",
								color: "#64748b",
								cursor: "pointer",
								fontWeight: "600",
								display: "flex",
								alignItems: "center",
								gap: "5px",
							}}
						>
							<FaTimes /> Cancelar
						</button>
						<button
							onClick={executeDelete}
							style={{
								padding: "10px 20px",
								borderRadius: "8px",
								border: "none",
								background: "#ef4444",
								color: "white",
								cursor: "pointer",
								fontWeight: "600",
								display: "flex",
								alignItems: "center",
								gap: "5px",
								boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
							}}
						>
							<FaCheck /> Confirmar Baja
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default Usuarios;
