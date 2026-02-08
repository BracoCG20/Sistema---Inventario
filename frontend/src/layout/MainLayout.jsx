import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
// Si aún no has creado el WhatsappBtn, comenta la siguiente línea para que no te de otro error:
import WhatsappBtn from "../components/WhatsappBtn/WhatsappBtn";

const MainLayout = () => {
	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				overflow: "hidden",
				backgroundColor: "#f3f4f6",
			}}
		>
			{/* 1. Menú Lateral */}
			<Sidebar />

			{/* 2. Contenido Dinámico */}
			<main style={{ flex: 1, padding: "2.5vh 2rem", overflowY: "auto" }}>
				<Outlet />
			</main>

			{/* 3. Botón Flotante (Coméntalo si no tienes el archivo creado aún) */}
			<WhatsappBtn />
		</div>
	);
};

export default MainLayout;
