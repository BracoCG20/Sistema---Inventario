import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componentes y Páginas
import Login from './pages/Login/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';

import Equipos from './pages/Equipos/Equipos';
// Páginas temporales (Placeholder) para probar la navegación
const Dashboard = () => <h1>Dashboard (Resumen) 📊</h1>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Contenedor de Alertas Flotantes */}
        <ToastContainer
          position='top-right'
          autoClose={3000}
          theme='light'
        />

        <Routes>
          {/* Ruta Pública */}
          <Route
            path='/login'
            element={<Login />}
          />

          {/* Rutas Protegidas (Solo Admin) */}
          <Route element={<ProtectedRoute />}>
            {/* Layout Principal que envuelve las páginas internas */}
            <Route element={<MainLayout />}>
              <Route
                path='/'
                element={<Dashboard />}
              />
              <Route
                path='/equipos'
                element={<Equipos />}
              />
              {/* Aquí agregaremos /usuarios, /entregas, etc. */}
            </Route>
          </Route>

          {/* Redirección por defecto: Si no existe, al login */}
          <Route
            path='*'
            element={
              <Navigate
                to='/login'
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
