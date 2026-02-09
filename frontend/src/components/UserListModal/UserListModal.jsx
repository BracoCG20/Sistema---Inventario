import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import {
	FaTimes,
	FaUsers,
	FaKey,
	FaToggleOn,
	FaToggleOff,
	FaUserShield,
} from "react-icons/fa";
import "./UserListModal.scss";

const UserListModal = ({ onClose }) => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	// Estado para cambio de contraseña
	const [passModal, setPassModal] = useState({
		show: false,
		userId: null,
		newPass: "",
	});

	// Cargar usuarios
	const fetchUsers = async () => {
		try {
			const res = await api.get("/auth/users");
			setUsers(res.data);
		} catch (error) {
			toast.error("Error al cargar lista de usuarios");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// Cambiar estado (Activar/Inactivar)
	const handleToggleStatus = async (user) => {
		try {
			const nuevoEstado = !user.activo;
			await api.put(`/auth/users/${user.id}/status`, { activo: nuevoEstado });

			// Actualizar lista localmente
			setUsers(
				users.map((u) =>
					u.id === user.id ? { ...u, activo: nuevoEstado } : u,
				),
			);
			toast.success(
				`Usuario ${nuevoEstado ? "Activado" : "Inactivado"} correctamente`,
			);
		} catch (error) {
			toast.error("Error al cambiar estado");
		}
	};

	// Cambiar Contraseña
	const handleChangePass = async (e) => {
		e.preventDefault();
		try {
			await api.put(`/auth/users/${passModal.userId}/password`, {
				newPassword: passModal.newPass,
			});
			toast.success("Contraseña actualizada");
			setPassModal({ show: false, userId: null, newPass: "" });
		} catch (error) {
			toast.error("Error al actualizar contraseña");
		}
	};

	return (
		<div className='list-modal-overlay' onClick={onClose}>
			<div
				className='list-modal-content'
				onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer click dentro
			>
				<div className='modal-header'>
					<h2>
						<FaUsers /> Gestión de Usuarios
					</h2>
					<button className='btn-close' onClick={onClose}>
						<FaTimes />
					</button>
				</div>

				{loading ? (
					<p>Cargando usuarios...</p>
				) : (
					<table>
						<thead>
							<tr>
								<th>Usuario</th>
								<th>Email</th>
								<th>Rol</th>
								<th>Empresa</th>
								<th>Estado</th>
								<th>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id} style={{ opacity: u.activo ? 1 : 0.6 }}>
									<td>
										<strong>
											{u.nombre} {u.apellidos}
										</strong>
									</td>
									<td>{u.email}</td>

									{/* COLUMNA ROL ACTUALIZADA */}
									<td>
										{u.rol_id === 1 ? ( // ID 1 = Super Admin
											<span
												style={{
													color: "#7c3aed",
													display: "flex",
													alignItems: "center",
													gap: "4px",
													fontWeight: "bold",
												}}
											>
												<FaUserShield /> {u.nombre_rol || "Super Admin"}
											</span>
										) : (
											<span style={{ color: "#334155", fontWeight: "500" }}>
												{u.nombre_rol || "Admin"}
											</span>
										)}
									</td>

									<td>{u.empresa}</td>
									<td>
										<span
											className={`status-badge ${u.activo ? "active" : "inactive"}`}
										>
											{u.activo ? "Activo" : "Inactivo"}
										</span>
									</td>
									<td className='actions'>
										<button
											className={`btn-toggle ${u.activo ? "danger" : "success"}`}
											onClick={() => handleToggleStatus(u)}
											title={u.activo ? "Inactivar" : "Activar"}
										>
											{u.activo ? (
												<FaToggleOn size={18} />
											) : (
												<FaToggleOff size={18} />
											)}
										</button>

										<button
											className='btn-key'
											onClick={() =>
												setPassModal({ show: true, userId: u.id, newPass: "" })
											}
											title='Cambiar Contraseña'
										>
											<FaKey />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}

				{/* --- SUB MODAL PEQUEÑO PARA CAMBIAR CONTRASEÑA --- */}
				{passModal.show && (
					<div
						style={{
							position: "fixed",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							background: "rgba(0,0,0,0.5)",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							zIndex: 3000,
						}}
						onClick={() =>
							setPassModal({ show: false, userId: null, newPass: "" })
						}
					>
						<div
							style={{
								background: "white",
								padding: "20px",
								borderRadius: "10px",
								width: "300px",
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<h3 style={{ marginTop: 0 }}>Nueva Contraseña</h3>
							<form onSubmit={handleChangePass}>
								<input
									type='text'
									placeholder='Escribe nueva contraseña'
									value={passModal.newPass}
									onChange={(e) =>
										setPassModal({ ...passModal, newPass: e.target.value })
									}
									style={{
										width: "100%",
										padding: "8px",
										marginBottom: "10px",
										border: "1px solid #ccc",
										borderRadius: "4px",
									}}
									required
								/>
								<div
									style={{
										display: "flex",
										gap: "10px",
										justifyContent: "flex-end",
									}}
								>
									<button
										type='button'
										onClick={() =>
											setPassModal({ show: false, userId: null, newPass: "" })
										}
									>
										Cancelar
									</button>
									<button
										type='submit'
										style={{
											background: "#4f46e5",
											color: "white",
											border: "none",
											padding: "8px 12px",
											borderRadius: "4px",
											cursor: "pointer",
										}}
									>
										Guardar
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserListModal;
