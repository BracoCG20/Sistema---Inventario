import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import {
	FaTimes,
	FaBuilding,
	FaMapMarkerAlt,
	FaPhone,
	FaToggleOn,
	FaToggleOff,
	FaEdit,
	FaEnvelope,
} from "react-icons/fa";
import "./EmpresaListModal.scss"; // <--- CAMBIO: Usamos SCSS propio

const EmpresaListModal = ({ onClose, onEditEmpresa }) => {
	const [empresas, setEmpresas] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchEmpresas = async () => {
		try {
			const res = await api.get("/empresas");
			setEmpresas(res.data);
		} catch (error) {
			toast.error("Error al cargar empresas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEmpresas();
	}, []);

	// --- FUNCIÓN PARA ACTIVAR / INACTIVAR EMPRESA ---
	const handleToggleStatus = async (empresa) => {
		try {
			if (empresa.activo) {
				// Si está activa, la inactivamos (Baja lógica)
				await api.delete(`/empresas/${empresa.id}`);
			} else {
				// Si está inactiva, la reactivamos
				await api.put(`/empresas/${empresa.id}/activate`);
			}

			// Actualizamos el estado visualmente sin recargar
			const nuevoEstado = !empresa.activo;
			setEmpresas(
				empresas.map((e) =>
					e.id === empresa.id ? { ...e, activo: nuevoEstado } : e,
				),
			);
			toast.success(
				`Empresa ${nuevoEstado ? "Activada" : "Inactivada"} correctamente`,
			);
		} catch (error) {
			toast.error("Error al cambiar el estado de la empresa");
		}
	};

	return (
		<div className='empresa-list-overlay' onClick={onClose}>
			<div
				className='empresa-list-content'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='modal-header'>
					<h2>
						<FaBuilding /> Gestión de Empresas
					</h2>
					<button className='btn-close' onClick={onClose}>
						<FaTimes />
					</button>
				</div>

				{loading ? (
					<div className='loading-state'>Cargando empresas...</div>
				) : (
					<div className='table-wrapper'>
						<table>
							<thead>
								<tr>
									<th>Razón Social</th>
									<th>RUC</th>
									<th>Contacto</th>
									<th>Ubicación</th>
									<th className='center'>Estado</th>
									<th className='center'>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{empresas.map((e) => (
									<tr key={e.id} className={!e.activo ? "row-inactive" : ""}>
										<td>
											<div className='main-text'>{e.razon_social}</div>
										</td>
										<td>
											<div className='secondary-text'>{e.ruc}</div>
										</td>
										<td>
											<div className='contact-info'>
												{e.email_contacto && (
													<div className='contact-item' title='Email'>
														<FaEnvelope /> {e.email_contacto}
													</div>
												)}
												{e.telefono && (
													<div className='contact-item' title='Teléfono'>
														<FaPhone /> {e.telefono}
													</div>
												)}
												{!e.email_contacto && !e.telefono && (
													<span className='muted'>-</span>
												)}
											</div>
										</td>
										<td>
											{e.direccion ? (
												<div
													className='location-info'
													title={`${e.direccion} - ${e.distrito || ""}, ${e.provincia || ""}`}
												>
													<FaMapMarkerAlt />
													<span>
														{e.direccion.length > 25
															? `${e.direccion.substring(0, 25)}...`
															: e.direccion}
													</span>
												</div>
											) : (
												<span className='muted'>-</span>
											)}
										</td>
										<td className='center'>
											<span
												className={`status-badge ${e.activo ? "active" : "inactive"}`}
											>
												{e.activo ? "Activa" : "Inactiva"}
											</span>
										</td>
										<td className='center'>
											<div className='actions-cell'>
												<button
													className={`action-btn toggle ${e.activo ? "danger" : "success"}`}
													onClick={() => handleToggleStatus(e)}
													title={
														e.activo ? "Inactivar Empresa" : "Activar Empresa"
													}
												>
													{e.activo ? (
														<FaToggleOn size={18} />
													) : (
														<FaToggleOff size={18} />
													)}
												</button>

												<button
													className='action-btn edit'
													onClick={() => {
														onEditEmpresa(e);
														onClose();
													}}
													title='Editar Empresa'
												>
													<FaEdit size={16} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default EmpresaListModal;
