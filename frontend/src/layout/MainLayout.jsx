import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import WhatsappBtn from '../components/WhatsappBtn/WhatsappBtn'; // <--- Importar

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2.5vh 2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>

      {/* Aquí agregamos el botón flotante */}
      <WhatsappBtn />
    </div>
  );
};

export default MainLayout;
