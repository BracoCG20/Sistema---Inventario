import { useEffect, useState } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
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

import "../Equipos/Equipos.scss";

const Historial = () => {
	const [historial, setHistorial] = useState([]);
	const [filtro, setFiltro] = useState("");
	const [loading, setLoading] = useState(true);

	// --- ESTADOS PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

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
	}, [filtro]);

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

	// --- FORMATEO DE TIEMPO (SOLO MESES Y DÍAS) ---
	const formatDuration = (intervalObj) => {
		if (!intervalObj) return "-";

		let texto = [];
		if (intervalObj.years) texto.push(`${intervalObj.years} años`);
		if (intervalObj.months) texto.push(`${intervalObj.months} meses`);
		if (intervalObj.days) texto.push(`${intervalObj.days} días`);

		// Si es menos de 1 día, mostramos "Hoy" o "< 1 día"
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
			// En Excel también respetamos la lógica: solo mostrar tiempo en entregas
			"Tiempo de Uso":
				h.tipo === "entrega" ? formatDuration(h.tiempo_uso) : "-",
			"Estado Final": h.estado_equipo_momento || "-",
			Observaciones: h.observaciones || "",
		}));
		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Historial");
		XLSX.writeFile(wb, "Historial_GTH.xlsx");
	};

	// --- FILTRADO ---
	const historialFiltrado = historial.filter(
		(h) =>
			h.empleado_nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
			h.serie?.toLowerCase().includes(filtro.toLowerCase()) ||
			h.modelo?.toLowerCase().includes(filtro.toLowerCase()),
	);

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
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Historial y Auditoría</h1>
				<button
					onClick={exportarExcel}
					className='btn-action'
					style={{
						background: "#10b981",
						color: "white",
						border: "none",
						padding: "10px 20px",
						borderRadius: "8px",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "10px",
						fontSize: "1rem",
					}}
				>
					<FaFileExcel /> Excel
				</button>
			</div>

			<div
				className='search-bar'
				style={{
					marginBottom: "20px",
					display: "flex",
					alignItems: "center",
					background: "white",
					padding: "10px",
					borderRadius: "8px",
					border: "1px solid #e2e8f0",
				}}
			>
				<FaSearch color='#94a3b8' />
				<input
					type='text'
					placeholder='Buscar por empleado, serie o modelo...'
					value={filtro}
					onChange={(e) => setFiltro(e.target.value)}
					style={{
						border: "none",
						outline: "none",
						marginLeft: "10px",
						width: "100%",
						fontSize: "1rem",
					}}
				/>
			</div>

			<div className='table-container'>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr
							style={{
								background: "#f8fafc",
								color: "#475569",
								textAlign: "left",
								borderBottom: "2px solid #e2e8f0",
							}}
						>
							<th style={{ padding: "12px" }}>Fecha</th>
							<th style={{ padding: "12px" }}>Tipo</th>
							<th style={{ padding: "12px" }}>Equipo</th>
							<th style={{ padding: "12px" }}>Empleado</th>
							<th style={{ padding: "12px" }}>Auditoría</th>
							<th style={{ padding: "12px" }}>Tiempo de Uso</th>
							<th style={{ padding: "12px", textAlign: "center" }}>Estado</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.map((h) => (
							<tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
								<td
									style={{
										padding: "12px",
										fontSize: "0.85rem",
										color: "#64748b",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
										}}
									>
										<FaClock /> {formatDateTime(h.fecha_movimiento)}
									</div>
								</td>
								<td style={{ padding: "12px" }}>
									<span
										style={{
											padding: "4px 8px",
											borderRadius: "6px",
											fontSize: "0.7rem",
											fontWeight: "bold",
											textTransform: "uppercase",
											background: h.tipo === "entrega" ? "#eff6ff" : "#fef2f2",
											color: h.tipo === "entrega" ? "#1d4ed8" : "#b91c1c",
											border:
												h.tipo === "entrega"
													? "1px solid #bfdbfe"
													: "1px solid #fecaca",
											display: "inline-flex",
											alignItems: "center",
											gap: "4px",
										}}
									>
										{h.tipo === "entrega" ? <FaArrowUp /> : <FaArrowDown />}
										{h.tipo}
									</span>
								</td>
								<td style={{ padding: "12px" }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<div
											style={{
												background: "#f1f5f9",
												padding: "6px",
												borderRadius: "50%",
												color: "#64748b",
											}}
										>
											<FaLaptop size={12} />
										</div>
										<div>
											<strong
												style={{
													color: "#334155",
													display: "block",
													fontSize: "0.85rem",
												}}
											>
												{h.marca} {h.modelo}
											</strong>
											<span
												style={{
													fontSize: "0.7rem",
													fontFamily: "monospace",
													color: "#64748b",
													background: "#f8fafc",
													padding: "1px 4px",
													borderRadius: "4px",
													border: "1px solid #e2e8f0",
												}}
											>
												SN: {h.serie}
											</span>
										</div>
									</div>
								</td>
								<td style={{ padding: "12px" }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<div
											style={{
												background: "#fdf2f8",
												padding: "6px",
												borderRadius: "50%",
												color: "#db2777",
											}}
										>
											<FaUser size={12} />
										</div>
										<div>
											<span
												style={{
													color: "#334155",
													fontWeight: "600",
													fontSize: "0.85rem",
													display: "block",
												}}
											>
												{h.empleado_nombre} {h.empleado_apellido}
											</span>
											{h.dni && (
												<span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
													DNI: {h.dni}
												</span>
											)}
										</div>
									</div>
								</td>
								<td style={{ padding: "12px" }}>
									{h.admin_nombre ? (
										<div style={{ fontSize: "0.8rem" }}>
											<div
												style={{
													fontWeight: "600",
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

								{/* COLUMNA TIEMPO DE USO (Lógica Frontend) */}
								<td style={{ padding: "12px" }}>
									{h.tipo === "entrega" ? (
										<span
											style={{
												fontWeight: "600",
												color: "#059669",
												fontSize: "0.8rem",
												background: "#ecfdf5",
												padding: "2px 6px",
												borderRadius: "4px",
											}}
										>
											{formatDuration(h.tiempo_uso)}
										</span>
									) : (
										<span style={{ color: "#cbd5e1" }}>-</span>
									)}
								</td>

								<td style={{ padding: "12px", textAlign: "center" }}>
									{h.tipo === "devolucion" && h.estado_equipo_momento ? (
										<span
											style={{
												fontSize: "0.7rem",
												fontWeight: "bold",
												textTransform: "uppercase",
												color:
													h.estado_equipo_momento === "operativo"
														? "#16a34a"
														: "#ef4444",
											}}
										>
											{h.estado_equipo_momento}
										</span>
									) : (
										<span style={{ color: "#cbd5e1" }}>-</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* PAGINACIÓN */}
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
						Mostrando{" "}
						<span style={{ fontWeight: "bold" }}>
							{historialFiltrado.length > 0 ? indexOfFirstItem + 1 : 0}
						</span>{" "}
						a{" "}
						<span style={{ fontWeight: "bold" }}>
							{Math.min(indexOfLastItem, historialFiltrado.length)}
						</span>{" "}
						de{" "}
						<span style={{ fontWeight: "bold" }}>
							{historialFiltrado.length}
						</span>{" "}
						registros
					</div>
					<div style={{ display: "flex", gap: "5px" }}>
						<button
							onClick={() => paginate(currentPage - 1)}
							disabled={currentPage === 1}
							style={{
								padding: "6px 12px",
								border: "1px solid #e2e8f0",
								borderRadius: "6px",
								background: currentPage === 1 ? "#f1f5f9" : "white",
								cursor: currentPage === 1 ? "not-allowed" : "pointer",
								color: "#64748b",
							}}
						>
							<FaChevronLeft size={12} />
						</button>
						{[...Array(totalPages)].map((_, i) => (
							<button
								key={i + 1}
								onClick={() => paginate(i + 1)}
								style={{
									padding: "6px 12px",
									border:
										currentPage === i + 1
											? "1px solid #4f46e5"
											: "1px solid #e2e8f0",
									borderRadius: "6px",
									background: currentPage === i + 1 ? "#4f46e5" : "white",
									color: currentPage === i + 1 ? "white" : "#64748b",
									cursor: "pointer",
									fontWeight: "600",
									fontSize: "0.9rem",
								}}
							>
								{i + 1}
							</button>
						))}
						<button
							onClick={() => paginate(currentPage + 1)}
							disabled={currentPage === totalPages || totalPages === 0}
							style={{
								padding: "6px 12px",
								border: "1px solid #e2e8f0",
								borderRadius: "6px",
								background:
									currentPage === totalPages || totalPages === 0
										? "#f1f5f9"
										: "white",
								cursor: currentPage === totalPages ? "not-allowed" : "pointer",
								color: "#64748b",
							}}
						>
							<FaChevronRight size={12} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Historial;
