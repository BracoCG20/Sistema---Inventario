import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
	FaHandHoldingUsd,
	FaPlus,
	FaSearch,
	FaExclamationTriangle,
	FaTimes,
	FaCheck,
	FaFileExcel,
	FaEye,
	FaUser,
	FaIdCard,
	FaPhone,
	FaLaptop,
	FaBarcode,
	FaFileUpload,
	FaFileAlt,
	FaDownload,
	FaTrash,
} from "react-icons/fa";
import Modal from "../../components/Modal/Modal";
import AlquilerList from "./components/AlquilerList";
import AlquilerForm from "./components/AlquilerForm";
import "./Alquileres.scss";

const Alquileres = () => {
	const [alquileres, setAlquileres] = useState([]);
	const [equiposPropios, setEquiposPropios] = useState([]); // Todos los equipos operativos
	const [loading, setLoading] = useState(true);

	// --- BUSCADOR Y PAGINACIÓN ---
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// --- MODALES ---
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [itemToCancel, setItemToCancel] = useState(null);

	// Modal de Vista Previa
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
	const [selectedAlquiler, setSelectedAlquiler] = useState(null);
	const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [resAlq, resEq] = await Promise.all([
				api.get("/alquileres"),
				api.get("/equipos"),
			]);
			setAlquileres(resAlq.data);
			setEquiposPropios(
				resEq.data.filter(
					(e) => e.proveedor_id === null && e.estado === "operativo",
				),
			);
		} catch (error) {
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

	// Sincronizar modal de vista previa tras subidas/bajas de archivos
	useEffect(() => {
		if (selectedAlquiler) {
			const updated = alquileres.find((a) => a.id === selectedAlquiler.id);
			if (updated) setSelectedAlquiler(updated);
		}
	}, [alquileres]);

	// --- LÓGICA DE EXPORTACIÓN EXCEL ---
	const exportarExcel = () => {
		const dataParaExcel = filteredAlquileres.map((a) => ({
			"ID CONTRATO": a.id,
			ESTADO: a.estado.toUpperCase(),
			CLIENTE: a.cliente_nombre,
			DOCUMENTO: a.cliente_documento || "N/A",
			TELÉFONO: a.cliente_telefono || "N/A",
			EQUIPO: `${a.marca} ${a.modelo}`,
			SERIE: a.serie,
			IMPORTE: a.precio_alquiler,
			MONEDA: a.moneda,
			FRECUENCIA: a.frecuencia_pago,
			"FECHA INICIO": new Date(a.fecha_inicio).toLocaleDateString(),
			"FECHA FIN": a.fecha_fin
				? new Date(a.fecha_fin).toLocaleDateString()
				: "Indefinido",
			"REGISTRADO POR": a.creador_nombre || "Sistema",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Alquileres");
		XLSX.writeFile(
			wb,
			`Reporte_Alquileres_${new Date().toLocaleDateString()}.xlsx`,
		);
	};

	const filteredAlquileres = alquileres.filter((item) => {
		const term = searchTerm.toLowerCase();
		return (
			(item.cliente_nombre?.toLowerCase() || "").includes(term) ||
			(item.marca?.toLowerCase() || "").includes(term) ||
			(item.modelo?.toLowerCase() || "").includes(term) ||
			(item.serie?.toLowerCase() || "").includes(term)
		);
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredAlquileres.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(filteredAlquileres.length / itemsPerPage);

	// =========================================================================
	// NUEVO: FILTRO INTELIGENTE DE EQUIPOS DISPONIBLES
	// =========================================================================
	const equiposOcupadosIds = alquileres
		.filter((alq) => {
			if (alq.estado !== "Activo") return false; // Si está cancelado, el equipo está libre
			if (!alq.fecha_fin) return true; // Contrato indefinido y activo = ocupado

			const endDate = new Date(alq.fecha_fin);
			const today = new Date();
			today.setHours(0, 0, 0, 0); // Ignoramos la hora para comparar solo fechas

			return endDate >= today; // Si la fecha fin es hoy o futuro, está ocupado
		})
		.map((alq) => alq.equipo_id);

	const equiposDisponibles = equiposPropios.filter((equipo) => {
		// Si el equipo no está en la lista de ocupados, lo mostramos
		if (!equiposOcupadosIds.includes(equipo.id)) return true;
		// EXCEPCIÓN: Si estamos editando, tenemos que mostrar el equipo que ya tiene asignado este contrato
		if (editItem && editItem.equipo_id === equipo.id) return true;

		return false;
	});
	// =========================================================================

	// --- GESTIÓN DE ARCHIVOS ---
	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("archivo", file);
		try {
			toast.info("Subiendo documento...");
			await api.post(
				`/alquileres/${selectedAlquiler.id}/subir-factura`,
				formData,
				{
					headers: { "Content-Type": "multipart/form-data" },
				},
			);
			toast.success("Documento guardado");
			fetchData();
		} catch (error) {
			toast.error("Error al subir el archivo");
		}
	};

	const executeFileDelete = async () => {
		try {
			await api.delete(`/alquileres/${selectedAlquiler.id}/eliminar-factura`);
			toast.success("Documento eliminado");
			setIsDeleteFileModalOpen(false);
			fetchData();
		} catch (error) {
			toast.error("Error al eliminar");
		}
	};

	// --- HANDLERS ---
	const handleCreate = async (formData) => {
		try {
			await api.post("/alquileres", formData);
			toast.success("Registrado correctamente");
			setIsModalOpen(false);
			fetchData();
		} catch (e) {
			toast.error(e.response?.data?.error || "Error al registrar");
		}
	};

	const handleUpdate = async (formData) => {
		try {
			await api.put(`/alquileres/${editItem.id}`, formData);
			toast.success("Actualizado correctamente");
			setIsModalOpen(false);
			fetchData();
		} catch (e) {
			toast.error("Error al actualizar");
		}
	};

	const handlePreview = (item) => {
		setSelectedAlquiler(item);
		setIsPreviewModalOpen(true);
	};

	const executeCancelation = async () => {
		try {
			await api.delete(`/alquileres/${itemToCancel.id}`);
			toast.success("Contrato cancelado");
			setIsDeleteModalOpen(false);
			fetchData();
		} catch (e) {
			toast.error("Error al cancelar");
		}
	};

	const handleActivate = async (item) => {
		try {
			await api.put(`/alquileres/${item.id}/activate`);
			toast.success("Reactivado");
			fetchData();
		} catch (e) {
			toast.error("Error al reactivar");
		}
	};

	if (loading) return <div className='loading-state'>Cargando...</div>;

	const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

	return (
		<div className='alquileres-container'>
			<div className='page-header'>
				<h1>
					<FaHandHoldingUsd style={{ marginRight: "10px" }} /> Renta de Equipos
				</h1>
				<div className='header-actions'>
					<button
						className='btn-action-header btn-excel'
						onClick={exportarExcel}
					>
						<FaFileExcel /> Exportar Excel
					</button>
					<button
						className='btn-action-header btn-add'
						onClick={() => {
							setEditItem(null);
							setIsModalOpen(true);
						}}
					>
						<FaPlus /> Nuevo Alquiler
					</button>
				</div>
			</div>

			<div className='search-bar'>
				<FaSearch color='#94a3b8' />
				<input
					type='text'
					placeholder='Buscar por Cliente, Marca o Serie...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>

			<AlquilerList
				alquileres={currentItems}
				onEdit={(item) => {
					setEditItem(item);
					setIsModalOpen(true);
				}}
				onDelete={(item) => {
					setItemToCancel(item);
					setIsDeleteModalOpen(true);
				}}
				onPreview={handlePreview}
				onActivate={handleActivate}
				totalItems={filteredAlquileres.length}
				paginate={(n) => setCurrentPage(n)}
				currentPage={currentPage}
				totalPages={totalPages}
				indexOfFirstItem={indexOfFirstItem}
				indexOfLastItem={indexOfLastItem}
			/>

			{/* Modal Formulario: Pasamos equiposDisponibles en lugar de equiposPropios */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={editItem ? "Editar Contrato" : "Nuevo Alquiler"}
			>
				<AlquilerForm
					onSubmit={editItem ? handleUpdate : handleCreate}
					initialData={editItem}
					equipos={equiposDisponibles}
					onClose={() => setIsModalOpen(false)}
				/>
			</Modal>

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title='Confirmar Cancelación'
			>
				<div className='confirm-modal-content'>
					<div className='warning-icon'>
						<FaExclamationTriangle />
					</div>
					<h3>¿Estás seguro?</h3>
					<p>
						El contrato de <strong>{itemToCancel?.cliente_nombre}</strong>{" "}
						pasará a estado <strong>CANCELADO</strong>.
					</p>
					<div className='modal-actions'>
						<button
							className='btn-cancel'
							onClick={() => setIsDeleteModalOpen(false)}
						>
							<FaTimes /> Regresar
						</button>
						<button className='btn-confirm' onClick={executeCancelation}>
							<FaCheck /> Confirmar
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={isDeleteFileModalOpen}
				onClose={() => setIsDeleteFileModalOpen(false)}
				title='Eliminar Documento'
			>
				<div className='confirm-modal-content'>
					<div
						className='warning-icon'
						style={{ backgroundColor: "#fff1f2", color: "#e11d48" }}
					>
						<FaTrash />
					</div>
					<h3>¿Eliminar archivo?</h3>
					<p>Se borrará el comprobante adjunto permanentemente.</p>
					<div className='modal-actions'>
						<button
							className='btn-cancel'
							onClick={() => setIsDeleteFileModalOpen(false)}
						>
							<FaTimes /> Cancelar
						</button>
						<button
							className='btn-confirm'
							style={{ backgroundColor: "#e11d48" }}
							onClick={executeFileDelete}
						>
							<FaCheck /> Eliminar
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={isPreviewModalOpen}
				onClose={() => setIsPreviewModalOpen(false)}
				title='Detalle del Contrato de Alquiler'
			>
				{selectedAlquiler && (
					<div className='preview-container'>
						<div className='preview-header'>
							<div className='contract-id'>CONTRATO #{selectedAlquiler.id}</div>
							<span
								className={`status-badge ${selectedAlquiler.estado.toLowerCase()}`}
							>
								{selectedAlquiler.estado}
							</span>
						</div>

						<div className='preview-stack'>
							<div className='preview-card'>
								<h5>
									<FaUser /> Información del Cliente
								</h5>
								<div className='detail-item'>
									<label>Nombre:</label>
									<span>{selectedAlquiler.cliente_nombre}</span>
								</div>
								<div className='detail-item'>
									<label>
										<FaIdCard /> Documento:
									</label>
									<span>
										{selectedAlquiler.cliente_documento || "No registrado"}
									</span>
								</div>
								<div className='detail-item'>
									<label>
										<FaPhone /> Teléfono:
									</label>
									<span>
										{selectedAlquiler.cliente_telefono || "No registrado"}
									</span>
								</div>
							</div>
							<div className='preview-card'>
								<h5>
									<FaLaptop /> Detalles del Equipo
								</h5>
								<div className='detail-item'>
									<label>Equipo:</label>
									<span>
										{selectedAlquiler.marca} {selectedAlquiler.modelo}
									</span>
								</div>
								<div className='detail-item'>
									<label>
										<FaBarcode /> Serie:
									</label>
									<span className='serial-code'>{selectedAlquiler.serie}</span>
								</div>
							</div>

							<div className='preview-card documents-section'>
								<h5>
									<FaFileAlt /> Gestión de Documentos / Facturas
								</h5>
								<div className='files-list'>
									{selectedAlquiler.factura_url ? (
										<div className='file-action-box'>
											<div className='file-info-mini'>
												<FaFileAlt className='icon-pdf' />
												<span title={selectedAlquiler.factura_url}>
													{selectedAlquiler.factura_url.substring(0, 25)}...
												</span>
											</div>
											<div className='file-actions'>
												<a
													href={`${baseUrl}/uploads/${selectedAlquiler.factura_url}`}
													target='_blank'
													rel='noopener noreferrer'
													className='btn-file-action view'
													title='Visualizar'
												>
													<FaEye />
												</a>
												<a
													href={`${baseUrl}/uploads/${selectedAlquiler.factura_url}`}
													download={selectedAlquiler.factura_url}
													className='btn-file-action download'
													title='Descargar'
												>
													<FaDownload />
												</a>
												<button
													onClick={() => setIsDeleteFileModalOpen(true)}
													className='btn-file-action delete'
													title='Eliminar documento'
												>
													<FaTrash />
												</button>
											</div>
										</div>
									) : (
										<div className='upload-zone'>
											<input
												type='file'
												id='factura-input'
												hidden
												onChange={handleFileUpload}
											/>
											<label htmlFor='factura-input' className='upload-label'>
												<FaFileUpload />
												<span>Subir Comprobante</span>
												<small>PDF, JPG, PNG (Máx. 5MB)</small>
											</label>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
};

export default Alquileres;
