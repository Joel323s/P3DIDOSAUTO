import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navegación */}
      <nav className="bg-blue-600 p-4">
        <div className="container mx-auto flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded text-white ${activeTab === 'products' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-500'}`}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded text-white ${activeTab === 'orders' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-500'}`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-4 py-2 rounded text-white ${activeTab === 'presentation' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-500'}`}
          >
            Kiosko
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded text-white ${activeTab === 'config' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-500'}`}
          >
            Ajustes
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white ml-auto"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        {/* Sección de Inventario */}
        {activeTab === 'products' && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventario</h2>
            <p className="text-gray-600">Sección de inventario</p>
          </div>
        )}

        {/* Sección de Pedidos */}
        {activeTab === 'orders' && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Pedidos</h2>
            <p className="text-gray-600">Sección de pedidos</p>
          </div>
        )}

        {/* Sección de Kiosko */}
        {activeTab === 'presentation' && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Kiosko</h2>
            <p className="text-gray-600">Sección de kiosko</p>
          </div>
        )}

        {/* Sección de Configuración */}
        {activeTab === 'config' && (
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Configuración</h2>
            <p className="text-gray-600">Sección de configuración</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;