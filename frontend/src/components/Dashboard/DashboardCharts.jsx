import React from 'react';
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
} from 'recharts';

// --- COLORES GLOBALES ---
const COLORS = {
  primary: '#7c3aed', // Violeta
  secondary: '#3b82f6', // Azul
  success: '#10b981', // Verde
  warning: '#f59e0b', // Naranja/Amarillo
  danger: '#ef4444', // Rojo
  dark: '#1e293b', // Oscuro
  gray: '#cbd5e1', // Gris
};

// 1. Gráfico de Barras: Entregas vs Devoluciones
export const MovementsChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={300}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          dataKey='name'
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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

// 2. Gráfico de Dona: Estado del Inventario (CORREGIDO)
export const StatusChart = ({ data }) => {
  // Mapeo fijo de colores para asegurar consistencia
  const STATUS_COLORS = {
    Disponible: COLORS.success, // Verde
    'En Mantenimiento': COLORS.warning, // Amarillo/Naranja
    Inoperativo: COLORS.danger, // Rojo
  };

  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
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
              fill={STATUS_COLORS[entry.name] || COLORS.gray} // Color por nombre o gris si no existe
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={36}
          iconType='circle'
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// 3. Gráfico de Barras Horizontales: Top Modelos
export const ModelsChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={100}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: '#f8fafc' }} />
        <Bar
          dataKey='cantidad'
          fill={COLORS.secondary}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 4. Gráfico de Área: Antigüedad (Año de Compra)
export const AgeChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id='colorPv'
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='5%'
              stopColor={COLORS.primary}
              stopOpacity={0.8}
            />
            <stop
              offset='95%'
              stopColor={COLORS.primary}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey='year'
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip />
        <Area
          type='monotone'
          dataKey='cantidad'
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
  const COLORS_FIRMA = [COLORS.success, COLORS.gray]; // Firmado vs Pendiente

  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
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
        <Tooltip />
        <Legend
          verticalAlign='bottom'
          height={36}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
