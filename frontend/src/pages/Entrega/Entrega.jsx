import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import PdfModal from "../../components/Modal/PdfModal";

// Componentes Refactorizados
import EntregaForm from "../../components/Entrega/EntregaForm";
import EntregaTable from "../../components/Entrega/EntregaTable";
import { generarPDFBlob } from "../../utils/pdfGenerator";

import "../Equipos/FormStyles.scss";
import "../Equipos/Equipos.scss";

const Entrega = () => {
	const [equiposDisponibles, setEquiposDisponibles] = useState([]);
	const [usuariosLibres, setUsuariosLibres] = useState([]);
	const [historialVisual, setHistorialVisual] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showPdfModal, setShowPdfModal] = useState(false);
	const [pdfUrl, setPdfUrl] = useState("");

	const fileInputRef = useRef(null);
	const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

	const [formData, setFormData] = useState({
		equipo_id: "",
		empleado_id: "",
		cargador: true,
		observaciones: "",
	});

	// --- CARGA DE DATOS ---
	const fetchData = async () => {
		try {
			const [resEquipos, resUsuarios, resHistorial] = await Promise.all([
				api.get("/equipos"),
				api.get("/usuarios"),
				api.get("/historial"),
			]);

			setEquiposDisponibles(
				resEquipos.data.filter(
					(e) => e.estado === "operativo" && e.disponible === true,
				),
			);

			// Lógica para filtrar usuarios ya ocupados
			const ocupados = new Set();
			resHistorial.data
				.sort(
					(a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
				)
				.forEach((m) =>
					m.tipo === "entrega"
						? ocupados.add(m.empleado_id)
						: ocupados.delete(m.empleado_id),
				);

			setUsuariosLibres(
				resUsuarios.data.filter(
					(u) => u.activo === true && !ocupados.has(u.id),
				),
			);

			const entregas = resHistorial.data
				.filter((h) => h.tipo === "entrega")
				.sort(
					(a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
				)
				.slice(0, 10);
			setHistorialVisual(entregas);
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

	// --- MANEJO DE ARCHIVOS (SUBIR/INVALIDAR) ---
	const handleSubirClick = (id) => {
		setSelectedMovimientoId(id);
		fileInputRef.current.click();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file || !selectedMovimientoId) return;

		const toastId = toast.loading("Subiendo archivo...");
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
			console.error(err);
			toast.update(toastId, {
				render: "Error al subir ❌",
				type: "error",
				isLoading: false,
				autoClose: 2000,
			});
		}
		e.target.value = null;
	};

	const handleInvalidar = async (id) => {
		if (
			!window.confirm("¿Rechazar firma? El documento se marcará como inválido.")
		)
			return;
		try {
			await api.put(`/movimientos/${id}/invalidar`);
			toast.info("Documento invalidado");
			fetchData();
		} catch (e) {
			toast.error("Error al invalidar");
		}
	};

	const handleVerFirmado = (url) => {
		setPdfUrl(`http://localhost:4000${url}`); // Asegura que coincida con tu puerto
		setShowPdfModal(true);
	};

	// --- LÓGICA PRINCIPAL DE ACCIÓN (GUARDAR / EMAIL / WHATSAPP) ---
	const handleAction = async (tipoAccion) => {
		// 1. Validaciones
		if (!formData.equipo_id || !formData.empleado_id)
			return toast.warning("Seleccione equipo y usuario");

		const us = usuariosLibres.find((u) => u.id === formData.empleado_id);
		const eq = equiposDisponibles.find((e) => e.id === formData.equipo_id);

		if (tipoAccion === "EMAIL" && !us.correo)
			return toast.error("Sin correo registrado");

		// Generar PDF en memoria
		const docPdf = generarPDFBlob(eq, us, null, formData.cargador);
		const pdfBlob = docPdf.output("blob");

		try {
			// CASO 1: SOLO GUARDAR O WHATSAPP
			if (tipoAccion === "GUARDAR" || tipoAccion === "WHATSAPP") {
				await api.post("/movimientos/entrega", {
					...formData,
					equipo_id: parseInt(formData.equipo_id),
					empleado_id: parseInt(formData.empleado_id),
					fecha: new Date().toISOString(),
				});

				toast.success("Entrega guardada exitosamente");

				// Mostrar Vista Previa
				const url = URL.createObjectURL(pdfBlob);
				setPdfUrl(url);
				setShowPdfModal(true);

				// Si es WhatsApp, lógica de descarga + link
				if (tipoAccion === "WHATSAPP") {
					const nombreArchivo = `Acta_${us.nombres.split(" ")[0]}_${eq.modelo}.pdf`;
					docPdf.save(nombreArchivo); // Forzar descarga

					const numero = us.telefono ? us.telefono.replace(/\D/g, "") : "";
					const mensaje = `Hola ${us.nombres}, te hago entrega del acta de tu equipo ${eq.modelo}. (Ver archivo adjunto)`;

					const link = numero
						? `https://wa.me/51${numero}?text=${encodeURIComponent(mensaje)}`
						: `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

					window.open(link, "_blank");
					toast.info("PDF Descargado. Arrástralo al chat de WhatsApp.", {
						autoClose: 5000,
					});
				}
			}

			// CASO 2: EMAIL (Ruta especial con FormData)
			else if (tipoAccion === "EMAIL") {
				const loadingToast = toast.loading("Guardando y enviando correo...");

				const formDataEmail = new FormData();
				formDataEmail.append("pdf", pdfBlob, "Acta_Entrega.pdf");
				formDataEmail.append("equipo_id", formData.equipo_id);
				formDataEmail.append("empleado_id", formData.empleado_id);
				formDataEmail.append("cargador", formData.cargador);
				formDataEmail.append("destinatario", us.correo);
				formDataEmail.append("nombreEmpleado", us.nombres);
				formDataEmail.append("tipoEquipo", eq.modelo);

				const response = await api.post(
					"/movimientos/entrega-con-correo",
					formDataEmail,
					{
						headers: { "Content-Type": "multipart/form-data" },
					},
				);

				// Verificar si hubo advertencia (Warning = Guardado OK, Correo Fail)
				if (response.data.warning) {
					toast.update(loadingToast, {
						render: "Guardado, pero falló el envío de correo ⚠️",
						type: "warning",
						isLoading: false,
						autoClose: 4000,
					});
				} else {
					toast.update(loadingToast, {
						render: "¡Guardado y Enviado! ✅",
						type: "success",
						isLoading: false,
						autoClose: 3000,
					});
				}

				const url = URL.createObjectURL(pdfBlob);
				setPdfUrl(url);
				setShowPdfModal(true);
			}

			// Limpieza común
			setFormData({
				equipo_id: "",
				empleado_id: "",
				cargador: true,
				observaciones: "",
			});
			fetchData();
		} catch (error) {
			console.error(error);
			const msg = error.response?.data?.error || "Error en el proceso";
			toast.error(msg);
			toast.dismiss(); // Quitar loading si quedó pegado
		}
	};

	if (loading) return <div>Cargando...</div>;

	const equiposOptions = equiposDisponibles.map((e) => ({
		value: e.id,
		label: `${e.marca} ${e.modelo} - ${e.serie}`,
	}));
	const usuariosOptions = usuariosLibres.map((u) => ({
		value: u.id,
		label: `${u.nombres} ${u.apellidos}`,
	}));

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Registrar Entrega</h1>
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
					gridTemplateColumns: "1fr 1.2fr",
					gap: "2rem",
				}}
			>
				{/* Componente Formulario */}
				<EntregaForm
					equiposOptions={equiposOptions}
					usuariosOptions={usuariosOptions}
					formData={formData}
					setFormData={setFormData}
					onAction={handleAction}
				/>

				{/* Componente Tabla */}
				<EntregaTable
					historial={historialVisual}
					onVerPdfOriginal={(item) => {
						// Reconstruimos datos para visualizar PDF histórico
						const us = {
							nombres: item.empleado_nombre,
							apellidos: item.empleado_apellido,
							dni: "---",
							genero: "hombre",
						};
						const eq = {
							serie: item.serie,
							marca: item.marca,
							modelo: item.modelo,
						};
						const doc = generarPDFBlob(
							eq,
							us,
							item.fecha_movimiento,
							item.cargador,
						);
						setPdfUrl(doc.output("bloburl"));
						setShowPdfModal(true);
					}}
					onVerFirmado={handleVerFirmado}
					onSubirClick={handleSubirClick}
					onInvalidar={handleInvalidar}
				/>
			</div>

			<PdfModal
				isOpen={showPdfModal}
				onClose={() => setShowPdfModal(false)}
				pdfUrl={pdfUrl}
				title='Documento'
			/>
		</div>
	);
};

export default Entrega;
