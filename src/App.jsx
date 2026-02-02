import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppContent from './AppContent';

// Componentes
import { LoginForm } from './components/LoginForm';
import AdminLoginPage from './components/AdminLoginPage';
import VendorLoginPage from './components/VendorLoginPage';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import PresentationView from './components/PresentationView';
import VendorRegisterPage from './components/VendorRegisterPage';
import VendorCodeLoginPage from './components/VendorCodeLoginPage'; // Login solo con código
import HiddenAdminPanel from './components/HiddenAdminPanel';

// Componente protector de rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Si no está autenticado, redirigir al login principal o al que corresponda
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente principal con rutas
const AppWithRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <CurrencyProvider>
            <Routes>
              {/* Ruta principal para inicio de sesión */}
              <Route path="/" element={<LoginForm />} />

              {/* Rutas de Login separadas */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/vendor/login" element={<VendorLoginPage />} />

              {/* Ruta pública para presentación */}
              <Route path="/presentation" element={<PresentationView />} />
              <Route path="/vendor/register" element={<VendorRegisterPage />} />
              <Route path="/vendor/code-login" element={<VendorCodeLoginPage />} /> {/* Link exclusivo para código */}

              {/* HIDDEN ADMIN ROUTE - No Linking */}
              <Route path="/master-control" element={<HiddenAdminPanel />} />

              {/* Rutas protegidas para admin */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Rutas protegidas para vendor */}
              <Route
                path="/vendor/*"
                element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Ruta para presentación de vendedor (accesible públicamente) */}
              <Route path="/vendor/:vendorId/presentation" element={<PresentationView />} />
            </Routes>
          </CurrencyProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default AppWithRoutes;