import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  // Cargar ventas
  const loadSales = async () => {
    if (!currentUser?.id || !supabase) return;
    setSalesLoading(true);
    try {
      const { data, error } = await supabase
        .from('final_sales')
        .select('*')
        .eq('company_user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadSales();
    }
  }, [currentUser, activeTab]);

  // Función para imprimir ticket
  const printReceipt = (sale) => {
    if (!sale) return;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Por favor, habilita las ventanas emergentes para imprimir tickets.');
      return;
    }
    
    const date = new Date(sale.created_at).toLocaleString();
    const businessName = currentUser?.business_name || 'Comprobante de Pedido';
    const ownerName = currentUser?.owner_name || '';
    const phone = currentUser?.phone || '';

    const html = `
      <html>
        <head>
          <title>Ticket de Pedido</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              padding: 10mm;
              margin: 0;
              font-size: 14px;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed black; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .item { margin-bottom: 5px; }
            .header { font-size: 18px; margin-bottom: 5px; }
            .footer { margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center">
            <div class="header bold">\${businessName}</div>
            <div>\${ownerName}</div>
            <div>Tel: \${phone}</div>
          </div>
          <div class="line"></div>
          <div>FECHA: \${date}</div>
          <div>CLIENTE: \${sale.customer_name}</div>
          <div class="line"></div>
          <div class="bold">DESCRIPCIÓN</div>
          <div class="items">
            \${(sale.item_description || '').split(',').map(item => \`
              <div class="item">\${item.trim()}</div>
            \`).join('')}
          </div>
          <div class="line"></div>
          <div class="flex bold" style="font-size: 18px;">
            <span>TOTAL:</span>
            <span>\${sale.currency_used === 'USD' ? '\$' : 'Bs.'} \${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <div class="center footer">
            ¡GRACIAS POR SU PEDIDO!
            <br>Vuelva pronto.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventario</h2>
            <p className="text-gray-600">Sección de inventario</p>
          </div>
        )}

        {/* Sección de Pedidos */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Pedidos</h2>
            
            {salesLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="py-16 text-center bg-gray-100 rounded-lg">
                <p className="text-gray-500 text-lg">Sin registros de pedidos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase border">Cliente</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase border">Detalle</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase border">Total</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase border">Fecha</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-700 uppercase border text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-100 border-b">
                        <td className="px-4 py-3 border">
                          <p className="font-medium text-gray-900">{sale.customer_name || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 border">
                          <p className="text-sm text-gray-600 max-w-xs truncate" title={sale.item_description}>
                            {sale.item_description || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 py-3 border">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-gray-500">{sale.currency_used === 'USD' ? '$' : 'Bs.'}</span>
                            <span className="font-medium text-blue-600">{parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border">
                          <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 border text-center">
                          <button
                            onClick={() => {
                              try {
                                printReceipt(sale);
                              } catch (error) {
                                console.error('Error al imprimir ticket:', error);
                                alert('Error al intentar imprimir el ticket');
                              }
                            }}
                            className="bg-gray-600 hover:bg-blue-500 hover:text-white w-10 h-10 rounded flex items-center justify-center transition-colors mx-auto text-white"
                            title="Imprimir Ticket"
                          >
                            🖨️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sección de Kiosko */}
        {activeTab === 'presentation' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Kiosko</h2>
            <p className="text-gray-600">Sección de kiosko</p>
          </div>
        )}

        {/* Sección de Configuración */}
        {activeTab === 'config' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Configuración</h2>
            <p className="text-gray-600">Sección de configuración</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;