import React, { useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
} from "recharts";

// --- COLORES GLOBALES ---
const COLORS = {
	primary: "#7c3aed",
	secondary: "#3b82f6",
	success: "#10b981",
	warning: "#f59e0b", // Naranja (Lo usaremos para proveedores)
	danger: "#ef4444",
	dark: "#1e293b",
	gray: "#cbd5e1",
};

// 1. Gráfico de Barras: Entregas vs Devoluciones
export const MovementsChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={300}>
			<BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
				<CartesianGrid
					strokeDasharray='3 3'
					vertical={false}
					stroke='#e2e8f0'
				/>
				<XAxis
					dataKey='name'
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#64748b", fontSize: 12 }}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#64748b", fontSize: 12 }}
				/>
				<Tooltip
					cursor={{ fill: "#f1f5f9" }}
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Legend />
				<Bar
					dataKey='entregas'
					name='Entregas'
					fill={COLORS.success}
					radius={[4, 4, 0, 0]}
					barSize={30}
				/>
				<Bar
					dataKey='devoluciones'
					name='Devoluciones'
					fill={COLORS.danger}
					radius={[4, 4, 0, 0]}
					barSize={30}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 2. Gráfico de Dona: Estado del Inventario
export const StatusChart = ({ data }) => {
	const STATUS_COLORS = {
		Disponible: COLORS.success,
		"En Mantenimiento": COLORS.warning,
		Inoperativo: COLORS.danger,
	};

	return (
		<ResponsiveContainer width='100%' height={250}>
			<PieChart>
				<Pie
					data={data}
					cx='50%'
					cy='50%'
					innerRadius={60}
					outerRadius={80}
					paddingAngle={5}
					dataKey='value'
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={STATUS_COLORS[entry.name] || COLORS.gray}
						/>
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Legend verticalAlign='bottom' height={36} iconType='circle' />
			</PieChart>
		</ResponsiveContainer>
	);
};

// 3. Gráfico de Barras: Inventario vs Rentas
export const ModelsChart = ({ data }) => {
	const [filtro, setFiltro] = useState("todos");

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				className='chart-filters'
				style={{
					display: "flex",
					justifyContent: "center",
					gap: "6px",
					marginBottom: "15px",
				}}
			>
				<button
					style={{
						padding: "4px 12px",
						borderRadius: "20px",
						border: `1px solid ${filtro === "todos" ? COLORS.primary : "#e2e8f0"}`,
						background: filtro === "todos" ? COLORS.primary : "white",
						color: filtro === "todos" ? "white" : "#64748b",
						fontSize: "0.75rem",
						fontWeight: 700,
						cursor: "pointer",
					}}
					onClick={() => setFiltro("todos")}
				>
					Todos
				</button>
				<button
					style={{
						padding: "4px 12px",
						borderRadius: "20px",
						border: `1px solid ${filtro === "rentados" ? COLORS.success : "#e2e8f0"}`,
						background: filtro === "rentados" ? COLORS.success : "white",
						color: filtro === "rentados" ? "white" : "#64748b",
						fontSize: "0.75rem",
						fontWeight: 700,
						cursor: "pointer",
					}}
					onClick={() => setFiltro("rentados")}
				>
					Rentados
				</button>
				<button
					style={{
						padding: "4px 12px",
						borderRadius: "20px",
						border: `1px solid ${filtro === "disponibles" ? "#94a3b8" : "#e2e8f0"}`,
						background: filtro === "disponibles" ? "#94a3b8" : "white",
						color: filtro === "disponibles" ? "white" : "#64748b",
						fontSize: "0.75rem",
						fontWeight: 700,
						cursor: "pointer",
					}}
					onClick={() => setFiltro("disponibles")}
				>
					Disponibles
				</button>
			</div>

			<ResponsiveContainer width='100%' height={220}>
				<BarChart
					data={data}
					margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
				>
					<CartesianGrid
						strokeDasharray='3 3'
						vertical={false}
						stroke='#e2e8f0'
					/>
					<XAxis
						dataKey='name'
						tick={{ fill: "#475569", fontSize: 10 }}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={{ fill: "#475569", fontSize: 11 }}
						axisLine={false}
						tickLine={false}
					/>
					<Tooltip
						cursor={{ fill: "#f8fafc" }}
						contentStyle={{
							borderRadius: "8px",
							border: "none",
							boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
						}}
					/>

					{(filtro === "todos" || filtro === "rentados") && (
						<Bar
							dataKey='rentados'
							name='Rentados'
							stackId='a'
							fill={COLORS.success}
							radius={filtro === "todos" ? [0, 0, 4, 4] : [4, 4, 4, 4]}
							barSize={30}
						/>
					)}
					{(filtro === "todos" || filtro === "disponibles") && (
						<Bar
							dataKey='disponibles'
							name='Disponibles'
							stackId='a'
							fill={"#94a3b8"}
							radius={filtro === "todos" ? [4, 4, 0, 0] : [4, 4, 4, 4]}
							barSize={30}
						/>
					)}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};

// 4. Gráfico de Área: Antigüedad (Año de Compra)
export const AgeChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={250}>
			<AreaChart
				data={data}
				margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
			>
				<defs>
					<linearGradient id='colorPv' x1='0' y1='0' x2='0' y2='1'>
						<stop offset='5%' stopColor={COLORS.primary} stopOpacity={0.8} />
						<stop offset='95%' stopColor={COLORS.primary} stopOpacity={0} />
					</linearGradient>
				</defs>
				<XAxis
					dataKey='year'
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#64748b", fontSize: 12 }}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#64748b", fontSize: 12 }}
				/>
				<Tooltip
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Area
					type='monotone'
					dataKey='cantidad'
					name='Equipos'
					stroke={COLORS.primary}
					fillOpacity={1}
					fill='url(#colorPv)'
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
};

// 5. Gráfico Pie: Estado de Firmas
export const SignaturesChart = ({ data }) => {
	const COLORS_FIRMA = [COLORS.success, COLORS.gray];
	return (
		<ResponsiveContainer width='100%' height={250}>
			<PieChart>
				<Pie
					data={data}
					cx='50%'
					cy='50%'
					startAngle={180}
					endAngle={0}
					innerRadius={60}
					outerRadius={80}
					paddingAngle={0}
					dataKey='value'
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={COLORS_FIRMA[index % COLORS_FIRMA.length]}
						/>
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Legend verticalAlign='bottom' height={36} />
			</PieChart>
		</ResponsiveContainer>
	);
};

// 6. Gráfico de Barras Horizontales: Top Empresas Propias
export const CompanyChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={250}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke='#e2e8f0'
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={110}
					tick={{ fill: "#475569", fontSize: 11 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc" }}
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Bar
					dataKey='cantidad'
					name='Equipos Propios'
					fill={COLORS.primary}
					radius={[0, 4, 4, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 7. Gráfico de Barras Horizontales: Top Proveedores (NUEVO)
export const ProviderChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={250}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke='#e2e8f0'
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={110}
					tick={{ fill: "#475569", fontSize: 11 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#fff7ed" }}
					contentStyle={{
						borderRadius: "8px",
						border: "none",
						boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
					}}
				/>
				<Bar
					dataKey='cantidad'
					name='Equipos Alquilados'
					fill={COLORS.warning}
					radius={[0, 4, 4, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};
