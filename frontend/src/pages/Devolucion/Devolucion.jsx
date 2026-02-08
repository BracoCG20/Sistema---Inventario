import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import PdfModal from "../../components/Modal/PdfModal";

// Importación de Componentes Modularizados
import DevolucionForm from "../../components/Devolucion/DevolucionForm";
import DevolucionTable from "../../components/Devolucion/DevolucionTable";
import { generarPDFDevolucion } from "../../utils/pdfGeneratorDevolucion";

import "../Equipos/FormStyles.scss";
import "../Equipos/Equipos.scss";

const Devolucion = () => {
	// Estados de datos
	const [allEquipos, setAllEquipos] = useState([]);
	const [allUsuarios, setAllUsuarios] = useState([]);

	// Estados procesados
	const [usuariosConEquipo, setUsuariosConEquipo] = useState([]);
	const [mapaAsignaciones, setMapaAsignaciones] = useState({});
	const [historialVisual, setHistorialVisual] = useState([]);

	// Estados de UI
	const [loading, setLoading] = useState(true);
	const [showPdfModal, setShowPdfModal] = useState(false);
	const [pdfUrl, setPdfUrl] = useState("");
	const [equipoDetectado, setEquipoDetectado] = useState(null);

	const fileInputRef = useRef(null);
	const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

	const [formData, setFormData] = useState({
		equipo_id: "",
		empleado_id: "",
		cargador: true,
		observaciones: "",
		estado_final: "operativo",
	});

	// --- CARGA DE DATOS ---
	const fetchData = async () => {
		try {
			const [resEq, resUs, resHis] = await Promise.all([
				api.get("/equipos"),
				api.get("/usuarios"),
				api.get("/historial"),
			]);

			setAllEquipos(resEq.data);
			setAllUsuarios(resUs.data);

			// 1. Calcular quién tiene qué equipo actualmente
			const sortedHistory = [...resHis.data].sort(
				(a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
			);

			const asignacionesTemp = {};

			sortedHistory.forEach((mov) => {
				if (mov.tipo === "entrega") {
					asignacionesTemp[mov.empleado_id] = mov.equipo_id;
				} else if (mov.tipo === "devolucion") {
					delete asignacionesTemp[mov.empleado_id];
				}
			});

			// 2. Construir lista para el Select
			const usuariosList = [];
			const mapaCompleto = {};

			Object.keys(asignacionesTemp).forEach((userIdStr) => {
				const uId = parseInt(userIdStr);
				const eqId = asignacionesTemp[userIdStr];

				const usuario = resUs.data.find((u) => u.id === uId);
				const equipo = resEq.data.find((e) => e.id === eqId);

				if (usuario && equipo && usuario.activo) {
					usuariosList.push(usuario);
					mapaCompleto[uId] = equipo;
				}
			});

			setUsuariosConEquipo(usuariosList);
			setMapaAsignaciones(mapaCompleto);

			// 3. Tabla visual (Últimas devoluciones)
			const ultimasDevoluciones = resHis.data
				.filter((h) => h.tipo === "devolucion")
				.sort(
					(a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
				)
				.slice(0, 10);

			setHistorialVisual(ultimasDevoluciones);
		} catch (e) {
			console.error(e);
			toast.error("Error cargando datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// --- MANEJO DE ARCHIVOS (SUBIR/INVALIDAR) ---
	const handleSubirClick = (id) => {
		setSelectedMovimientoId(id);
		fileInputRef.current.click();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file || !selectedMovimientoId) return;

		const toastId = toast.loading("Subiendo...");
		const form = new FormData();
		form.append("pdf", file);

		try {
			await api.post(
				`/movimientos/${selectedMovimientoId}/subir-firmado`,
				form,
				{
					headers: { "Content-Type": "multipart/form-data" },
				},
			);
			toast.update(toastId, {
				render: "Guardado ✅",
				type: "success",
				isLoading: false,
				autoClose: 2000,
			});
			fetchData();
		} catch (err) {
			toast.update(toastId, {
				render: "Error subida ❌",
				type: "error",
				isLoading: false,
				autoClose: 2000,
			});
		}
		e.target.value = null;
	};

	const handleInvalidar = async (id) => {
		if (!window.confirm("¿Rechazar firma?")) return;
		try {
			await api.put(`/movimientos/${id}/invalidar`);
			toast.info("Documento invalidado");
			fetchData();
		} catch (e) {
			toast.error("Error al invalidar");
		}
	};

	const handleVerFirmado = (url) => {
		// Asegúrate de que el puerto coincida con tu backend (ej. 4000)
		setPdfUrl(`http://localhost:4000${url}`);
		setShowPdfModal(true);
	};

	// --- MANEJADORES FORMULARIO ---
	const handleUserChange = (selectedOption) => {
		const userId = selectedOption?.value;
		if (userId) {
			const eq = mapaAsignaciones[userId];
			if (eq) {
				setEquipoDetectado(eq);
				setFormData({
					...formData,
					empleado_id: userId,
					equipo_id: eq.id,
					estado_final: "operativo",
					observaciones: "",
				});
			} else {
				toast.error("Error de sincronización de datos.");
			}
		} else {
			setEquipoDetectado(null);
			setFormData({
				...formData,
				empleado_id: "",
				equipo_id: "",
				estado_final: "operativo",
				observaciones: "",
			});
		}
	};

	// --- AQUÍ ESTABA EL ERROR: Asegúrate de que esta función exista ---
	const handleVerPdfHistorial = (item) => {
		// Reconstruimos objeto usuario y equipo con los datos REALES del historial
		const us = {
			nombres: item.empleado_nombre,
			apellidos: item.empleado_apellido,
			dni: item.dni || "---", // Ahora sí toma el DNI real
			genero: item.genero || "hombre", // Ahora sí toma el género real
		};
		const eq = {
			marca: item.marca,
			modelo: item.modelo,
			serie: item.serie,
		};

		const url = generarPDFDevolucion(
			eq,
			us,
			item.cargador,
			item.observaciones,
			item.estado_equipo_momento,
		);
		setPdfUrl(url);
		setShowPdfModal(true);
	};

	// --- LÓGICA PRINCIPAL (GUARDAR / EMAIL / WHATSAPP) ---
	const handleAction = async (tipoAccion) => {
		if (!formData.equipo_id || !formData.empleado_id)
			return toast.warning("Faltan datos");

		const us = allUsuarios.find((u) => u.id === formData.empleado_id);
		const eq = allEquipos.find((e) => e.id === formData.equipo_id);

		if (tipoAccion === "EMAIL" && !us.correo)
			return toast.error("Usuario sin correo");

		// Generar PDF (URL y Blob)
		const pdfUrlBlob = generarPDFDevolucion(
			eq,
			us,
			formData.cargador,
			formData.observaciones,
			formData.estado_final,
		);

		// Convertimos la URL blob a un objeto Blob real para enviarlo por correo
		const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

		try {
			// CASO 1: SOLO GUARDAR O WHATSAPP
			if (tipoAccion === "GUARDAR" || tipoAccion === "WHATSAPP") {
				await api.post("/movimientos/devolucion", {
					...formData,
					fecha: new Date().toISOString(),
				});
				toast.success("Devolución registrada");

				setPdfUrl(pdfUrlBlob);
				setShowPdfModal(true);

				if (tipoAccion === "WHATSAPP") {
					// Forzar descarga para arrastrar
					const link = document.createElement("a");
					link.href = pdfUrlBlob;
					link.download = `Constancia_Devolucion_${us.nombres}.pdf`;
					link.click();

					const numero = us.telefono ? us.telefono.replace(/\D/g, "") : "";
					const msg = `Hola ${us.nombres}, adjunto constancia de devolución del equipo ${eq.modelo}.`;
					const waLink = numero
						? `https://wa.me/51${numero}?text=${encodeURIComponent(msg)}`
						: `https://wa.me/?text=${encodeURIComponent(msg)}`;
					window.open(waLink, "_blank");
					toast.info("PDF Descargado. Arrástralo al chat.", {
						autoClose: 5000,
					});
				}
			}
			// CASO 2: EMAIL
			else if (tipoAccion === "EMAIL") {
				const toastId = toast.loading("Enviando correo...");
				const form = new FormData();
				form.append("pdf", blob, "Constancia_Devolucion.pdf");
				// Datos para BD y Correo
				form.append("equipo_id", formData.equipo_id);
				form.append("empleado_id", formData.empleado_id);
				form.append("cargador", formData.cargador);
				form.append("observaciones", formData.observaciones);
				form.append("estado_final", formData.estado_final);
				form.append("destinatario", us.correo);
				form.append("nombreEmpleado", us.nombres);
				form.append("tipoEquipo", eq.modelo);

				const res = await api.post("/movimientos/devolucion-con-correo", form, {
					headers: { "Content-Type": "multipart/form-data" },
				});

				if (res.data.warning) {
					toast.update(toastId, {
						render: "Guardado, pero correo falló ⚠️",
						type: "warning",
						isLoading: false,
						autoClose: 4000,
					});
				} else {
					toast.update(toastId, {
						render: "¡Enviado con éxito! ✅",
						type: "success",
						isLoading: false,
						autoClose: 3000,
					});
				}

				setPdfUrl(pdfUrlBlob);
				setShowPdfModal(true);
			}

			// Limpieza
			setFormData({
				equipo_id: "",
				empleado_id: "",
				cargador: true,
				observaciones: "",
				estado_final: "operativo",
			});
			setEquipoDetectado(null);
			fetchData();
		} catch (e) {
			console.error(e);
			toast.error(e.response?.data?.error || "Error procesando solicitud");
			toast.dismiss();
		}
	};

	if (loading) return <div>Cargando sistema...</div>;

	const usuariosOptions = usuariosConEquipo.map((us) => ({
		value: us.id,
		label: `${us.nombres} ${us.apellidos}`,
	}));

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Registrar Devolución</h1>
			</div>

			<input
				type='file'
				ref={fileInputRef}
				style={{ display: "none" }}
				accept='application/pdf'
				onChange={handleFileChange}
			/>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1.4fr",
					gap: "2rem",
				}}
			>
				{/* COMPONENTE FORMULARIO */}
				<DevolucionForm
					usuariosOptions={usuariosOptions}
					formData={formData}
					setFormData={setFormData}
					equipoDetectado={equipoDetectado}
					handleUserChange={handleUserChange}
					onAction={handleAction}
				/>

				{/* COMPONENTE TABLA */}
				<DevolucionTable
					historial={historialVisual}
					onVerPdf={handleVerPdfHistorial}
					onVerFirmado={handleVerFirmado}
					onSubirClick={handleSubirClick}
					onInvalidar={handleInvalidar}
				/>
			</div>

			<PdfModal
				isOpen={showPdfModal}
				onClose={() => setShowPdfModal(false)}
				pdfUrl={pdfUrl}
				title='Constancia de Devolución'
			/>
		</div>
	);
};

export default Devolucion;
