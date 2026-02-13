import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import Select from "react-select"; // <-- IMPORTACIÓN DE REACT-SELECT
import {
	FaPlus,
	FaEye,
	FaEdit,
	FaLaptop,
	FaCalendarAlt,
	FaBarcode,
	FaFileExcel,
	FaSearch,
	FaChevronLeft,
	FaChevronRight,
	FaExclamationTriangle,
	FaBan,
	FaUndo,
	FaTimes,
	FaCheck,
	FaHandshake,
	FaBuilding,
} from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import AddEquipoForm from "./AddEquipoForm";
import "./Equipos.scss";

const Equipos = () => {
	const [equipos, setEquipos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState(null);

	// --- FILTROS ---
	const [searchTerm, setSearchTerm] = useState("");
	const [filterCondicion, setFilterCondicion] = useState({
		value: "todos",
		label: "Todos los Equipos",
	});

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Modales
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [modalType, setModalType] = useState("specs");

	// Selección
	const [selectedEquipo, setSelectedEquipo] = useState(null);
	const [equipoToEdit, setEquipoToEdit] = useState(null);
	const [equipoToDelete, setEquipoToDelete] = useState(null);

	// Opciones para el filtro de React-Select
	const condicionOptions = [
		{ value: "todos", label: "Todos los Equipos" },
		{ value: "propios", label: "Equipos Propios" },
		{ value: "alquilados", label: "Equipos Alquilados" },
	];

	// 1. CARGAR DATOS
	const fetchData = async () => {
		setLoading(true);
		try {
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id));

			const resEquipos = await api.get("/equipos");
			const sorted = resEquipos.data.sort((a, b) => {
				if (a.activo === b.activo) return b.id - a.id;
				return a.activo === false ? 1 : -1;
			});
			setEquipos(sorted);
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

	// Reiniciar paginación cuando cambia algún filtro
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterCondicion]);

	const formatAntiguedad = (ant) => {
		if (!ant || (typeof ant === "object" && Object.keys(ant).length === 0)) {
			return "Nuevo (Hoy)";
		}
		const { years, months, days } = ant;
		let parts = [];
		if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
		if (months) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
		if (!years && !months && days)
			parts.push(`${days} ${days === 1 ? "día" : "días"}`);
		return parts.length > 0 ? parts.join(", ") : "Nuevo (Hoy)";
	};

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const renderDate = (dateString) => {
		if (!dateString) return <span className='no-date'>-</span>;
		return formatDate(dateString);
	};

	// --- LÓGICA DE FILTRADO COMBINADO ---
	const filteredEquipos = equipos.filter((item) => {
		// 1. Filtro por Búsqueda de texto
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			(item.marca || "").toLowerCase().includes(term) ||
			(item.modelo || "").toLowerCase().includes(term) ||
			(item.serie || "").toLowerCase().includes(term);

		// 2. Filtro por Condición (Select)
		let matchesCondicion = true;
		if (filterCondicion.value === "propios") {
			matchesCondicion = item.proveedor_id === null; // No tiene proveedor
		} else if (filterCondicion.value === "alquilados") {
			matchesCondicion = item.proveedor_id !== null; // Tiene proveedor
		}

		return matchesSearch && matchesCondicion;
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredEquipos.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	// --- EXPORTAR EXCEL ---
	const exportarExcel = () => {
		const dataParaExcel = filteredEquipos.map((e) => ({
			ID: e.id,
			Marca: e.marca,
			Modelo: e.modelo,
			Serie: e.serie,
			Estado: e.activo !== false ? e.estado.toUpperCase() : "INACTIVO",
			Observaciones: e.ultima_observacion || "Ninguna",
			"Fecha Compra/Inicio": e.fecha_compra
				? new Date(e.fecha_compra).toLocaleDateString()
				: "-",
			Antigüedad: e.antiguedad_obj
				? `${e.antiguedad_obj.years || 0}a ${e.antiguedad_obj.months || 0}m`
				: "Nuevo",
			Condición: e.proveedor_id ? "ALQUILADO" : "PROPIO",
			"Empresa Propietaria": e.proveedor_id ? "-" : e.empresa || "N/A",
			Proveedor: e.nombre_proveedor || "-",
			"Teléfono Prov.": e.telefono_proveedor || "-",
			"Fin Contrato": e.fecha_fin_alquiler
				? new Date(e.fecha_fin_alquiler).toLocaleDateString()
				: "-",
			"Registrado Por": e.creador_nombre || "Sistema",
			"Fecha Registro": new Date(e.created_at).toLocaleString(),
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Inventario_Completo");
		XLSX.writeFile(wb, "Reporte_Equipos_Detallado.xlsx");
	};

	// --- MANEJO DE ACCIONES ---
	const handleViewSpecs = (equipo) => {
		setModalType("specs");
		setSelectedEquipo(equipo);
		setIsModalOpen(true);
	};
	const handleAddEquipo = () => {
		setModalType("form");
		setEquipoToEdit(null);
		setIsModalOpen(true);
	};
	const handleEditEquipo = (equipo) => {
		setModalType("form");
		setEquipoToEdit(equipo);
		setIsModalOpen(true);
	};

	const confirmDelete = (equipo) => {
		setEquipoToDelete(equipo);
		setIsDeleteModalOpen(true);
	};

	const executeDelete = async () => {
		if (!equipoToDelete) return;
		try {
			await api.put(`/equipos/${equipoToDelete.id}/deactivate`);
			toast.success("Equipo dado de baja exitosamente");
			fetchData();
			setIsDeleteModalOpen(false);
			setEquipoToDelete(null);
		} catch (error) {
			toast.error("Error al dar de baja el equipo");
		}
	};

	const handleActivate = async (equipo) => {
		try {
			await api.put(`/equipos/${equipo.id}/activate`);
			toast.success(`Equipo reactivado`);
			fetchData();
		} catch (error) {
			toast.error("Error al reactivar equipo");
		}
	};

	const handleFormSuccess = () => {
		setIsModalOpen(false);
		fetchData();
	};

	const generateCode = (id) => `EQ-${id.toString().padStart(4, "0")}`;

	// Estilos personalizados para React-Select (Diseño estándar del sistema)
	const customFilterStyles = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: "white",
			border: state.isFocused ? "1px solid #7c3aed" : "1px solid #e2e8f0",
			borderRadius: "12px",
			padding: "2px 6px",
			minHeight: "46px", // Para igualar la altura del buscador
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

	if (loading)
		return <div className='loading-state'>Cargando inventario...</div>;

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Inventario de Equipos</h1>
				<div className='header-actions'>
					<button
						onClick={exportarExcel}
						className='btn-action-header btn-excel'
					>
						<FaFileExcel /> Exportar Excel
					</button>
					<button
						className='btn-action-header btn-add'
						onClick={handleAddEquipo}
					>
						<FaPlus /> Nuevo Equipo
					</button>
				</div>
			</div>

			{/* --- NUEVA BARRA DE FILTROS --- */}
			<div className='filters-bar'>
				<div className='search-input'>
					<FaSearch color='#94a3b8' />
					<input
						type='text'
						placeholder='Buscar por Marca, Modelo o Serie...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className='condition-filter'>
					<Select
						options={condicionOptions}
						value={filterCondicion}
						onChange={setFilterCondicion}
						styles={customFilterStyles}
						isSearchable={false}
					/>
				</div>
			</div>

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>No se encontraron equipos.</div>
				) : (
					<table>
						<thead>
							<tr>
								<th className='center'>Icono</th>
								<th>Equipo</th>
								<th>Serie (S/N)</th>
								<th>Fecha Compra</th>
								<th>Antigüedad</th>
								<th>Auditoría</th>
								<th>Estado</th>
								<th className='center'>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((item) => (
								<tr
									key={item.id}
									className={item.activo === false ? "inactive-row" : ""}
								>
									<td className='center'>
										<div className='device-icon-box'>
											<FaLaptop />
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span className='name'>{item.marca}</span>
											<span className='audit-text'>{item.modelo}</span>
										</div>
									</td>
									<td>
										<div className='barcode-badge'>
											<FaBarcode /> {item.serie}
										</div>
									</td>
									<td>
										<div className='email-cell'>
											<FaCalendarAlt /> {renderDate(item.fecha_compra)}
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span
												className='name'
												style={{ color: "#4f46e5", fontSize: "0.85rem" }}
											>
												{formatAntiguedad(item.antiguedad_obj)}
											</span>
											<span className='audit-text'>tiempo en almacén</span>
										</div>
									</td>
									<td>
										<div className='audit-cell'>
											{item.creador_nombre ? (
												<div className='user-info'>
													<span className='name'>{item.creador_nombre}</span>
													<span className='audit-text'>
														{item.creador_email}
													</span>
												</div>
											) : (
												<span className='system-text'>Sistema</span>
											)}
										</div>
									</td>
									<td>
										<span
											className={`status-badge ${item.activo === false ? "malogrado" : item.estado}`}
										>
											{item.activo === false ? "INACTIVO" : item.estado}
										</span>
									</td>
									<td>
										<div className='actions-cell'>
											<button
												className='action-btn view'
												onClick={() => handleViewSpecs(item)}
												title='Ver Ficha'
											>
												<FaEye />
											</button>
											{item.activo !== false ? (
												<>
													<button
														className='action-btn edit'
														onClick={() => handleEditEquipo(item)}
														title='Editar'
													>
														<FaEdit />
													</button>
													{userRole === 1 && (
														<button
															className='action-btn delete'
															onClick={() => confirmDelete(item)}
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
														onClick={() => handleActivate(item)}
														title='Reactivar Equipo'
													>
														<FaUndo />
													</button>
												)
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{filteredEquipos.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, filteredEquipos.length)}
							</strong>{" "}
							de <strong>{filteredEquipos.length}</strong>
						</div>
						<div className='controls'>
							<button
								onClick={() => paginate(currentPage - 1)}
								disabled={currentPage === 1}
							>
								<FaChevronLeft size={12} />
							</button>
							{[...Array(totalPages)].map((_, i) => (
								<button
									key={i + 1}
									onClick={() => paginate(i + 1)}
									className={currentPage === i + 1 ? "active" : ""}
									disabled={currentPage === i + 1}
								>
									{i + 1}
								</button>
							))}
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
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={
					modalType === "specs"
						? `Ficha Técnica: ${selectedEquipo?.modelo || "Detalle"}`
						: equipoToEdit
							? "Editar Equipo"
							: "Registrar Nuevo Equipo"
				}
			>
				{modalType === "specs" ? (
					selectedEquipo && (
						<div className='specs-grid'>
							<div className='header-specs'>
								<div className='big-icon'>
									<FaLaptop />
								</div>
								<div className='title-info-wrapper'>
									<h3>
										{selectedEquipo.marca} {selectedEquipo.modelo}
									</h3>

									<div className='badge-wrapper'>
										<span
											className={`status-badge ${selectedEquipo.activo === false ? "malogrado" : selectedEquipo.estado}`}
										>
											{selectedEquipo.activo === false
												? "INACTIVO"
												: selectedEquipo.estado}
										</span>

										{selectedEquipo.proveedor_id ? (
											<span className='ownership-badge rented'>
												<FaHandshake /> ALQUILADO
											</span>
										) : (
											<span className='ownership-badge owned'>
												<FaBuilding /> PROPIO
											</span>
										)}
									</div>

									<div className='owner-info-text'>
										{selectedEquipo.proveedor_id ? (
											<>
												Proveedor:{" "}
												<strong>
													{selectedEquipo.nombre_proveedor || "Desconocido"}
												</strong>
											</>
										) : (
											<>
												Empresa Titular:{" "}
												<strong>
													{selectedEquipo.empresa || "No especificada"}
												</strong>
											</>
										)}
									</div>

									{selectedEquipo.proveedor_id &&
										selectedEquipo.fecha_fin_alquiler && (
											<div className='owner-info-text sub-text'>
												Vence: {formatDate(selectedEquipo.fecha_fin_alquiler)}
											</div>
										)}
								</div>
							</div>

							{selectedEquipo.estado !== "operativo" &&
								selectedEquipo.ultima_observacion && (
									<div className='observation-alert'>
										<h5>
											<FaExclamationTriangle /> Observaciones / Estado
										</h5>
										<p>"{selectedEquipo.ultima_observacion}"</p>
									</div>
								)}

							<h4>Identificación</h4>
							<div className='grid-2-col'>
								<div className='info-box light'>
									<FaBarcode className='icon-barcode' />
									<div>
										<span className='label'>Código Interno</span>
										<span className='value'>
											{generateCode(selectedEquipo.id)}
										</span>
									</div>
								</div>
								<div className='info-box'>
									<span className='label'>Número de Serie (S/N)</span>
									<span className='value'>{selectedEquipo.serie}</span>
								</div>
							</div>

							<div className='grid-2-col'>
								<div className='info-box'>
									<span className='label'>Fecha de Compra</span>
									<strong className='value-text'>
										{formatDate(selectedEquipo.fecha_compra)}
									</strong>
								</div>
								<div className='info-box'>
									<span className='label'>Antigüedad</span>
									<strong className='value-text' style={{ color: "#4f46e5" }}>
										{formatAntiguedad(selectedEquipo.antiguedad_obj)}
									</strong>
								</div>
							</div>

							{selectedEquipo.especificaciones &&
								Object.keys(selectedEquipo.especificaciones).length > 0 && (
									<>
										<h4 className='mt'>Especificaciones Técnicas</h4>
										<div className='specs-list'>
											{Object.entries(selectedEquipo.especificaciones).map(
												([key, value], index) => (
													<div
														key={key}
														className={`spec-item ${index % 2 !== 0 ? "odd" : ""}`}
													>
														<strong>{key.replace(/_/g, " ")}:</strong>
														<span>{value || "N/A"}</span>
													</div>
												),
											)}
										</div>
									</>
								)}
						</div>
					)
				) : (
					<AddEquipoForm
						onSuccess={handleFormSuccess}
						equipoToEdit={equipoToEdit}
					/>
				)}
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
						Estás a punto de dar de baja el equipo{" "}
						<strong>
							{equipoToDelete?.marca} {equipoToDelete?.modelo}
						</strong>{" "}
						(S/N: {equipoToDelete?.serie}).
						<br />
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

export default Equipos;
