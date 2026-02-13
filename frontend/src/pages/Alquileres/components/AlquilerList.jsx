import React from "react";
import {
	FaEdit,
	FaTrash,
	FaUndo,
	FaCalendarAlt,
	FaBuilding,
	FaChevronLeft,
	FaChevronRight,
	FaEye,
} from "react-icons/fa";
import "./AlquilerList.scss";

const AlquilerList = ({
	alquileres,
	onEdit,
	onDelete,
	onActivate,
	onPreview, // <--- ESTO FALTABA AGREGAR AQUÍ
	totalItems,
	paginate,
	currentPage,
	totalPages,
	indexOfFirstItem,
	indexOfLastItem,
}) => {
	const formatDate = (dateString) => {
		if (!dateString) return <span style={{ color: "#94a3b8" }}>-</span>;
		return new Date(dateString).toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	return (
		<div className='table-container'>
			{alquileres.length === 0 ? (
				<div className='no-data'>No hay alquileres registrados.</div>
			) : (
				<table>
					<thead>
						<tr>
							<th className='center'>Estado</th>
							<th>Equipo</th>
							<th>Cliente</th>
							<th>Periodo</th>
							<th>Facturación</th>
							<th className='center'>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{alquileres.map((item) => (
							<tr
								key={item.id}
								className={item.estado === "Cancelado" ? "inactive-row" : ""}
							>
								<td className='center'>
									<span className={`status-badge ${item.estado.toLowerCase()}`}>
										{item.estado.toUpperCase()}
									</span>
								</td>
								<td>
									<span className='info-primary'>{item.modelo}</span>
									<span className='info-secondary'>
										{item.marca} - S/N: {item.serie}
									</span>
								</td>
								<td>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
										}}
									>
										<FaBuilding color='#94a3b8' />
										<span className='info-text'>{item.cliente_nombre}</span>
									</div>
								</td>
								<td>
									<div className='info-secondary'>
										<FaCalendarAlt size={12} style={{ marginRight: "4px" }} />
										{formatDate(item.fecha_inicio)} —{" "}
										{formatDate(item.fecha_fin)}
									</div>
								</td>
								<td>
									<div className='price-text'>
										{item.moneda === "USD" ? "$" : "S/"} {item.precio_alquiler}
									</div>
									<div
										className='info-secondary'
										style={{ fontSize: "0.8rem" }}
									>
										{item.frecuencia_pago}
									</div>
								</td>

								<td>
									<div className='actions-cell'>
										{/* BOTÓN VISTA PREVIA */}
										<button
											className='action-btn view'
											onClick={() => onPreview(item)}
											title='Vista Previa'
										>
											<FaEye />
										</button>

										{item.estado !== "Cancelado" ? (
											<>
												<button
													className='action-btn edit'
													onClick={() => onEdit(item)}
													title='Editar'
												>
													<FaEdit />
												</button>
												<button
													className='action-btn delete'
													onClick={() => onDelete(item)}
													title='Cancelar Contrato'
												>
													<FaTrash />
												</button>
											</>
										) : (
											<button
												className='action-btn activate'
												onClick={() => onActivate(item)}
												title='Reactivar'
											>
												<FaUndo />
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Paginación */}
			{totalItems > 0 && (
				<div className='pagination-footer'>
					<div className='info'>
						Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
						<strong>{Math.min(indexOfLastItem, totalItems)}</strong> de{" "}
						<strong>{totalItems}</strong>
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
	);
};

export default AlquilerList;
