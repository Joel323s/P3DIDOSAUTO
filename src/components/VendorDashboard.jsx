import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { useCurrency } from '../context/CurrencyContext';

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { exchangeRates, updateExchangeRate } = useCurrency();
  const [activeTab, setActiveTab] = useState('products');
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [presentationSettings, setPresentationSettings] = useState({
    mediaUrl: '',
    buttonText: 'Comprar ahora'
  });

  // Cargar configuración de presentación
  useEffect(() => {
    if (currentUser?.id) {
      setPresentationSettings({
        mediaUrl: currentUser.presentation_media_url || '',
        buttonText: currentUser.presentation_button_text || 'Comprar ahora'
      });
    }
  }, [currentUser]);

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
      console.error('Error al cargar ventas:', err);
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

  // Función para subir archivos
  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    // Simular subida de archivo (en la implementación real, esto subiría a Supabase Storage)
    return URL.createObjectURL(file);
  };

  // Función para guardar configuración de presentación
  const handleSavePresentation = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('company_users')
        .update({
          presentation_media_url: presentationSettings.mediaUrl,
          presentation_button_text: presentationSettings.buttonText
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      alert('Configuración guardada');
    } catch (err) {
      console.error('Error al guardar presentación:', err);
      alert('Error al guardar la configuración');
    }
  };

  // Función para imprimir ticket
  const printReceipt = (sale) => {
    if (!sale) return;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Por favor, habilita las ventanas emergentes para imprimir tickets.');
      return;
    }
    
    const date = new Date(sale.created_at).toLocaleString();
    const businessName = currentUser?.business_name || 'Comprobante de Venta';
    const ownerName = currentUser?.owner_name || '';
    const phone = currentUser?.phone || '';

    const html = `
      <html>
        <head>
          <title>Ticket de Venta</title>
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
            <div class="header bold">${businessName}</div>
            <div>${ownerName}</div>
            <div>Tel: ${phone}</div>
          </div>
          <div class="line"></div>
          <div>FECHA: ${date}</div>
          <div>CLIENTE: ${sale.customer_name}</div>
          <div class="line"></div>
          <div class="bold">DESCRIPCIÓN</div>
          <div class="items">
            ${(sale.item_description || '').split(',').map(item => `
              <div class="item">${item.trim()}</div>
            `).join('')}
          </div>
          <div class="line"></div>
          <div class="flex bold" style="font-size: 18px;">
            <span>TOTAL:</span>
            <span>${sale.currency_used === 'USD' ? '$' : 'Bs.'} ${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <div class="center footer">
            ¡GRACIAS POR SU COMPRA!
            <br>Vuelva pronto.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navegación simplificada */}
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-4 py-2 rounded ${activeTab === 'presentation' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Kiosko
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded ${activeTab === 'config' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Ajustes
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 ml-auto"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        {/* Sección de Inventario */}
        {activeTab === 'products' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Inventario</h2>
            <p>Sección de inventario</p>
          </div>
        )}

        {/* Sección de Pedidos */}
        {activeTab === 'orders' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Historial de Pedidos</h2>

            {salesLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="py-16 text-center bg-gray-700 rounded-lg">
                <p className="text-gray-400 text-lg">Sin registros de pedidos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase">Detalle</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase">Total</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{sale.customer_name || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-300 max-w-xs truncate" title={sale.item_description}>
                            {sale.item_description || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-gray-400">{sale.currency_used === 'USD' ? '$' : 'Bs.'}</span>
                            <span className="font-medium text-yellow-400">{parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              try {
                                printReceipt(sale);
                              } catch (error) {
                                console.error('Error al imprimir ticket:', error);
                                alert('Error al intentar imprimir el ticket');
                              }
                            }}
                            className="bg-gray-600 hover:bg-yellow-500 hover:text-black w-10 h-10 rounded flex items-center justify-center transition-colors mx-auto"
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
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Kiosko</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vista previa */}
              <div className="space-y-6">
                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden relative">
                  {presentationSettings.mediaUrl ? (
                    presentationSettings.mediaUrl.toLowerCase().endsWith('.mp4') ||
                    presentationSettings.mediaUrl.toLowerCase().endsWith('.mov') ||
                    presentationSettings.mediaUrl.toLowerCase().endsWith('.avi') ||
                    presentationSettings.mediaUrl.toLowerCase().endsWith('.webm') ? (
                      <video src={presentationSettings.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img src={presentationSettings.mediaUrl} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-600">
                      <p className="text-gray-400">Vista Previa</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-bold text-white mb-4">{currentUser?.business_name || 'TU NEGOCIO'}</h2>
                    <button className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold">{presentationSettings.buttonText}</button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Texto del Botón</label>
                    <input
                      type="text"
                      value={presentationSettings.buttonText}
                      onChange={(e) => setPresentationSettings({ ...presentationSettings, buttonText: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Texto del botón"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subir Imagen o Video</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          if (url) {
                            setPresentationSettings({ ...presentationSettings, mediaUrl: url });
                            alert(file.type.startsWith('image/') ? 'Imagen cargada' : 'Video cargado');
                          }
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleSavePresentation}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Configuración del Kiosko</h3>
                <p className="text-sm text-gray-300">
                  Personaliza la experiencia de tus clientes con imágenes o videos atractivos.
                  El kiosko se mostrará en la dirección: {`${window.location.origin}/vendor/${currentUser?.id}/presentation`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Configuración */}
        {activeTab === 'config' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Configuración</h2>
            <p>Sección de configuración</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;