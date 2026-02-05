import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar'; // <--- Importamos

const MainLayout = () => {
  return (
    // Usamos Flexbox para poner Sidebar a la izq y contenido a la der
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      {/* Contenedor del contenido principal */}
      <main
        style={{
          flex: 1,
          padding: '2.5vh 2rem',
          overflowY: 'auto', // El scroll va aquí, no en toda la página
        }}
      >
        {/* Aquí se renderizarán Dashboard, Equipos, etc. */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
