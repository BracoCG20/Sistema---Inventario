import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  FaLaptop,
  FaCheckCircle,
  FaHandHolding,
  FaTools,
} from 'react-icons/fa';
import './Dashboard.scss';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    asignados: 0,
    mantenimiento: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtenemos todos los equipos y calculamos en el frontend
        const res = await api.get('/equipos');
        const equipos = res.data;

        const total = equipos.length;
        const asignados = equipos.filter((e) => !e.disponible).length;

        // Disponibles: Que estén disponibles Y operativos
        const disponibles = equipos.filter(
          (e) => e.disponible && e.estado === 'operativo',
        ).length;

        // Mantenimiento o Malogrados
        const mantenimiento = equipos.filter(
          (e) => e.estado !== 'operativo',
        ).length;

        setStats({ total, asignados, disponibles, mantenimiento });
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

      <div className='stats-grid'>
        {/* Tarjeta 1: Total */}
        <div className='stat-card'>
          <div className='info'>
            <h3>Total Equipos</h3>
            <span className='number'>{stats.total}</span>
          </div>
          <div className='icon-box purple'>
            <FaLaptop />
          </div>
        </div>

        {/* Tarjeta 2: Asignados */}
        <div className='stat-card'>
          <div className='info'>
            <h3>Asignados</h3>
            <span className='number'>{stats.asignados}</span>
          </div>
          <div className='icon-box blue'>
            <FaHandHolding />
          </div>
        </div>

        {/* Tarjeta 3: Disponibles */}
        <div className='stat-card'>
          <div className='info'>
            <h3>Disponibles</h3>
            <span className='number'>{stats.disponibles}</span>
          </div>
          <div className='icon-box green'>
            <FaCheckCircle />
          </div>
        </div>

        {/* Tarjeta 4: Mantenimiento */}
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

      <div className='recent-section'>
        <h2>Bienvenido al Sistema de Inventario</h2>
        <p>
          Selecciona una opción del menú lateral para comenzar a gestionar los
          equipos, realizar entregas o ver el historial de movimientos.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
