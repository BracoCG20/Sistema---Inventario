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
  ModelsChart,
  AgeChart,
  SignaturesChart,
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
  const [modelsData, setModelsData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [signatureData, setSignatureData] = useState([]);

  const [loading, setLoading] = useState(true);

  // --- PROCESAMIENTO DE DATOS ---
  const processData = (equipos, historial) => {
    // 1. MOVIMIENTOS
    const months = {};
    historial.forEach((h) => {
      const date = new Date(h.fecha_movimiento);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;

      if (!months[key])
        months[key] = {
          name: key,
          entregas: 0,
          devoluciones: 0,
          sort: date.getTime(),
        };

      if (h.tipo === 'entrega') months[key].entregas += 1;
      if (h.tipo === 'devolucion') months[key].devoluciones += 1;
    });
    const moveArray = Object.values(months)
      .sort((a, b) => a.sort - b.sort)
      .slice(-6);
    setMovementsData(moveArray);

    // 2. ESTADO DEL INVENTARIO (MODIFICADO)
    const statusCounts = { operativo: 0, malogrado: 0, revision: 0 };
    equipos.forEach((e) => {
      // Ignoramos 'Asignado' para este gráfico, solo nos importa el estado físico
      if (e.estado === 'operativo')
        statusCounts.operativo++; // Disponible/Operativo
      else if (e.estado === 'malogrado') statusCounts.malogrado++;
      else statusCounts.revision++; // Cualquier otro estado es mantenimiento
    });

    setStatusData(
      [
        { name: 'Disponible', value: statusCounts.operativo },
        { name: 'En Mantenimiento', value: statusCounts.revision },
        { name: 'Inoperativo', value: statusCounts.malogrado }, // Nombre profesional para Malogrado
      ].filter((i) => i.value > 0),
    ); // Solo mostramos los que tienen datos

    // 3. TOP MODELOS
    const modelsCount = {};
    equipos.forEach((e) => {
      const key = `${e.marca} ${e.modelo}`;
      modelsCount[key] = (modelsCount[key] || 0) + 1;
    });
    const modelsArray = Object.entries(modelsCount)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    setModelsData(modelsArray);

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

    // 5. ESTADO DE FIRMAS
    let firmados = 0;
    let pendientes = 0;
    historial.forEach((h) => {
      if (h.tipo === 'entrega' || h.tipo === 'devolucion') {
        if (h.pdf_firmado_url && h.firma_valida !== false) firmados++;
        else pendientes++;
      }
    });
    setSignatureData([
      { name: 'Firmados', value: firmados },
      { name: 'Pendientes', value: pendientes },
    ]);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resEq, resHis] = await Promise.all([
          api.get('/equipos'),
          api.get('/historial'),
        ]);

        const equipos = resEq.data;
        const historial = resHis.data;

        // Stats Tarjetas (Se mantienen igual, muestran panorama completo)
        const total = equipos.length;
        const asignados = equipos.filter((e) => !e.disponible).length;
        const disponibles = equipos.filter(
          (e) => e.disponible && e.estado === 'operativo',
        ).length;
        const mantenimiento = equipos.filter(
          (e) => e.estado !== 'operativo',
        ).length;

        setStats({ total, asignados, disponibles, mantenimiento });

        processData(equipos, historial);
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
        <div className='stat-card'>
          <div className='info'>
            <h3>Total Equipos</h3>
            <span className='number'>{stats.total}</span>
          </div>
          <div className='icon-box purple'>
            <FaLaptop />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Asignados</h3>
            <span className='number'>{stats.asignados}</span>
          </div>
          <div className='icon-box blue'>
            <FaHandHolding />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Disponibles</h3>
            <span className='number'>{stats.disponibles}</span>
          </div>
          <div className='icon-box green'>
            <FaCheckCircle />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Inoperativos</h3>
            <span className='number'>{stats.mantenimiento}</span>
          </div>
          <div className='icon-box orange'>
            <FaTools />
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE GRÁFICOS --- */}

      {/* FILA 1 */}
      <div className='charts-row main-row'>
        <div className='chart-card large'>
          <h3>Movimientos (Entregas vs Devoluciones)</h3>
          <div className='chart-wrapper'>
            <MovementsChart data={movementsData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Estado de Flota</h3>
          <div className='chart-wrapper'>
            <StatusChart data={statusData} />
          </div>
        </div>
      </div>

      {/* FILA 2 */}
      <div className='charts-row secondary-row'>
        <div className='chart-card'>
          <h3>Top Modelos</h3>
          <div className='chart-wrapper'>
            <ModelsChart data={modelsData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Antigüedad (Año Compra)</h3>
          <div className='chart-wrapper'>
            <AgeChart data={ageData} />
          </div>
        </div>
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
