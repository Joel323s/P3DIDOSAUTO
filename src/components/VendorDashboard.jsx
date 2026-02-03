import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { useCurrency } from '../context/CurrencyContext';
import '../../src/styles/fix-sales-tab.css';

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { exchangeRates, updateExchangeRate } = useCurrency();

  // Manejar posibles errores en la renderización
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState(null);
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [rateArsInput, setRateArsInput] = useState('');
  const [enableBob, setEnableBob] = useState(true);
  const [savingRate, setSavingRate] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    primaryCurrency: 'USD',
    priceUsd: '',
    priceBsf: '',
    priceArg: '',
    pricePosUsd: '',
    pricePosBsf: '',
    pricePosArg: '',
    isOfferUnit: false,
    priceDozenUsd: '',
    priceDozenBsf: '',
    priceDozenArg: '',
    priceDozenPosUsd: '',
    priceDozenPosBsf: '',
    priceDozenPosArg: '',
    isOfferDozen: false,
    image: '',
    imageFile: null,
    images: [],
    category: '',
    stockUnits: 0,
    saleMode: 'unidades',
    countBy: 'units' // 'units' or 'dozens'
  });

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false); // Nuevo estado para subida de archivos

  // Estados para la presentación
  const [presentationSettings, setPresentationSettings] = useState({
    mediaUrl: '',
    videoUrl: '',
    buttonText: 'Comprar ahora'
  });

  // Cargar información del negocio y presentación
  useEffect(() => {
    if (currentUser) {
      setPresentationSettings({
        mediaUrl: currentUser.presentation_media_url || '',
        videoUrl: currentUser.presentation_video_url || '',
        buttonText: currentUser.presentation_button_text || 'Comprar ahora'
      });
      setRateArsInput(currentUser.rate_usd_ars || '1000.00');
      setEnableBob(currentUser.enable_bob !== false);
    }
  }, [currentUser]);

  // Cargar productos del vendedor actual
  useEffect(() => {
    if (!supabase) {
      setInitError('El servicio de base de datos no está disponible. Verifique la configuración.');
      return;
    }
    loadProducts();
    loadCategories();
    if (activeTab === 'sales') loadSales();
  }, [currentUser, activeTab]);

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
      setSales([]); // Asegurar que siempre se establece un valor
      // Opcional: mostrar mensaje de error al usuario
      // setError('No se pudieron cargar las ventas. Intente nuevamente.');
    } finally {
      setSalesLoading(false);
    }
  };

  const handleSaveRates = async () => {
    if (!currentUser?.id) return;
    setSavingRate(true);
    try {
      const numRateBob = 7; // Tasa fija para BOB como solicitó el usuario
      const numRateArs = parseFloat(rateArsInput) || 1000;

      const { error } = await supabase
        .from('company_users')
        .update({
          rate_usd_bob: numRateBob,
          rate_usd_ars: numRateArs,
          enable_bob: enableBob
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      updateExchangeRate('usdToBsf', numRateBob);
      updateExchangeRate('usdToArg', numRateArs);

      alert('Configuración de tasas y moneda actualizada');
    } catch (err) {
      console.error('Error al guardar tasas:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSavingRate(false);
    }
  };

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

  const loadCategories = async () => {
    if (!currentUser?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('vendor_categories')
        .select('*')
        .eq('vendor_id', currentUser.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const loadProducts = async () => {
    if (!currentUser?.id || !supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products_multicurrency')
        .select('*')
        .eq('company_user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      console.error('Mensaje de error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, bucket = 'product-images') => {
    if (!file) return null;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir la imagen: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) {
      alert('Usuario no identificado');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = newProduct.image;
      let imageUrls = [];

      // Si hay archivos seleccionados para subir (MÚLTIPLES)
      if (newProduct.images && newProduct.images.length > 0) {
        setUploading(true);
        for (const file of newProduct.images) {
          const uploadedUrl = await handleFileUpload(file);
          if (uploadedUrl) {
            imageUrls.push(uploadedUrl);
          }
        }
        if (imageUrls.length > 0) {
          imageUrl = imageUrls[0]; // La primera es la principal
        }
      } else if (newProduct.imageFile) {
        // Compatibilidad si solo hay uno
        const uploadedUrl = await handleFileUpload(newProduct.imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const stockMultiplier = newProduct.countBy === 'dozens' ? 12 : 1;

      const newProd = {
        company_user_id: currentUser.id,
        name: newProduct.name,
        description: newProduct.description,
        primary_currency: newProduct.primaryCurrency || 'USD',
        price_usd: parseFloat(newProduct.priceUsd) || 0,
        price_bsf: parseFloat(newProduct.priceBsf) || 0,
        price_arg: parseFloat(newProduct.priceArg) || 0,
        price_pos_usd: parseFloat(newProduct.pricePosUsd) || 0,
        price_pos_bsf: parseFloat(newProduct.pricePosBsf) || 0,
        price_pos_arg: parseFloat(newProduct.pricePosArg) || 0,
        is_offer_unit: newProduct.isOfferUnit || false,
        price_dozen_usd: parseFloat(newProduct.priceDozenUsd) || 0,
        price_dozen_bsf: parseFloat(newProduct.priceDozenBsf) || 0,
        price_dozen_arg: parseFloat(newProduct.priceDozenArg) || 0,
        price_dozen_pos_usd: parseFloat(newProduct.priceDozenPosUsd) || 0,
        price_dozen_pos_bsf: parseFloat(newProduct.priceDozenPosBsf) || 0,
        price_dozen_pos_arg: parseFloat(newProduct.priceDozenPosArg) || 0,
        is_offer_dozen: newProduct.isOfferDozen || false,
        image_url: imageUrl || null,
        images: imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []),
        category: newProduct.category || null,
        stock_units: (parseInt(newProduct.stockUnits) || 0) * stockMultiplier,
        sale_mode: newProduct.saleMode || 'unidades',
        is_active: true
      };

      console.log('Intentando guardar producto:', newProd);

      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('products_multicurrency')
          .update(newProd)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error al actualizar producto:', error);
          throw error;
        }

        setProducts(products.map(p =>
          p.id === editingProduct.id ? { ...newProd, id: editingProduct.id } : p
        ));
        setEditingProduct(null);
      } else {
        // Crear nuevo producto
        console.log('Insertando nuevo producto...');
        const { data, error } = await supabase
          .from('products_multicurrency')
          .insert([newProd])
          .select()
          .single();

        if (error) {
          console.error('Error al insertar producto:', error);
          throw error;
        }

        console.log('Producto insertado con éxito:', data);
        setProducts([data, ...products]);
      }

      // Limpiar formulario
      setNewProduct({
        name: '',
        description: '',
        primaryCurrency: 'USD',
        priceUsd: '',
        priceBsf: '',
        priceArg: '',
        pricePosUsd: '',
        pricePosBsf: '',
        pricePosArg: '',
        isOfferUnit: false,
        priceDozenUsd: '',
        priceDozenBsf: '',
        priceDozenArg: '',
        priceDozenPosUsd: '',
        priceDozenPosBsf: '',
        priceDozenPosArg: '',
        isOfferDozen: false,
        image: '',
        imageFile: null,
        images: [],
        category: '',
        stockUnits: 0,
        saleMode: 'unidades',
        countBy: 'units'
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('Error al guardar el producto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('vendor_categories')
        .insert([{ vendor_id: currentUser.id, name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategoryName('');
    } catch (err) {
      alert('Error al añadir categoría: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar esta categoría?')) return;
    try {
      const { error } = await supabase
        .from('vendor_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      alert('Error al eliminar categoría: ' + err.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      primaryCurrency: product.primary_currency || 'USD',
      priceUsd: (product.price_usd || '').toString(),
      priceBsf: (product.price_bsf || '').toString(),
      priceArg: (product.price_arg || '').toString(),
      pricePosUsd: (product.price_pos_usd || '').toString(),
      pricePosBsf: (product.price_pos_bsf || '').toString(),
      pricePosArg: (product.price_pos_arg || '').toString(),
      isOfferUnit: product.is_offer_unit || false,
      priceDozenUsd: (product.price_dozen_usd || '').toString(),
      priceDozenBsf: (product.price_dozen_bsf || '').toString(),
      priceDozenArg: (product.price_dozen_arg || '').toString(),
      priceDozenPosUsd: (product.price_dozen_pos_usd || '').toString(),
      priceDozenPosBsf: (product.price_dozen_pos_bsf || '').toString(),
      priceDozenPosArg: (product.price_dozen_pos_arg || '').toString(),
      isOfferDozen: product.is_offer_dozen || false,
      image: product.image_url || '',
      imageFile: null,
      images: product.images || [],
      category: product.category || '',
      stockUnits: product.stock_units || 0,
      saleMode: product.sale_mode || 'unidades',
      countBy: 'units'
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products_multicurrency')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('Error al eliminar el producto: ' + err.message);
    }
  };

  // Manejar cambios en precios con conversión automática
  const handlePriceChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    const rateBsf = 7; // Tasa fija BOB
    const rateArg = exchangeRates.usdToArg || 1000;

    setNewProduct(prev => {
      const updates = { [field]: value };

      // Solo permitimos USD como entrada base para simplicidad según pedido
      if (field === 'priceUsd') {
        updates.priceBsf = (numericValue * rateBsf).toFixed(2);
        updates.priceArg = (numericValue * rateArg).toFixed(2);

        // Autocompletar docena si está vacío (sugerencia 12x)
        if (!prev.priceDozenUsd) {
          updates.priceDozenUsd = (numericValue * 12).toFixed(2);
          updates.priceDozenBsf = (numericValue * 12 * rateBsf).toFixed(2);
          updates.priceDozenArg = (numericValue * 12 * rateArg).toFixed(2);
        }
      } else if (field === 'priceDozenUsd') {
        updates.priceDozenBsf = (numericValue * rateBsf).toFixed(2);
        updates.priceDozenArg = (numericValue * rateArg).toFixed(2);
      }

      return { ...prev, ...updates };
    });
  };
  const handleSavePresentation = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('company_users')
        .update({
          presentation_media_url: presentationSettings.mediaUrl,
          presentation_video_url: presentationSettings.videoUrl,
          presentation_button_text: presentationSettings.buttonText
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      alert('Configuración de presentación guardada exitosamente');
    } catch (err) {
      console.error('Error al guardar presentación:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado temprano si hay error de inicialización
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-6 rounded-lg text-center">
          <h2 className="font-bold text-lg mb-2">Error de Conexión</h2>
          <p>{initError}</p>
          <p className="mt-2 text-sm">Por favor verifique la configuración de Supabase.</p>
        </div>
      </div>
    );
  }

  // Dashboard Header & Stats Enhancement
  if (hasError) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ha ocurrido un error</h2>
          <p className="mb-4">Intenta recargar la página o contacta al soporte técnico</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black font-['Outfit']">
      {/* Top Navigation Cockpit */}
      <nav className="sticky top-0 z-[100] glass border-b border-white/5 px-8 py-6 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-400/20 transform -rotate-3">🚀</div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">{currentUser?.business_name || 'Dashboard'}</h1>
              <p className="text-[10px] text-yellow-400 font-black tracking-[0.4em] uppercase opacity-80">Vendor Control Cockpit</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Inventario
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sales' ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Ventas
            </button>
            <button
              onClick={() => setActiveTab('presentation')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'presentation' ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Kiosko
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Categorías
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Ajustes
            </button>

            <div className="w-px h-8 bg-white/10 mx-2"></div>
            <button
              onClick={logout}
              className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Real-time Business Intelligence Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-fade-in">
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 group hover:border-yellow-400/50 transition-all">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Total Ventas</p>
            <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black tracking-tighter text-white">${sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0).toLocaleString()}</h3>
              <span className="text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg text-xs font-black">HOY</span>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 group hover:border-blue-400/50 transition-all">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Productos Activos</p>
            <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black tracking-tighter text-white">{products.length}</h3>
              <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg text-xs font-black">ITEMS</span>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 group hover:border-red-400/50 transition-all">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Agotados</p>
            <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black tracking-tighter text-white">{products.filter(p => (p.stockUnits || 0) <= 0).length}</h3>
              <span className="text-red-500 bg-red-500/10 px-3 py-1 rounded-lg text-xs font-black">ALERTA</span>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 group hover:border-purple-400/50 transition-all">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">Tasa Cambio</p>
            <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black tracking-tighter text-white">{exchangeRates.usdToArg}</h3>
              <span className="text-purple-400 bg-purple-400/10 px-3 py-1 rounded-lg text-xs font-black">ARS/$</span>
            </div>
          </div>
        </div>

        {initError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-[2rem] mb-12 flex items-center justify-between font-bold">
            <div className="flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <p>{initError}</p>
            </div>
          </div>
        )}


        {/* Contenido según pestaña activa */}
        {/* PRODUCTS TAB - Dark Mode Cockpit */}
        {activeTab === 'products' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8 gap-6">
              <div>
                <h3 className="text-6xl font-black text-white uppercase tracking-tighter italic">Inventario</h3>
                <p className="text-gray-400 mt-2 font-medium tracking-widest text-xs uppercase">Gestionar productos y precios dinámicos</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({
                    name: '',
                    description: '',
                    primaryCurrency: 'USD',
                    priceUsd: '',
                    priceBsf: '',
                    priceArg: '',
                    pricePosUsd: '',
                    pricePosBsf: '',
                    pricePosArg: '',
                    isOfferUnit: false,
                    priceDozenUsd: '',
                    priceDozenBsf: '',
                    priceDozenArg: '',
                    priceDozenPosUsd: '',
                    priceDozenPosBsf: '',
                    priceDozenPosArg: '',
                    isOfferDozen: false,
                    image: '',
                    imageFile: null,
                    images: [],
                    category: '',
                    stockUnits: 0,
                    saleMode: 'unidades',
                    countBy: 'units'
                  });
                  setShowAddForm(!showAddForm);
                }}
                className={`group px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-4 ${showAddForm
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {showAddForm ? 'Cancelar Edición' : 'Nuevo Producto'}
                <span className="text-2xl group-hover:rotate-90 transition-transform">{showAddForm ? '✕' : '+'}</span>
              </button>
            </div>

            {/* FORMULARIO DE PRODUCTO - Dark & Glass */}
            {showAddForm && (
              <div className="mb-16 glass-card rounded-[3rem] p-10 md:p-14 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="text-4xl font-black text-white uppercase tracking-tighter">
                    {editingProduct ? 'Editar Item' : 'Crear Item'}
                  </h4>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-12">
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Nombre del Producto</label>
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-2xl font-bold text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                          placeholder="Ej: Hamburguesa Premium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Descripción</label>
                        <textarea
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-lg text-gray-300 focus:border-blue-500 outline-none transition-all placeholder:text-gray-700 min-h-[120px]"
                          placeholder="Detalles deliciosos..."
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Categoría</label>
                        <div className="relative">
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-5 text-xl font-bold text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-black text-gray-500">- Seleccionar Categoría -</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name} className="bg-black text-white">{cat.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white">▼</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Imágenes del Producto</label>
                      <div className="relative group cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            setNewProduct({ ...newProduct, images: files, imageFile: files[0] });
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        />
                        <div className="bg-black/40 border-2 border-dashed border-white/20 rounded-[2rem] h-[300px] flex flex-col items-center justify-center gap-4 group-hover:border-blue-500/50 transition-all">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📸</div>
                          <p className="font-bold text-gray-400 group-hover:text-white transition-colors">Arrastra o Click para subir</p>
                          {newProduct.images.length > 0 && (
                            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black">{newProduct.images.length} Archivos</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5">
                    <h5 className="font-black text-2xl text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Precios & Unidades</h5>

                    <div className="grid md:grid-cols-2 gap-10">
                      {/* UNIT PRICING */}
                      <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-center mb-6">
                          <h6 className="font-black text-blue-400 uppercase tracking-widest text-xs">Precio Unitario</h6>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newProduct.isOfferUnit} onChange={(e) => setNewProduct({ ...newProduct, isOfferUnit: e.target.checked })} className="scale-125 accent-blue-500" />
                            <span className="text-[10px] uppercase font-bold text-gray-400">Oferta</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-2xl font-black text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={newProduct.priceUsd}
                            onChange={(e) => handlePriceChange('priceUsd', e.target.value)}
                            className="w-full bg-transparent text-5xl font-black text-white outline-none placeholder:text-white/10"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-500 uppercase">En Pesos (ARS)</p>
                            <p className="font-bold text-blue-300">${newProduct.priceArg}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-500 uppercase">En Bolivianos (Bs)</p>
                            <p className="font-bold text-gray-300">Bs.{newProduct.priceBsf}</p>
                          </div>
                        </div>
                      </div>

                      {/* DOZEN PRICING */}
                      <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 hover:border-yellow-500/30 transition-all">
                        <div className="flex justify-between items-center mb-6">
                          <h6 className="font-black text-yellow-400 uppercase tracking-widest text-xs">Precio Docena</h6>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newProduct.isOfferDozen} onChange={(e) => setNewProduct({ ...newProduct, isOfferDozen: e.target.checked })} className="scale-125 accent-yellow-500" />
                            <span className="text-[10px] uppercase font-bold text-gray-400">Oferta</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-2xl font-black text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={newProduct.priceDozenUsd}
                            onChange={(e) => handlePriceChange('priceDozenUsd', e.target.value)}
                            className="w-full bg-transparent text-5xl font-black text-white outline-none placeholder:text-white/10"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-[8px] font-black text-gray-500 uppercase">En Pesos (Propuesto)</p>
                            <p className="font-bold text-yellow-200">${newProduct.priceDozenArg}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Stock Disponible</label>
                          <input
                            type="number"
                            value={newProduct.stockUnits}
                            onChange={(e) => setNewProduct({ ...newProduct, stockUnits: e.target.value })}
                            className="w-full bg-black/50 border-2 border-white/10 rounded-2xl p-5 text-4xl font-black text-white text-center focus:border-green-500 outline-none transition-all placeholder:text-white/10"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">Unidad de Conteo</label>
                          <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10">
                            <button type="button" onClick={() => setNewProduct({ ...newProduct, countBy: 'units' })} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${newProduct.countBy === 'units' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Unidades</button>
                            <button type="button" onClick={() => setNewProduct({ ...newProduct, countBy: 'dozens' })} className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${newProduct.countBy === 'dozens' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Docenas</button>
                          </div>
                          <p className="text-[10px] text-gray-500 text-center mt-3 uppercase font-bold">
                            Total Real: {newProduct.countBy === 'dozens' ? (newProduct.stockUnits * 12) : newProduct.stockUnits} Unidades
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full bg-white hover:bg-gray-200 text-black py-8 rounded-[2.5rem] font-black text-3xl uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : (editingProduct ? 'Guardar Cambios' : 'Registrar Producto')}
                  </button>
                </form>
              </div>
            )}

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="group bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/10 hover:border-yellow-400/50 transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col">
                  <div className="relative h-64 overflow-hidden">
                    <img src={product.image_url || 'https://via.placeholder.com/400x300?text=Sin+Imagen'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => handleEditProduct(product)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-blue-600 transition-all">✎</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-all">✕</button>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock_units > 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {product.stock_units > 0 ? `${product.stock_units} Und.` : 'AGOTADO'}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4 group-hover:text-yellow-400 transition-colors">{product.name}</h4>
                    <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">
                      <span className="bg-white/5 px-2 py-1 rounded">{product.category || 'General'}</span>
                    </div>
                    <div className="mt-auto border-t border-white/5 pt-6 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Precio USD</p>
                        <p className="text-3xl font-black text-white tracking-tighter">${product.price_usd?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-blue-500 font-bold uppercase">En Pesos</p>
                        <p className="text-xl font-bold text-blue-400">${Math.round(product.price_usd * exchangeRates.usdToArg).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {products.length === 0 && !loading && (
              <div className="text-center py-32 opacity-20">
                <span className="text-8xl">📦</span>
                <p className="text-2xl font-black uppercase mt-4">Inventario Vacío</p>
              </div>
            )}
          </div>
        )}

        {/* PRESENTATION TAB - Dark Mode Cockpit */}
        {activeTab === 'presentation' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8 gap-6">
              <div>
                <h3 className="text-6xl font-black text-white uppercase tracking-tighter italic">Kiosko</h3>
                <p className="text-gray-400 mt-2 font-medium tracking-widest text-xs uppercase">Personaliza la experiencia de tus clientes</p>
              </div>
              <button
                onClick={() => window.open(`${window.location.origin}/vendor/${currentUser?.id}/presentation`, '_blank')}
                className="px-10 py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3"
              >
                <span>🚀</span> Abrir Kiosko
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* SETTINGS CARD */}
              <div className="lg:col-span-1 space-y-8">
                <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
                  <h4 className="font-black text-white uppercase tracking-widest text-xs mb-8 border-b border-white/5 pb-4">Multimedia de Bienvenida</h4>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Subir Imagen o Video de Fondo</label>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleFileUpload(file);
                            if (url) { setPresentationSettings({ ...presentationSettings, mediaUrl: url }); alert(file.type.startsWith('image/') ? 'Imagen cargada' : 'Video cargado'); }
                          }
                        }}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Texto Botón</label>
                      <input
                        type="text"
                        value={presentationSettings.buttonText}
                        onChange={(e) => setPresentationSettings({ ...presentationSettings, buttonText: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-purple-500 transition-all"
                        placeholder="Ej: Ordenar Ahora"
                      />
                    </div>
                    <button
                      onClick={handleSavePresentation}
                      className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-blue-900/10">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-4">Link Público</p>
                  <div className="flex gap-2">
                    <input readOnly value={`${window.location.origin}/vendor/${currentUser?.id}/presentation`} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-blue-200 font-mono overflow-hidden" />
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/vendor/${currentUser?.id}/presentation`); alert('Link copiado!'); }} className="bg-blue-600 text-white p-2 rounded-lg text-xs hover:bg-blue-500">📋</button>
                  </div>
                </div>
              </div>

              {/* PREVIEW & GALLERY */}
              <div className="lg:col-span-2 space-y-8">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
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
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                      <p className="text-gray-600 font-black uppercase tracking-widest">Vista Previa</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-xl mb-6">{currentUser?.business_name || 'TU NEGOCIO'}</h2>
                    <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-xl transform scale-90 opacity-80">{presentationSettings.buttonText}</button>
                  </div>
                  <div className="absolute top-6 left-6 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Simulación Kiosko</span>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                  <h5 className="font-black text-white uppercase tracking-widest text-xs mb-6">Galería Rápida</h5>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {products.filter(p => p.image_url).map(p => (
                      <img
                        key={p.id}
                        src={p.image_url}
                        onClick={() => setPresentationSettings({ ...presentationSettings, mediaUrl: p.image_url })}
                        className="w-24 h-24 rounded-2xl object-cover cursor-pointer hover:scale-105 hover:border-2 hover:border-purple-500 transition-all border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="glass-card rounded-[3rem] p-10 border border-white/5 animate-fade-in-up">
            <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">Gestionar Categorías</h3>
                <p className="text-gray-400 mt-2 font-medium">Organiza tu kiosko digital para una mejor experiencia.</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="mb-12 max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="NUEVA CATEGORÍA..."
                  className="flex-1 bg-black/50 border-2 border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-400 transition-all placeholder:text-gray-600 uppercase tracking-widest"
                  required
                />
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  + Agregar
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 flex justify-between items-center hover:border-yellow-400/50 transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span className="font-black text-white uppercase tracking-widest">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                      title="Eliminar categoría"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
                  <span className="text-4xl block mb-4 opacity-30">📂</span>
                  <p className="text-gray-500 font-bold uppercase tracking-widest">No hay categorías creadas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="bg-gray-900 rounded-lg p-6 md:p-8 border border-gray-700 min-h-[500px]">
            <h3 className="text-2xl font-bold text-white mb-6 w-full border-b border-gray-700 pb-4">
              Historial de Ventas
            </h3>

            {salesLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="py-16 text-center bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-4xl block mb-4">🧾</span>
                <p className="text-gray-400 text-lg">Sin registros de ventas</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">Detalle</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{sale.customer_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">ID: {sale.id?.slice(0, 6) || 'N/A'}</p>
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
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
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
                            className="bg-gray-700 hover:bg-yellow-500 hover:text-black w-10 h-10 rounded flex items-center justify-center transition-colors mx-auto"
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

        {activeTab === 'config' && (
          <div className="glass-card max-w-3xl mx-auto rounded-[3rem] p-12 border border-white/5 animate-fade-in-up">
            <h3 className="text-4xl font-black text-white mb-10 w-full border-b border-white/10 pb-6 uppercase tracking-tighter italic">
              Configuración de Moneda
            </h3>

            <div className="space-y-10">
              <div className="bg-[#0a0a0a] p-8 rounded-[2rem] border border-white/10 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                <div>
                  <h4 className="font-black text-xl text-white uppercase tracking-wide">Habilitar Bolivianos (Bs)</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium max-w-xs">Permite a los clientes ver precios y pagar en moneda local.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={enableBob}
                    onChange={(e) => setEnableBob(e.target.checked)}
                    className="w-10 h-10 accent-blue-500 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-8 rounded-[2rem] border border-white/10 group hover:border-purple-500/30 transition-all">
                <label className="block text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Tasa de Cambio ARS (Peso Argentino)</label>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black">$1 USD = </span>
                    <input
                      type="number"
                      step="0.01"
                      value={rateArsInput}
                      onChange={(e) => setRateArsInput(e.target.value)}
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-5 pl-24 pr-16 text-3xl font-black text-white focus:border-purple-500 outline-none transition-all placeholder:text-white/10"
                      placeholder="1000"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 font-black">ARS</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-4 ml-4 italic">Esta tasa se usará para calcular automáticamente los precios en Pesos.</p>
              </div>

              <button
                onClick={handleSaveRates}
                disabled={savingRate}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingRate ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default VendorDashboard;