import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import {
	FaPlus,
	FaEye,
	FaEdit,
	FaTrash,
	FaLaptop,
	FaCalendarAlt,
	FaBarcode,
	FaFileExcel,
	FaSearch,
	FaChevronLeft,
	FaChevronRight,
	FaUserShield,
	FaExclamationTriangle,
} from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import AddEquipoForm from "./AddEquipoForm";
import "./Equipos.scss";

const Equipos = () => {
	const [equipos, setEquipos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// --- LÓGICA DE ROL IGUAL A CONFIGURACION.JSX ---
	const [userRole, setUserRole] = useState(null);

	// Paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Modales
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalType, setModalType] = useState("specs");
	const [selectedEquipo, setSelectedEquipo] = useState(null);
	const [equipoToEdit, setEquipoToEdit] = useState(null);

	// 1. CARGAR DATOS DEL PERFIL Y EQUIPOS
	const fetchData = async () => {
		setLoading(true);
		try {
			// Obtenemos el perfil para validar el rol (Igual que en Configuracion.jsx)
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id));

			// Obtenemos los equipos
			const resEquipos = await api.get("/equipos");
			const sorted = resEquipos.data.sort((a, b) => b.id - a.id);
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

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	// FUNCIÓN PARA FORMATEAR ANTIGÜEDAD
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
		if (!dateString) return <span className='no-date'>-</span>;
		const date = new Date(dateString);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const filteredEquipos = equipos.filter((item) => {
		const term = searchTerm.toLowerCase();
		return (
			item.marca.toLowerCase().includes(term) ||
			item.modelo.toLowerCase().includes(term) ||
			item.serie.toLowerCase().includes(term)
		);
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredEquipos.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	const exportarExcel = () => {
		const dataParaExcel = filteredEquipos.map((e) => ({
			ID: e.id,
			Marca: e.marca,
			Modelo: e.modelo,
			Serie: e.serie,
			Estado: e.estado.toUpperCase(),
			"Fecha Compra": e.fecha_compra
				? new Date(e.fecha_compra).toLocaleDateString()
				: "-",
			Antigüedad: e.antiguedad_obj
				? `${e.antiguedad_obj.years || 0}a ${e.antiguedad_obj.months || 0}m`
				: "Nuevo",
			"Última Observación": e.ultima_observacion || "-",
			"Registrado Por": e.creador_nombre || "Sistema",
			"Empresa de Registro": e.creador_empresa || "-",
			"Fecha Registro": new Date(e.created_at).toLocaleString(),
			"Modificado Por": e.modificador_nombre || "-",
			"Fecha Modificación": e.fecha_modificacion_admin
				? new Date(e.fecha_modificacion_admin).toLocaleString()
				: "Sin cambios",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Inventario");
		XLSX.writeFile(wb, "Reporte_Equipos_Completo.xlsx");
	};

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
	const handleDeleteEquipo = async (id) => {
		if (window.confirm("¿Estás seguro de eliminar este equipo?")) {
			try {
				await api.delete(`/equipos/${id}`);
				toast.success("Equipo eliminado");
				fetchData(); // Recargamos todo
			} catch (error) {
				toast.error("No se pudo eliminar");
			}
		}
	};

	const handleFormSuccess = () => {
		setIsModalOpen(false);
		fetchData();
	};

	const generateCode = (id) => `EQ-${id.toString().padStart(4, "0")}`;

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

			<div className='search-bar'>
				<FaSearch color='#94a3b8' />
				<input
					type='text'
					placeholder='Buscar por Marca, Modelo o Serie...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
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
								<tr key={item.id}>
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
											<FaCalendarAlt /> {formatDate(item.fecha_compra)}
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
										<span className={`status-badge ${item.estado}`}>
											{item.estado}
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
											<button
												className='action-btn edit'
												onClick={() => handleEditEquipo(item)}
												title='Editar'
											>
												<FaEdit />
											</button>

											{/* --- RESTRICCIÓN DE ROL: Comparamos estrictamente con el número 1 --- */}
											{userRole === 1 && (
												<button
													className='action-btn delete'
													onClick={() => handleDeleteEquipo(item.id)}
													title='Eliminar'
												>
													<FaTrash />
												</button>
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
								<div>
									<h3>
										{selectedEquipo.marca} {selectedEquipo.modelo}
									</h3>
									<div className='badge-wrapper'>
										<span className={`status-badge ${selectedEquipo.estado}`}>
											{selectedEquipo.estado}
										</span>
									</div>
								</div>
							</div>

							{selectedEquipo.estado !== "operativo" &&
								selectedEquipo.ultima_observacion && (
									<div className='observation-alert'>
										<h5>
											<FaExclamationTriangle /> Reporte de Devolución
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
		</div>
	);
};

export default Equipos;
