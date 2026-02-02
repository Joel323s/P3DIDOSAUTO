import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const PresentationView = () => {
  const { vendorId } = useParams(); // Obtener el ID del vendedor de la URL
  const { currentUser } = useAuth();
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [showCheckout, setShowCheckout] = useState(false);
  const [purchasedProduct, setPurchasedProduct] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Estados para la tienda interactiva
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('ARS'); // Moneda elegida por el cliente
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedSaleUnit, setSelectedSaleUnit] = useState('unit'); // 'unit' o 'dozen'

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { updateExchangeRate, exchangeRates } = useCurrency();

  // Cargar información del vendedor y sus productos
  useEffect(() => {
    if (!supabase) {
      setInitError('El servicio de base de datos no está disponible. Verifique la configuración.');
      setLoading(false);
      return;
    }

    const loadPresentationData = async () => {
      console.log('Cargando presentación para:', vendorId || currentUser?.id);
      try {
        // Si se proporciona un vendorId en la URL, buscar la información
        if (vendorId) {
          const { data: vendorData, error: vendorError } = await supabase
            .from('company_users')
            .select('*')
            .eq('id', vendorId)
            .single();

          if (vendorError) {
            console.error('Error cargando info del vendedor:', vendorError);
            throw vendorError;
          }

          if (vendorData) {
            setVendorInfo(vendorData);
            if (vendorData.rate_usd_bob) {
              updateExchangeRate('usdToBsf', vendorData.rate_usd_bob);
            }
            if (vendorData.rate_usd_ars) {
              updateExchangeRate('usdToArg', vendorData.rate_usd_ars);
            }
          }
        } else if (currentUser) {
          setVendorInfo(currentUser);
          if (currentUser.rate_usd_bob) {
            updateExchangeRate('usdToBsf', currentUser.rate_usd_bob);
          }
          if (currentUser.rate_usd_ars) {
            updateExchangeRate('usdToArg', currentUser.rate_usd_ars);
          }
        }

        const vendorIdToUse = vendorId || currentUser?.id;
        if (vendorIdToUse) {
          console.log('Buscando productos para UUID:', vendorIdToUse);

          // Cargar Categorías
          const { data: catData } = await supabase
            .from('vendor_categories')
            .select('*')
            .eq('vendor_id', vendorIdToUse);
          setCategories(catData || []);

          const { data: productsData, error: productsError } = await supabase
            .from('products_multicurrency')
            .select('*')
            .eq('company_user_id', vendorIdToUse);

          if (productsError) {
            console.error('Error cargando productos:', productsError);
            throw productsError;
          }

          console.log('Productos encontrados:', productsData?.length || 0);

          if (productsData && productsData.length > 0) {
            const mappedProducts = productsData.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description,
              primaryCurrency: product.primary_currency || 'USD',
              priceUsd: product.price_usd,
              priceBsf: product.price_bsf,
              priceArg: product.price_arg,
              pricePosUsd: product.price_pos_usd,
              pricePosBsf: product.price_pos_bsf,
              pricePosArg: product.price_pos_arg,
              isOfferUnit: product.is_offer_unit,
              priceDozenUsd: product.price_dozen_usd,
              priceDozenBsf: product.price_dozen_bsf,
              priceDozenArg: product.price_dozen_arg,
              priceDozenPosUsd: product.price_dozen_pos_usd,
              priceDozenPosBsf: product.price_dozen_pos_bsf,
              priceDozenPosArg: product.price_dozen_pos_arg,
              isOfferDozen: product.is_offer_dozen,
              category: product.category,
              stockUnits: product.stock_units || 0,
              saleMode: product.sale_mode || 'unidades',
              image: product.image_url || 'https://via.placeholder.com/800x600?text=' + encodeURIComponent(product.name),
              images: product.images || [],
              buttonText: '¡Comprar Ahora!',
              currency: 'ARS'
            }));
            setProducts(mappedProducts);
          } else {
            console.warn('No se encontraron productos para este vendedor.');
          }
        }
      } catch (error) {
        console.error('Error fatal en loadPresentationData:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPresentationData();
  }, [vendorId, currentUser, supabase]);

  // SUSCRIPCIÓN EN TIEMPO REAL PARA STOCK
  useEffect(() => {
    const vendorIdToUse = vendorId || currentUser?.id;
    if (!vendorIdToUse || !supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products_multicurrency',
          filter: `company_user_id=eq.${vendorIdToUse}`
        },
        (payload) => {
          console.log('Cambio en stock detectado:', payload);
          if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p =>
              p.id === payload.new.id
                ? { ...p, ...payload.new, stockUnits: payload.new.stock_units }
                : p
            ));
          } else if (payload.eventType === 'INSERT') {
            // Opcional: Recargar todo o insertar el nuevo
            // Para simplificar, recargamos productos si hay un insert
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, currentUser, supabase]);


  // Lógica de Inactividad: Volver al inicio tras 2 minutos de silencio
  useEffect(() => {
    if (showSplash) return; // No necesitamos el timer si ya estamos en el inicio

    let timeoutId;
    const INACTIVITY_LIMIT = 60000; // 1 minuto (ajustado por petición del usuario)

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Inactividad detectada: Volviendo al inicio');
        setShowSplash(true);
        setSelectedProduct(null);
        setIsCartOpen(false);
      }, INACTIVITY_LIMIT);
    };

    // Eventos que cuentan como "actividad"
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Iniciar el timer por primera vez
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [showSplash]);

  const handleBuyClick = (product) => {
    setSelectedProduct(product);
    // Definir la unidad por defecto según el modo de venta del producto
    if (product.saleMode === 'docenas') {
      setSelectedSaleUnit('dozen');
    } else {
      setSelectedSaleUnit('unit');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const baseUsd = item.isDozen ? (item.priceDozenUsd || (item.priceUsd * 12)) : item.priceUsd;
      let price = baseUsd;

      if (selectedCurrency === 'ARS') {
        price = baseUsd * (exchangeRates.usdToArg || 1000);
      } else if (selectedCurrency === 'BSF') {
        price = baseUsd * 7;
      }

      return total + (price * item.quantity);
    }, 0);
  };

  const handleFinalizePurchase = async () => {
    // Validar que el nombre esté completo
    if (!customerInfo.name.trim()) {
      alert('Por favor, ingrese su nombre completo');
      return;
    }

    setLoading(true);
    try {
      const itemsDescription = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
      const totalAmount = calculateTotal();

      // 1. Registrar la venta en final_sales
      const { error: saleError } = await supabase
        .from('final_sales')
        .insert([{
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          total_amount: totalAmount,
          item_description: itemsDescription,
          currency_used: selectedCurrency,
          company_user_id: vendorId || currentUser?.id,
          status: 'completed'
        }]);

      if (saleError) {
        console.error('Error detallado de base de datos:', saleError);
        throw saleError;
      }

      // 2. Restar Stock de cada producto
      console.log('Restando stock para items:', cart.length);
      for (const item of cart) {
        const { data: currentProd } = await supabase
          .from('products_multicurrency')
          .select('stock_units')
          .eq('id', item.id)
          .single();

        if (currentProd) {
          const unitsToSubtract = item.isDozen ? (item.quantity * 12) : item.quantity;
          const newStock = Math.max(0, currentProd.stock_units - unitsToSubtract);
          await supabase
            .from('products_multicurrency')
            .update({ stock_units: newStock })
            .eq('id', item.id);
        }
      }

      // Mostrar mensaje de éxito
      alert(`¡Gracias por su compra ${customerInfo.name}!\n\nPedido: ${itemsDescription}.\nTotal: ${totalAmount.toFixed(2)} ${selectedCurrency}\n\nPor favor, pague y recoja su pedido en caja.`);

      // Resetear para nueva compra
      setShowCheckout(false);
      setCustomerInfo({ name: '', phone: '' });
      setPurchasedProduct(null);
      clearCart();

      // Recargar la página automáticamente para empezar de cero
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error al registrar la compra:', error);
      alert('Hubo un error al procesar su compra. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado temprano si hay error de inicialización
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Error de Conexión</h1>
          <p>{initError}</p>
          <p className="mt-2 text-sm">Por favor verifique la configuración de Supabase.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Cargando presentación...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Lo sentimos</h1>
          <p className="text-xl">No hay productos disponibles para mostrar en esta presentación.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-400 selection:text-black">
      {showSplash ? (
        // PANTALLA DE BIENVENIDA (SPLASH) - DUAL MEDIA (VIDEO + IMAGE)
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center text-center overflow-x-hidden">
          {/* Fondo: Video o Imagen Full Screen (FORZADO) */}
          {vendorInfo?.presentation_video_url ? (
            <div className="fixed inset-0 z-0">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={vendorInfo.presentation_video_url} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ) : vendorInfo?.presentation_media_url ? (
            <div className="fixed inset-0 z-0">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${vendorInfo.presentation_media_url})` }}
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          ) : (
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 to-black" />
          )}

          {/* Imagen de Marca (Logo/Central) - Logo flotante */}
          {vendorInfo?.presentation_media_url && vendorInfo?.presentation_video_url && (
            <div className="relative z-20 mb-12 animate-fade-in-up">
              <div className="relative p-2 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl">
                <img
                  src={vendorInfo.presentation_media_url}
                  className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-[2rem] shadow-inner"
                  alt="Logo"
                />
              </div>
            </div>
          )}

          {/* Contenido Superpuesto con Tipografía Premium */}
          <div className="relative z-30 px-4 animate-fade-in">
            <h1 className="text-7xl md:text-[10rem] font-black mb-4 text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] tracking-tighter uppercase italic leading-[0.8]">
              {vendorInfo?.business_name || 'BIENVENIDO'}
            </h1>

            <p className="text-xl md:text-3xl text-gray-300 mb-16 max-w-2xl mx-auto drop-shadow-lg font-medium tracking-[0.3em] uppercase opacity-80">
              {vendorInfo?.presentation_video_url || vendorInfo?.presentation_media_url
                ? 'Una experiencia gastronómica superior'
                : 'Estamos preparando algo especial'}
            </p>

            <button
              onClick={() => setShowSplash(false)}
              className="group relative bg-white hover:bg-yellow-400 text-black text-3xl md:text-5xl font-black py-10 px-24 rounded-[3rem] shadow-[0_30px_100px_rgba(255,255,255,0.1)] transition-all active:scale-95 hover:scale-105 duration-500 overflow-hidden"
            >
              <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600"></div>
              <span className="relative z-10 flex items-center gap-6">
                {vendorInfo?.presentation_button_text || 'COMENZAR'}
                <span className="transition-transform group-hover:translate-x-4">→</span>
              </span>
            </button>
          </div>

          {/* Decoración inferior */}
          <div className="absolute bottom-12 animate-bounce opacity-50">
            <div className="w-1 h-20 rounded-full bg-gradient-to-b from-yellow-400 to-transparent" />
          </div>
        </div>
      ) : !showCheckout ? (
        // VISTA DE CATÁLOGO (GRID VIEW)
        <div className="relative min-h-screen w-full bg-[#050505] pb-20">
          {/* Header del Catálogo - Glassmorphism */}
          <div className="sticky top-0 z-50 glass border-b border-white/5 px-8 py-8 flex justify-between items-center backdrop-blur-3xl">
            <div className="flex items-center gap-6">
              <div className="bg-yellow-400 text-black w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl shadow-[0_10px_30px_rgba(234,179,8,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform">
                {vendorInfo?.business_name?.substring(0, 1) || 'V'}
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{vendorInfo?.business_name}</h2>
                <p className="text-[10px] text-yellow-400 uppercase font-black tracking-[0.4em] mt-1 opacity-80">Premium Experience</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-white/5 hover:bg-white/10 text-white py-5 px-10 rounded-2xl flex items-center gap-4 group transition-all border border-white/10 shadow-2xl"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Su pedido</p>
                  <p className="text-sm font-black text-white">{cart.length} ITEMS</p>
                </div>
                <div className="relative">
                  <span className="text-2xl group-hover:scale-110 transition-transform inline-block">🛒</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-3 -right-3 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-lg border-2 border-[#111] animate-bounce">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Categorías (Filtros) - Estilo Horizontal Apple */}
          {categories.length > 0 && (
            <div className="sticky top-[112px] z-[40] glass border-b border-white/5 px-8 py-6 flex gap-4 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveCategory('Todas')}
                className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${activeCategory === 'Todas'
                  ? 'bg-white text-black shadow-2xl scale-105'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'
                  }`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${activeCategory === cat.name
                    ? 'bg-white text-black shadow-2xl scale-105'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid de Productos - Cinematic & High Fidelity */}
          <div className="w-full mx-auto px-8 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {products
                .filter(p => activeCategory === 'Todas' || p.category === activeCategory)
                .map((product, idx) => (
                  <div
                    key={product.id}
                    onClick={() => handleBuyClick(product)}
                    className="group relative bg-[#0a0a0a] rounded-[3rem] overflow-hidden border border-white/5 hover:border-yellow-400/50 transition-all duration-700 hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] hover:-translate-y-4 flex flex-col cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {/* Media Container */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />

                      {/* Stock & Offer Badges */}
                      <div className="absolute top-8 left-8 flex flex-col gap-3">
                        <div className={`px-5 py-2 rounded-2xl glass font-black text-[10px] uppercase tracking-widest ${product.stockUnits > 0
                          ? 'text-green-400 border-green-500/20'
                          : 'text-red-500 border-red-500/20'
                          }`}>
                          {product.stockUnits > 0 ? 'En Stock' : 'Agotado'}
                        </div>

                        {(product.isOfferUnit || product.isOfferDozen) && (
                          <div className="bg-yellow-400 text-black px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-pulse">
                            OFERTA
                          </div>
                        )}
                      </div>

                      {/* Dynamic Price Badge */}
                      <div className="absolute bottom-10 left-8">
                        <div className="bg-white text-black px-8 py-4 rounded-[2rem] text-4xl font-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] group-hover:bg-yellow-400 transition-colors">
                          {(() => {
                            let price = product.priceUsd;
                            if (selectedCurrency === 'ARS') price = product.priceUsd * (exchangeRates.usdToArg || 1000);
                            else if (selectedCurrency === 'BSF') price = product.priceUsd * 7;

                            return (
                              <>
                                {selectedCurrency === 'ARS' ? `$${Math.round(price).toLocaleString()}` : selectedCurrency === 'BSF' ? `Bs.${price.toFixed(2)}` : `$${price.toFixed(2)}`}
                                <span className="text-xs ml-2 font-bold opacity-40">{selectedCurrency}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-10 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em]">{product.category || 'Categoría'}</span>
                        <div className="h-[1px] flex-1 bg-white/5"></div>
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-none group-hover:text-yellow-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-500 text-sm font-medium leading-relaxed italic opacity-60">
                        {product.description || 'Una experiencia culinaria única preparada con ingredientes seleccionados.'}
                      </p>

                      <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-white/20 group-hover:text-yellow-400 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest">Ver detalles</span>
                        <span className="text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* MODAL DE DETALLE DE PRODUCTO */}
          {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                onClick={() => setSelectedProduct(null)}
              ></div>

              <div className="relative glass w-full max-w-6xl md:h-[85vh] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)] flex flex-col md:flex-row animate-fade-in">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-10 right-10 z-20 bg-white/10 hover:bg-white/20 w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-3xl transition-all hover:rotate-90 group"
                >✕</button>

                {/* Imagen Modal - Cinematic View */}
                <div className="w-full md:w-1/2 h-80 md:h-full relative overflow-hidden">
                  <img src={selectedProduct.image} className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105" alt={selectedProduct.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent md:bg-gradient-to-r md:from-[#050505] md:via-transparent" />
                </div>

                {/* Info Modal - Luxury Content */}
                <div className="p-10 md:p-20 w-full md:w-1/2 flex flex-col justify-center overflow-y-auto bg-gradient-to-br from-[#050505] to-[#111]">
                  <div className="mb-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500 mb-4 block opacity-80">Selección Premium</span>
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 italic leading-[0.9]">
                      {selectedProduct.name}
                    </h2>
                    <div className="h-2 w-20 bg-yellow-400 rounded-full"></div>
                  </div>

                  <p className="text-gray-400 text-xl md:text-2xl mb-12 font-medium leading-relaxed italic opacity-80">
                    {selectedProduct.description || 'Una experiencia culinaria única preparada con ingredientes seleccionados de la más alta calidad.'}
                  </p>

                  <div className="mb-12">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Seleccione su Método de Pago</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedCurrency('USD')}
                        className={`group relative flex-1 py-8 rounded-3xl font-black text-2xl transition-all ${selectedCurrency === 'USD' ? 'bg-white text-black shadow-2xl scale-105' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                      >
                        USD <span className="opacity-40 text-sm ml-2">$</span>
                      </button>

                      {vendorInfo?.rate_usd_ars > 0 && (
                        <button
                          onClick={() => setSelectedCurrency('ARS')}
                          className={`group relative flex-1 py-8 rounded-3xl font-black text-2xl transition-all ${selectedCurrency === 'ARS' ? 'bg-white text-black shadow-2xl scale-105' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                        >
                          ARS <span className="opacity-40 text-sm ml-2">$</span>
                        </button>
                      )}

                      {vendorInfo?.enable_bob !== false && (
                        <button
                          onClick={() => setSelectedCurrency('BSF')}
                          className={`group relative flex-1 py-8 rounded-3xl font-black text-2xl transition-all ${selectedCurrency === 'BSF' ? 'bg-white text-black shadow-2xl scale-105' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                        >
                          BOB <span className="opacity-40 text-sm ml-2">Bs</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Precio Dinámico - Cinematic Display */}
                  <div className="mb-12 group">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-2 opacity-50">Total de este artículo</p>
                    <div className="flex items-baseline gap-4">
                      <p className="text-7xl md:text-9xl font-black tracking-tighter leading-none">
                        {selectedSaleUnit === 'dozen' ? (
                          selectedCurrency === 'ARS' ? `$${Math.round((selectedProduct.priceDozenUsd || (selectedProduct.priceUsd * 12)) * exchangeRates.usdToArg).toLocaleString()}` : `$${(selectedProduct.priceDozenUsd || (selectedProduct.priceUsd * 12)).toFixed(2)}`
                        ) : (
                          selectedCurrency === 'ARS' ? `$${Math.round(selectedProduct.priceUsd * exchangeRates.usdToArg).toLocaleString()}` : `$${selectedProduct.priceUsd.toFixed(2)}`
                        )}
                      </p>
                      <span className="text-2xl font-black text-yellow-400 uppercase italic">{selectedCurrency}</span>
                    </div>
                    {selectedSaleUnit === 'dozen' && (
                      <p className="text-sm font-black text-blue-400 mt-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-8 h-px bg-blue-400/50"></span>
                        OFERTA POR DOCENA ACTIVADA
                      </p>
                    )}
                  </div>

                  {/* Info Stock & Unit Selector - High Fidelity */}
                  <div className="mb-12 flex flex-col gap-8">
                    {/* Selector de Unidad */}
                    {selectedProduct.saleMode === 'ambos' && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">¿Cómo desea llevarlo?</p>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setSelectedSaleUnit('unit')}
                            className={`flex-1 py-8 rounded-3xl font-black text-xl transition-all border-2 ${selectedSaleUnit === 'unit' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:bg-white/5'}`}
                          >
                            Unidad Suelta
                          </button>
                          <button
                            onClick={() => setSelectedSaleUnit('dozen')}
                            className={`flex-1 py-8 rounded-3xl font-black text-xl transition-all border-2 ${selectedSaleUnit === 'dozen' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/10 hover:bg-white/5'}`}
                          >
                            Docena Cerrada
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`px-6 py-4 rounded-2xl glass font-black text-xs uppercase tracking-[0.2em] flex items-center justify-between ${selectedProduct.stockUnits > 0 ? 'text-green-400' : 'text-red-500'}`}>
                      <span>Disponibilidad</span>
                      <span>{selectedProduct.stockUnits > 0 ? 'Disponible ahora' : 'Sin existencias'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedProduct.stockUnits <= 0) return;
                      const isDozen = selectedSaleUnit === 'dozen';
                      addToCart({ ...selectedProduct, currency: selectedCurrency }, isDozen);
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
                    disabled={selectedProduct.stockUnits <= 0}
                    className={`group relative w-full py-10 rounded-[2.5rem] font-black text-2xl uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-6 overflow-hidden ${selectedProduct.stockUnits > 0
                      ? 'bg-yellow-400 text-black hover:bg-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}
                  >
                    <span className="relative z-10">{selectedProduct.stockUnits > 0 ? 'Añadir al Pedido' : 'No Disponible'}</span>
                    <span className="relative z-10 group-hover:translate-x-2 transition-transform">🛒</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIDEBAR DEL CARRITO - Premium Glass */}
          {isCartOpen && (
            <div className="fixed inset-0 z-[200]">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsCartOpen(false)}></div>
              <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-black border-l border-white/10 shadow-4xl p-12 flex flex-col animate-slide-in-right">
                <div className="flex justify-between items-center mb-16">
                  <div>
                    <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">SU PEDIDO</h2>
                    <p className="text-[10px] text-yellow-400 font-black tracking-[0.4em] mt-2">RESUMEN DE SELECCIÓN</p>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-black hover:bg-red-600 transition-all border border-white/10">✕</button>
                </div>

                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
                    <span className="text-9xl mb-10">🛒</span>
                    <p className="text-2xl font-black italic uppercase tracking-widest">Carrito Vacío</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto pr-4 no-scrollbar space-y-8">
                      {cart.map((item, idx) => (
                        <div key={`${item.id}-${item.currency}-${idx}`} className="glass-card rounded-[2rem] p-8 border border-white/5 flex gap-8 group animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="relative">
                            <img src={item.image} className="w-24 h-24 rounded-2xl object-cover shadow-2xl" alt={item.name} />
                            {item.isDozen && <span className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-xl">DOCENA</span>}
                          </div>

                          <div className="flex-1">
                            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-2">{item.name}</h4>
                            <div className="flex items-center justify-between mt-6">
                              <div className="flex items-center gap-6 bg-white/5 rounded-2xl px-4 py-2 border border-white/5">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.stockUnits, item.isDozen)} className="text-2xl font-black hover:text-yellow-400 transition-colors">－</button>
                                <span className="font-black text-xl w-6 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.stockUnits, item.isDozen)} className="text-2xl font-black hover:text-yellow-400 transition-colors">＋</button>
                              </div>
                              <div className="text-right">
                                {(() => {
                                  const baseUsd = item.isDozen ? (item.priceDozenUsd || (item.priceUsd * 12)) : item.priceUsd;
                                  let displayPrice = baseUsd;
                                  if (selectedCurrency === 'ARS') displayPrice = baseUsd * (exchangeRates.usdToArg || 1000);
                                  else if (selectedCurrency === 'BSF') displayPrice = baseUsd * 7;

                                  return (
                                    <p className="text-2xl font-black text-yellow-400">
                                      {selectedCurrency === 'ARS' ? `$${Math.round(displayPrice * item.quantity).toLocaleString()}` : `$${(displayPrice * item.quantity).toFixed(2)}`}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="self-start text-white/20 hover:text-red-500 transition-colors text-xl">✕</button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/10">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total aproximado</p>
                          <p className="text-4xl font-black tracking-tighter text-white">${calculateTotal().toFixed(2)}</p>
                        </div>
                        <p className="text-xl font-bold text-yellow-400 italic underline uppercase">{selectedCurrency}</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          setShowCheckout(true);
                        }}
                        className="w-full bg-yellow-400 hover:bg-white text-black py-8 rounded-3xl font-black text-2xl uppercase tracking-widest transition-all shadow-2xl transform active:scale-95 border-b-8 border-yellow-600"
                      >
                        CONFIRMAR TODO
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Vista de checkout/finalización de compra - Cinematic Final Step
        <div className="flex items-center justify-center min-h-screen bg-[#050505] p-6 overflow-hidden relative">
          {/* Fondo decorativo */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-400/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

          <div className="relative glass w-full max-w-4xl rounded-[4rem] p-12 md:p-24 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)] animate-fade-in">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-400 mb-4 block">Paso Final</span>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-white">
                ¿LISTO?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Detalle de su Selección</p>
                <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center text-sm border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-white uppercase">{item.name}</span>
                        <span className="text-[10px] text-gray-500 font-bold">{item.quantity} x {item.isDozen ? 'Docena' : 'Unidad'}</span>
                      </div>
                      {(() => {
                        const baseUsd = item.isDozen ? (item.priceDozenUsd || (item.priceUsd * 12)) : item.priceUsd;
                        let displayPrice = baseUsd;
                        if (selectedCurrency === 'ARS') displayPrice = baseUsd * (exchangeRates.usdToArg || 1000);
                        else if (selectedCurrency === 'BSF') displayPrice = baseUsd * 7;

                        return (
                          <span className="font-black text-yellow-400 text-lg">
                            {selectedCurrency === 'ARS' ? `$${Math.round(displayPrice * item.quantity).toLocaleString()}` : `$${(displayPrice * item.quantity).toFixed(2)}`}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>

                <div className="mt-10 px-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Total a Pagar ({selectedCurrency})</p>
                  <p className="text-6xl font-black tracking-tighter text-white">
                    {selectedCurrency === 'ARS' ? `$${Math.round(calculateTotal()).toLocaleString()}` : `$${calculateTotal().toFixed(2)}`}
                  </p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="text-left">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Su Identificación *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-8 py-8 bg-white/5 border-2 border-white/10 rounded-[2rem] text-3xl font-black text-white focus:border-yellow-400 transition-all outline-none italic placeholder:text-white/10 uppercase"
                    placeholder="SU NOMBRE"
                  />
                  <p className="text-[10px] text-gray-500 mt-4 ml-4 italic">Ingrese el nombre para su comprobante</p>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleFinalizePurchase}
                    className="w-full bg-yellow-400 hover:bg-white text-black py-10 rounded-[2.5rem] font-black text-2xl uppercase tracking-[0.3em] shadow-3xl transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    CONFIRMAR COMPRA <span>✔</span>
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full bg-transparent hover:bg-white/5 text-white/40 hover:text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all"
                  >
                    ← Modificar Pedido
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-20 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Por favor, retire su ticket y abone en caja al finalizar.</p>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default PresentationView;