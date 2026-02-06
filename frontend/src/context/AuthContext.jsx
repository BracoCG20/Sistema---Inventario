import { createContext, useState, useEffect, useContext } from 'react'; // 1. Agregado useContext
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import api from '../services/api';

export const AuthContext = createContext();

// 2. IMPORTANTE: Agregamos el hook personalizado para que Sidebar.jsx pueda usarlo
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token al recargar la página
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Opcional: Verificar expiración aquí
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      // Guardar token y estado
      localStorage.setItem('token', token);
      setUser(user);

      toast.success(`Bienvenido, ${user.nombre}`);
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Sesión cerrada');
    // Opcional: Redirigir al login si es necesario
    // window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
