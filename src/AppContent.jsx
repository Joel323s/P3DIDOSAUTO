import React from 'react';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { ShoppingCart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import './index.css';

function AppContent() {
  const { user, loading, cart } = useCart();
  const { userRole } = useAuth();
  const navigate = useNavigate();

  // Si ya hay un usuario autenticado, redirigir según rol
  if (user && userRole) {
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto p-4">
        {!user ? (
          <div className="py-20 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Sistema de Pedidos Auto Pedido</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              La plataforma más eficiente para gestionar pedidos y catálogos de productos multimonedas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
              <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 text-3xl font-bold">
                    A
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Administradores</h3>
                  <p className="text-gray-500 mb-8">
                    Gestiona los usuarios vendedores, el sistema y configura las tasas de cambio globales.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:translate-y-[-2px] transition-all"
                >
                  Acceso Administrador
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 text-3xl font-bold">
                    V
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Vendedores</h3>
                  <p className="text-gray-500 mb-8">
                    Accede a tu catálogo, gestiona tus productos y comparte tus presentaciones con clientes.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/vendor/login')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:translate-y-[-2px] transition-all"
                >
                  Acceso Vendedor
                </button>
              </div>
            </div>

            <div className="mt-16 text-sm text-gray-500">
              ¿No tienes cuenta? Contacta con el administrador del sistema para obtener tu código de acceso.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-4">Nuestros Productos</h2>
                <ProductList />
              </div>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <ShoppingCart />
              {cart.length > 0 && <Checkout />}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-12 py-12 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-6 text-2xl font-bold">🛒 Auto Pedido</div>
          <p className="text-gray-400 mb-4">Soluciones ágiles para negocios en crecimiento.</p>
          <p className="text-sm text-gray-500">&copy; 2026 Auto Pedido. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default AppContent;