import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import { FaPaperPlane, FaHistory, FaCheck, FaTimes } from "react-icons/fa";
import PdfModal from "../../components/Modal/PdfModal";
import CustomSelect from "../../components/Select/CustomSelect";

// Estilos
import "../Equipos/FormStyles.scss";
import "../Equipos/Equipos.scss";
import logoImg from "../../assets/logo_gruposp.png";
import firmaImg from "../../assets/firma_pierina.png";

const Entrega = () => {
	// Listas filtradas para los Selects
	const [equiposDisponibles, setEquiposDisponibles] = useState([]);
	const [usuariosLibres, setUsuariosLibres] = useState([]);

	// Lista para la tabla visual (solo las últimas)
	const [historialVisual, setHistorialVisual] = useState([]);

	const [loading, setLoading] = useState(true);
	const [showPdfModal, setShowPdfModal] = useState(false);
	const [pdfUrl, setPdfUrl] = useState("");

	const [formData, setFormData] = useState({
		equipo_id: "",
		empleado_id: "",
		cargador: true,
		observaciones: "",
	});

	const fetchData = async () => {
		try {
			// 1. Obtenemos TODO: Equipos, Usuarios y TODO el Historial
			const [resEquipos, resUsuarios, resHistorial] = await Promise.all([
				api.get("/equipos"),
				api.get("/usuarios"),
				api.get("/historial"), // Asegúrate que el backend devuelva todo, sin LIMIT
			]);

			// --- FILTRO 1: EQUIPOS ---
			// Solo mostramos equipos que estén marcados como DISPONIBLES en la BD
			const equiposFiltrados = resEquipos.data.filter(
				(e) => e.estado === "operativo" && e.disponible === true,
			);
			setEquiposDisponibles(equiposFiltrados);

			// --- FILTRO 2: USUARIOS (Lógica Crucial) ---
			// Vamos a calcular quién tiene un equipo ACTUALMENTE basándonos en el historial completo.
			const usuariosOcupadosSet = new Set();

			// Ordenamos el historial del más antiguo al más reciente para "reproducir" los hechos
			const historialCronologico = [...resHistorial.data].sort(
				(a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
			);

			historialCronologico.forEach((mov) => {
				if (mov.tipo === "entrega") {
					// Si se le entregó, entra a la lista de ocupados
					usuariosOcupadosSet.add(mov.empleado_id);
				} else if (mov.tipo === "devolucion") {
					// Si devolvió, sale de la lista de ocupados
					usuariosOcupadosSet.delete(mov.empleado_id);
				}
			});

			// Ahora filtramos la lista total de usuarios:
			// Solo pasan los que estén ACTIVOS y NO estén en el Set de Ocupados
			const usuariosFiltrados = resUsuarios.data.filter((u) => {
				return u.activo === true && !usuariosOcupadosSet.has(u.id);
			});
			setUsuariosLibres(usuariosFiltrados);

			// --- TABLA VISUAL ---
			// Para la tabla de la derecha, sí queremos ver solo lo último (orden inverso)
			const ultimasEntregas = resHistorial.data
				.filter((h) => h.tipo === "entrega")
				.sort(
					(a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
				)
				.slice(0, 10); // Solo las 10 últimas

			setHistorialVisual(ultimasEntregas);
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

	// Mapeo para los Selects
	const equiposOptions = equiposDisponibles.map((eq) => ({
		value: eq.id,
		label: `${eq.marca} ${eq.modelo} - S/N: ${eq.serie}`,
	}));

	const usuariosOptions = usuariosLibres.map((usr) => ({
		value: usr.id,
		label: `${usr.nombres} ${usr.apellidos}`,
	}));

	const handleCheckboxChange = (e) => {
		setFormData({ ...formData, cargador: e.target.checked });
	};

	// Formato de hora corregido (UTC-5)
	const formatDateTime = (isoString) => {
		if (!isoString) return "-";
		const fechaSegura = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
		const date = new Date(fechaSegura);
		return date.toLocaleString("es-PE", {
			timeZone: "America/Lima",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Generación del PDF
	const generarPDFBlob = (equipo, usuario) => {
		const doc = new jsPDF();
		const margenIzq = 25;
		const anchoPagina = 210;
		const anchoUtil = anchoPagina - 50;
		let y = 20;

		doc.addImage(logoImg, "PNG", margenIzq, 10, 40, 15);
		y += 20;

		doc.setFontSize(11);
		doc.setFont("helvetica", "bold");
		const titulo = "ACTA DE ENTREGA DE EQUIPOS";
		const xTitulo = (anchoPagina - doc.getTextWidth(titulo)) / 2;
		doc.text(titulo, xTitulo, y);
		doc.line(xTitulo, y + 1, xTitulo + doc.getTextWidth(titulo), y + 1);
		y += 15;

		doc.setFontSize(10);
		doc.text("Fecha de entrega:", margenIzq, y);
		doc.setFont("helvetica", "normal");
		doc.text(new Date().toLocaleDateString(), margenIzq + 32, y);
		y += 10;

		const prefijo = usuario.genero === "mujer" ? "a la Srta." : "al Sr.";

		const parts = [
			{ text: `En Magdalena, se hace entrega ${prefijo} `, type: "normal" },
			{ text: `${usuario.nombres} ${usuario.apellidos}`, type: "bold" },
			{ text: " identificado (a) con DNI/PTP/C.E N° ", type: "normal" },
			{ text: `${usuario.dni}`, type: "bold" },
			{ text: " de los siguientes elementos de trabajo:", type: "normal" },
		];

		let currentX = margenIzq;
		parts.forEach((part) => {
			doc.setFont("helvetica", part.type);
			part.text.match(/(\S+|\s+)/g).forEach((token) => {
				if (currentX + doc.getTextWidth(token) > margenIzq + anchoUtil) {
					if (!/^\s+$/.test(token)) {
						currentX = margenIzq;
						y += 5;
					}
				}
				if (!(currentX === margenIzq && /^\s+$/.test(token))) {
					doc.text(token, currentX, y);
					currentX += doc.getTextWidth(token);
				}
			});
		});
		y += 13;

		const altoFila = 8;
		const col1 = margenIzq;
		const col2 = margenIzq + 50;
		const col3 = margenIzq + 120;

		doc.setLineWidth(0.1);
		doc.setFont("helvetica", "bold");
		doc.rect(margenIzq, y, anchoUtil, altoFila);
		doc.text("ITEMS", col1 + 2, y + 5);
		doc.text("DESCRIPCIÓN", col2 + 2, y + 5);
		doc.text("CANTIDAD", col3 + 2, y + 5);
		y += altoFila;

		doc.setFont("helvetica", "normal");
		const descCargador = formData.cargador ? " + Cargador" : " (Sin Cargador)";
		doc.text(`Laptop ${equipo.marca}${descCargador}`, col1 + 2, y + 7);
		doc.text(`S/N: ${equipo.serie}`, col2 + 2, y + 7);
		doc.text("1", col3 + 10, y + 7);
		y += 20;

		const yFirma = 250;
		doc.line(margenIzq, yFirma, margenIzq + 60, yFirma);
		doc.setFont("helvetica", "bold");
		doc.text(`DNI: ${usuario.dni}`, margenIzq, yFirma + 5);
		doc.text("EL/LA TRABAJADOR/A", margenIzq, yFirma + 10);

		const xDer = 120;
		doc.addImage(firmaImg, "PNG", xDer + 10, yFirma - 25, 40, 20);
		doc.line(xDer, yFirma, xDer + 60, yFirma);
		doc.text("PIERINA ALARCON DILLERVA", xDer, yFirma + 5);

		return doc.output("bloburl");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.equipo_id || !formData.empleado_id)
			return toast.warning("Seleccione equipo y usuario");

		try {
			await api.post("/movimientos/entrega", {
				...formData,
				fecha: new Date().toISOString(),
			});
			toast.success("Entrega registrada correctamente");

			// Generar PDF
			const eq = equiposDisponibles.find((e) => e.id === formData.equipo_id);
			const us = usuariosLibres.find((u) => u.id === formData.empleado_id);
			setPdfUrl(generarPDFBlob(eq, us));
			setShowPdfModal(true);

			// Limpiar Formulario
			setFormData({
				equipo_id: "",
				empleado_id: "",
				cargador: true,
				observaciones: "",
			});

			// IMPORTANTE: Recargar datos para que el usuario y equipo desaparezcan de la lista
			fetchData();
		} catch (error) {
			console.error(error);
			toast.error("Error al registrar");
		}
	};

	if (loading) return <div>Cargando...</div>;

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Registrar Entrega</h1>
			</div>
			<div
				style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
			>
				{/* FORMULARIO */}
				<div className='table-container' style={{ padding: "2rem" }}>
					<form className='equipo-form' onSubmit={handleSubmit}>
						<div className='input-group'>
							<label>Equipo (Disponibles)</label>
							<CustomSelect
								options={equiposOptions}
								value={equiposOptions.find(
									(op) => op.value === formData.equipo_id,
								)}
								onChange={(op) =>
									setFormData({ ...formData, equipo_id: op?.value || "" })
								}
								placeholder='Buscar equipo...'
							/>
						</div>

						<div className='input-group' style={{ marginTop: "1rem" }}>
							<label>Colaborador (Sin equipo asignado)</label>
							<CustomSelect
								options={usuariosOptions}
								value={usuariosOptions.find(
									(op) => op.value === formData.empleado_id,
								)}
								onChange={(op) =>
									setFormData({ ...formData, empleado_id: op?.value || "" })
								}
								placeholder='Buscar colaborador...'
							/>
						</div>

						<div className='form-row' style={{ marginTop: "1.5rem" }}>
							<label
								style={{
									display: "flex",
									alignItems: "center",
									gap: "12px",
									background: "#f8fafc",
									padding: "12px 15px",
									borderRadius: "8px",
									border: "1px solid #e2e8f0",
									width: "100%",
									cursor: "pointer",
								}}
							>
								<input
									type='checkbox'
									checked={formData.cargador}
									onChange={handleCheckboxChange}
									style={{
										width: "20px",
										height: "20px",
										cursor: "pointer",
										accentColor: "#7c3aed",
									}}
								/>
								<span style={{ fontWeight: "600", color: "#334155" }}>
									¿Incluye Cargador?
								</span>
							</label>
						</div>

						<button
							type='submit'
							className='btn-submit'
							style={{
								marginTop: "1.5rem",
								display: "flex",
								justifyContent: "center",
								gap: "10px",
							}}
						>
							<FaPaperPlane /> Guardar y Ver Acta
						</button>
					</form>
				</div>

				{/* HISTORIAL VISUAL */}
				<div className='table-container' style={{ height: "fit-content" }}>
					<h3
						style={{
							padding: "1rem",
							borderBottom: "1px solid #eee",
							fontSize: "1.1rem",
							color: "#1e293b",
						}}
					>
						<FaHistory style={{ marginRight: "8px" }} /> Últimas Entregas
					</h3>
					<table>
						<thead>
							<tr>
								<th>Fecha y Hora</th>
								<th>Equipo</th>
								<th>Colaborador</th>
								<th style={{ textAlign: "center" }}>Cargador</th>
							</tr>
						</thead>
						<tbody>
							{historialVisual.map((h) => (
								<tr key={h.id}>
									<td>
										<span
											style={{
												fontSize: "0.85rem",
												fontWeight: "600",
												color: "#475569",
											}}
										>
											{formatDateTime(h.fecha_movimiento)}
										</span>
									</td>
									<td>
										<span style={{ fontWeight: "600" }}>{h.modelo}</span>
										<br />
										<small
											style={{ fontFamily: "monospace", color: "#64748b" }}
										>
											S/N: {h.serie}
										</small>
									</td>
									<td>
										{h.empleado_nombre} {h.empleado_apellido}
									</td>
									<td style={{ textAlign: "center" }}>
										<div
											style={{
												background:
													h.cargador_incluido !== false ? "#dcfce7" : "#fee2e2",
												color:
													h.cargador_incluido !== false ? "#16a34a" : "#ef4444",
												width: "30px",
												height: "30px",
												borderRadius: "50%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												margin: "0 auto",
											}}
										>
											{h.cargador_incluido !== false ? (
												<FaCheck size={12} />
											) : (
												<FaTimes size={12} />
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<PdfModal
				isOpen={showPdfModal}
				onClose={() => setShowPdfModal(false)}
				pdfUrl={pdfUrl}
				title='Vista Previa Acta'
			/>
		</div>
	);
};

export default Entrega;
