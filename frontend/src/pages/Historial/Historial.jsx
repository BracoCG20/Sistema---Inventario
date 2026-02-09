import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import Select from "react-select"; // <--- Importamos la librería
import {
	FaFileExcel,
	FaSearch,
	FaUserShield,
	FaClock,
	FaArrowUp,
	FaArrowDown,
	FaLaptop,
	FaUser,
	FaChevronLeft,
	FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Importamos el SCSS específico
import "./Historial.scss";

const Historial = () => {
	const [historial, setHistorial] = useState([]);
	const [filtroTexto, setFiltroTexto] = useState("");
	const [filtroTipo, setFiltroTipo] = useState({
		value: "todos",
		label: "Todos los movimientos",
	}); // Estado objeto para react-select
	const [loading, setLoading] = useState(true);

	// Estados paginación
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// Opciones para el filtro de tipo
	const typeOptions = [
		{ value: "todos", label: "Todos los movimientos" },
		{ value: "entrega", label: "Entregas" },
		{ value: "devolucion", label: "Devoluciones" },
	];

	// Estilos personalizados para React-Select (Para que coincida con tu diseño)
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			minHeight: "45px",
			borderRadius: "8px",
			border: "1px solid #e2e8f0",
			boxShadow: "none",
			fontSize: "0.95rem",
			paddingLeft: "5px",
			"&:hover": { borderColor: "#4f46e5" },
			borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#4f46e5"
				: state.isFocused
					? "#f1f5f9"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
			fontSize: "0.9rem",
		}),
		singleValue: (provided) => ({
			...provided,
			color: "#334155",
			fontWeight: "500",
		}),
	};

	useEffect(() => {
		const fetchHistorial = async () => {
			try {
				const res = await api.get("/historial");
				setHistorial(res.data);
			} catch (error) {
				console.error(error);
				toast.error("Error cargando el historial");
			} finally {
				setLoading(false);
			}
		};
		fetchHistorial();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [filtroTexto, filtroTipo]);

	const formatDateTime = (isoString) => {
		if (!isoString) return "-";
		const date = new Date(isoString);
		return date.toLocaleString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDuration = (intervalObj) => {
		if (!intervalObj) return "-";
		let texto = [];
		if (intervalObj.years) texto.push(`${intervalObj.years} años`);
		if (intervalObj.months) texto.push(`${intervalObj.months} meses`);
		if (intervalObj.days) texto.push(`${intervalObj.days} días`);
		if (texto.length === 0) return "Reciente (Hoy)";
		return texto.join(", ");
	};

	const exportarExcel = () => {
		const dataParaExcel = historial.map((h) => ({
			Fecha: formatDateTime(h.fecha_movimiento),
			Tipo: h.tipo.toUpperCase(),
			Marca: h.marca,
			Modelo: h.modelo,
			Serie: h.serie,
			Empleado: `${h.empleado_nombre} ${h.empleado_apellido}`,
			DNI: h.dni || "-",
			Responsable: h.admin_nombre ? h.admin_nombre : "Sistema",
			"Correo Responsable": h.admin_correo || "-",
			"Tiempo de Uso":
				h.tipo === "entrega" ? formatDuration(h.tiempo_uso) : "-",
			"Estado Final": h.estado_equipo_momento || "-",
			Observaciones: h.observaciones || "",
		}));
		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Historial");
		XLSX.writeFile(wb, "Reporte_Historial_GTH.xlsx");
	};

	// --- FILTRADO ---
	const historialFiltrado = historial.filter((h) => {
		const coincideTexto =
			h.empleado_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
			h.serie?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
			h.modelo?.toLowerCase().includes(filtroTexto.toLowerCase());

		const coincideTipo =
			filtroTipo.value === "todos" || h.tipo.toLowerCase() === filtroTipo.value;

		return coincideTexto && coincideTipo;
	});

	// Paginación
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = historialFiltrado.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(historialFiltrado.length / itemsPerPage);
	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	if (loading) return <div className='loading'>Cargando Historial...</div>;

	return (
		<div className='historial-container'>
			<div className='page-header'>
				<h1>Historial y Auditoría</h1>
				<button onClick={exportarExcel} className='btn-excel'>
					<FaFileExcel /> Exportar a Excel
				</button>
			</div>

			{/* BARRA DE FILTROS */}
			<div className='filters-bar'>
				<div className='search-input'>
					<FaSearch color='#94a3b8' />
					<input
						type='text'
						placeholder='Buscar por empleado, serie o modelo...'
						value={filtroTexto}
						onChange={(e) => setFiltroTexto(e.target.value)}
					/>
				</div>

				{/* REACT SELECT PARA FILTRO DE TIPO */}
				<div className='type-filter'>
					<Select
						options={typeOptions}
						value={filtroTipo}
						onChange={setFiltroTipo} // react-select pasa el objeto opción directamente
						styles={customSelectStyles}
						isSearchable={false}
						placeholder='Tipo de Movimiento'
					/>
				</div>
			</div>

			{/* TABLA CON TUS ESTILOS CONSERVADOS */}
			<div className='table-container'>
				<table>
					<thead>
						<tr>
							<th>Fecha</th>
							<th>Tipo</th>
							<th>Equipo</th>
							<th>Empleado</th>
							<th>Auditoría</th>
							<th>Tiempo de Uso</th>
							<th style={{ textAlign: "center" }}>Estado</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.length > 0 ? (
							currentItems.map((h) => (
								<tr key={h.id}>
									<td style={{ color: "#64748b" }}>
										<div className='flex-center'>
											<FaClock /> {formatDateTime(h.fecha_movimiento)}
										</div>
									</td>
									<td>
										<span className={`badge-type ${h.tipo}`}>
											{h.tipo === "entrega" ? <FaArrowUp /> : <FaArrowDown />}
											{h.tipo}
										</span>
									</td>
									<td>
										<div className='flex-center'>
											<div className='icon-circle'>
												<FaLaptop size={12} />
											</div>
											<div>
												<strong style={{ display: "block", color: "#334155" }}>
													{h.marca} {h.modelo}
												</strong>
												<span className='sn-badge'>SN: {h.serie}</span>
											</div>
										</div>
									</td>
									<td>
										<div className='flex-center'>
											<div className='icon-circle user'>
												<FaUser size={12} />
											</div>
											<div>
												<span
													style={{
														display: "block",
														fontWeight: 600,
														color: "#334155",
													}}
												>
													{h.empleado_nombre} {h.empleado_apellido}
												</span>
												{h.dni && (
													<span
														style={{ fontSize: "0.7rem", color: "#94a3b8" }}
													>
														DNI: {h.dni}
													</span>
												)}
											</div>
										</div>
									</td>
									<td>
										{h.admin_nombre ? (
											<div style={{ fontSize: "0.8rem" }}>
												<div
													style={{
														fontWeight: 600,
														color: "#4f46e5",
														display: "flex",
														alignItems: "center",
														gap: "5px",
													}}
												>
													<FaUserShield size={12} /> {h.admin_nombre}
												</div>
												<div style={{ color: "#64748b", fontSize: "0.7rem" }}>
													{h.admin_correo}
												</div>
											</div>
										) : (
											<span
												style={{
													color: "#cbd5e1",
													fontStyle: "italic",
													fontSize: "0.75rem",
												}}
											>
												Sistema
											</span>
										)}
									</td>
									<td>
										{h.tipo === "entrega" ? (
											<span
												style={{
													fontWeight: 600,
													color: "#059669",
													background: "#ecfdf5",
													padding: "2px 6px",
													borderRadius: "4px",
													fontSize: "0.8rem",
												}}
											>
												{formatDuration(h.tiempo_uso)}
											</span>
										) : (
											<span style={{ color: "#cbd5e1" }}>-</span>
										)}
									</td>
									<td style={{ textAlign: "center" }}>
										{h.tipo === "devolucion" && h.estado_equipo_momento ? (
											<span
												className={`status-text ${h.estado_equipo_momento === "operativo" ? "ok" : "bad"}`}
											>
												{h.estado_equipo_momento}
											</span>
										) : (
											<span style={{ color: "#cbd5e1" }}>-</span>
										)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan='7'
									style={{
										textAlign: "center",
										padding: "30px",
										color: "#94a3b8",
									}}
								>
									No se encontraron registros que coincidan.
								</td>
							</tr>
						)}
					</tbody>
				</table>

				{/* Footer Paginación */}
				{currentItems.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> -{" "}
							<strong>
								{Math.min(indexOfLastItem, historialFiltrado.length)}
							</strong>{" "}
							de <strong>{historialFiltrado.length}</strong>
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
		</div>
	);
};

export default Historial;
