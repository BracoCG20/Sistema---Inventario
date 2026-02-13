import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  FaLaptop,
  FaCheckCircle,
  FaHandHolding,
  FaTools,
} from 'react-icons/fa';

// Importamos los gráficos
import {
  MovementsChart,
  StatusChart,
  AgeChart,
  SignaturesChart,
  CompanyChart,
  ProviderChart,
  InventoryOriginChart,
  GlobalInventoryChart,
} from '../../components/Dashboard/DashboardCharts';

import './Dashboard.scss';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    asignados: 0,
    mantenimiento: 0,
  });

  const [movementsData, setMovementsData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [signatureData, setSignatureData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [providerData, setProviderData] = useState([]);
  const [inventoryOriginData, setInventoryOriginData] = useState([]);
  const [globalInventoryData, setGlobalInventoryData] = useState([]);

  const [loading, setLoading] = useState(true);

  const MESES = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  // --- PROCESAMIENTO DE DATOS ---
  const processData = (equipos, historial, alquileres) => {
    // 1. MOVIMIENTOS
    const months = {};
    historial.forEach((h) => {
      const date = new Date(h.fecha_movimiento);
      const mesNombre = MESES[date.getMonth()];
      const anio = date.getFullYear();
      const key = `${mesNombre} ${anio}`;

      if (!months[key])
        months[key] = {
          name: key,
          entregas: 0,
          devoluciones: 0,
          sort: anio * 100 + date.getMonth(),
        };

      if (h.tipo === 'entrega') months[key].entregas += 1;
      if (h.tipo === 'devolucion') months[key].devoluciones += 1;
    });

    const moveArray = Object.values(months)
      .sort((a, b) => a.sort - b.sort)
      .slice(-6);
    setMovementsData(moveArray);

    // 2. ESTADO DEL INVENTARIO
    const statusCounts = { operativo: 0, malogrado: 0, revision: 0 };
    equipos.forEach((e) => {
      if (e.estado === 'operativo') statusCounts.operativo++;
      else if (e.estado === 'malogrado') statusCounts.malogrado++;
      else statusCounts.revision++;
    });

    setStatusData(
      [
        { name: 'Disponible', value: statusCounts.operativo },
        { name: 'En Mantenimiento', value: statusCounts.revision },
        { name: 'Inoperativo', value: statusCounts.malogrado },
      ].filter((i) => i.value > 0),
    );

    // 3. OBTENER IDS DE EQUIPOS ACTUALMENTE ALQUILADOS A CLIENTES
    const rentedIds = new Set(
      alquileres
        .filter((a) => {
          if (a.estado !== 'Activo') return false;
          if (!a.fecha_fin) return true;
          const endDate = new Date(a.fecha_fin);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return endDate >= today;
        })
        .map((a) => a.equipo_id),
    );

    // =========================================================================
    // LÓGICA DE ALQUILERES: PROPIOS VS DE PROVEEDOR
    // =========================================================================
    let propiosStock = 0;
    let propiosRentados = 0;
    let proveedorStock = 0;
    let proveedorRentados = 0;

    equipos.forEach((e) => {
      const isRentedToClient = rentedIds.has(e.id);
      const isOwn = !e.proveedor_id;

      if (isOwn) {
        if (isRentedToClient) propiosRentados++;
        else propiosStock++;
      } else {
        if (isRentedToClient) proveedorRentados++;
        else proveedorStock++;
      }
    });

    // Gráfico de Barras: Equipos Propios vs De Proveedor
    setInventoryOriginData([
      {
        name: 'Equipos Propios',
        'En Almacén': propiosStock,
        Alquilados: propiosRentados,
      },
      {
        name: 'De Proveedor',
        'En Almacén': proveedorStock,
        Alquilados: proveedorRentados,
      },
    ]);

    // Gráfico de Dona: Resumen Total Amigable
    setGlobalInventoryData(
      [
        { name: 'Propios (En Almacén)', value: propiosStock },
        { name: 'Propios (Alquilados)', value: propiosRentados },
        { name: 'De Proveedor (En Almacén)', value: proveedorStock },
        { name: 'De Proveedor (Alquilados)', value: proveedorRentados },
      ].filter((item) => item.value > 0),
    );
    // =========================================================================

    // 4. ANTIGÜEDAD
    const yearsCount = {};
    equipos.forEach((e) => {
      if (e.fecha_compra) {
        const year = new Date(e.fecha_compra).getFullYear();
        yearsCount[year] = (yearsCount[year] || 0) + 1;
      }
    });
    const ageArray = Object.entries(yearsCount)
      .map(([year, cantidad]) => ({ year, cantidad }))
      .sort((a, b) => a.year - b.year);
    setAgeData(ageArray);

    let firmados = 0;
    let pendientes = 0;
    let rechazados = 0;

    historial.forEach((h) => {
      if (h.tipo === 'entrega' || h.tipo === 'devolucion') {
        if (h.firma_valida === false) {
          // Si explícitamente la firma fue marcada como inválida/rechazada
          rechazados++;
        } else if (h.pdf_firmado_url) {
          // Si tiene documento firmado
          firmados++;
        } else {
          // Si aún no se sube el documento
          pendientes++;
        }
      }
    });

    setSignatureData(
      [
        { name: 'Firmados', value: firmados },
        { name: 'Pendientes', value: pendientes },
        { name: 'Rechazados', value: rechazados },
      ].filter((item) => item.value > 0),
    );

    // 6. TOP EMPRESAS (EQUIPOS PROPIOS)
    const companyCount = {};
    equipos.forEach((e) => {
      if (!e.proveedor_id) {
        const nombreEmpresa = e.empresa
          ? String(e.empresa).trim().toUpperCase()
          : 'SIN EMPRESA ASIGNADA';
        companyCount[nombreEmpresa] = (companyCount[nombreEmpresa] || 0) + 1;
      }
    });
    const companyArray = Object.entries(companyCount)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    setCompanyData(companyArray);

    // 7. TOP PROVEEDORES (EQUIPOS DE PROVEEDOR)
    const providerCount = {};
    equipos.forEach((e) => {
      if (e.proveedor_id) {
        const provName = e.nombre_proveedor
          ? String(e.nombre_proveedor).trim().toUpperCase()
          : 'PROVEEDOR DESCONOCIDO';
        providerCount[provName] = (providerCount[provName] || 0) + 1;
      }
    });
    const providerArray = Object.entries(providerCount)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    setProviderData(providerArray);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resEq, resHis, resAlq] = await Promise.all([
          api.get('/equipos'),
          api.get('/historial'),
          api.get('/alquileres'),
        ]);

        const equipos = resEq.data;
        const historial = resHis.data;
        const alquileres = resAlq.data;

        const total = equipos.length;
        const asignados = equipos.filter((e) => !e.disponible).length;
        const disponibles = equipos.filter(
          (e) => e.disponible && e.estado === 'operativo',
        ).length;
        const mantenimiento = equipos.filter(
          (e) => e.estado !== 'operativo',
        ).length;

        setStats({ total, asignados, disponibles, mantenimiento });

        processData(equipos, historial, alquileres);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return <div style={{ padding: '2rem' }}>Cargando estadísticas...</div>;

  return (
    <div className='dashboard-container'>
      <h1>Resumen General</h1>

      {/* --- TARJETAS KPI --- */}
      <div className='stats-grid'>
        <div
          className='stat-card'
          style={{ backgroundColor: '#1e293b' }}
        >
          <div className='info'>
            <h3>Total Equipos</h3>
            <span
              className='number'
              style={{ color: '#fff' }}
            >
              {stats.total}
            </span>
          </div>
          <div className='icon-box purple'>
            <FaLaptop />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Equipos Asignados</h3>
            <span className='number'>{stats.asignados}</span>
          </div>
          <div className='icon-box blue'>
            <FaHandHolding />
          </div>
        </div>
        <div
          className='stat-card'
          style={{ backgroundColor: '#1e293b' }}
        >
          <div className='info'>
            <h3>Equipos Disponibles</h3>
            <span
              className='number'
              style={{ color: '#fff' }}
            >
              {stats.disponibles}
            </span>
          </div>
          <div className='icon-box green'>
            <FaCheckCircle />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Equipos Inoperativos</h3>
            <span className='number'>{stats.mantenimiento}</span>
          </div>
          <div className='icon-box orange'>
            <FaTools />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE GRÁFICOS --- */}
      <div className='charts-row main-row'>
        <div className='chart-card large'>
          <h3>Movimientos (Entregas vs Devoluciones)</h3>
          <div className='chart-wrapper'>
            <MovementsChart data={movementsData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Estado de Equipos</h3>
          <div className='chart-wrapper'>
            <StatusChart data={statusData} />
          </div>
        </div>
      </div>

      <div className='charts-row secondary-row'>
        {/* GRÁFICO 1: BARRAS APILADAS (TÍTULO CORREGIDO) */}
        <div className='chart-card'>
          <h3>Inventario vs Alquilados</h3>
          <div className='chart-wrapper'>
            <InventoryOriginChart data={inventoryOriginData} />
          </div>
        </div>

        {/* GRÁFICO 2: DONA DEL UNIVERSO COMPLETO (TÍTULO AMIGABLE) */}
        <div className='chart-card'>
          <h3>Resumen Total de Equipos</h3>
          <div className='chart-wrapper'>
            <GlobalInventoryChart data={globalInventoryData} />
          </div>
        </div>

        {/* GRÁFICO 3 */}
        <div className='chart-card'>
          <h3>Distribución (Equipos Propios)</h3>
          <div className='chart-wrapper'>
            <CompanyChart data={companyData} />
          </div>
        </div>

        {/* GRÁFICO 4 */}
        <div className='chart-card'>
          <h3>Top Proveedores</h3>
          <div className='chart-wrapper'>
            <ProviderChart data={providerData} />
          </div>
        </div>

        {/* GRÁFICO 5 */}
        <div className='chart-card'>
          <h3>Antigüedad (Año Compra)</h3>
          <div className='chart-wrapper'>
            <AgeChart data={ageData} />
          </div>
        </div>

        {/* GRÁFICO 6 */}
        <div className='chart-card'>
          <h3>Cumplimiento (Firmas)</h3>
          <div className='chart-wrapper'>
            <SignaturesChart data={signatureData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
