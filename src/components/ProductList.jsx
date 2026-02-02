import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export const ProductList = () => {
  const { addToCart } = useCart();
  const { convertPrice, formatCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState('USD'); // Moneda por defecto
  
  // Datos de ejemplo de productos (esto normalmente vendría de una API o base de datos)
  const [products] = useState([
    {
      id: 1,
      name: 'Pizza Margherita',
      description: 'Pizza clásica con tomate, mozzarella y albahaca',
      price: 12.99, // Precio en dólares
      image: 'https://via.placeholder.com/300x200?text=Pizza+Margherita',
      priceBsf: 90.93, // Precio en bolivianos (12.99 * 7)
      priceArg: 12990 // Precio en pesos argentinos (12.99 * 1000)
    },
    {
      id: 2,
      name: 'Hamburguesa Premium',
      description: 'Hamburguesa con carne de res, queso y vegetales frescos',
      price: 14.99,
      image: 'https://via.placeholder.com/300x200?text=Hamburguesa',
      priceBsf: 104.93, // 14.99 * 7
      priceArg: 14990  // 14.99 * 1000
    },
    {
      id: 3,
      name: 'Ensalada César',
      description: 'Ensalada fresca con pollo, crutones y aderezo César',
      price: 10.99,
      image: 'https://via.placeholder.com/300x200?text=Ensalada',
      priceBsf: 76.93, // 10.99 * 7
      priceArg: 10990  // 10.99 * 1000
    },
    {
      id: 4,
      name: 'Pasta Carbonara',
      description: 'Pasta con salsa de huevo, queso y panceta',
      price: 13.99,
      image: 'https://via.placeholder.com/300x200?text=Pasta',
      priceBsf: 97.93, // 13.99 * 7
      priceArg: 13990  // 13.99 * 1000
    },
    {
      id: 5,
      name: 'Refresco',
      description: 'Bebida refrescante',
      price: 2.99,
      image: 'https://via.placeholder.com/300x200?text=Refresco',
      priceBsf: 20.93, // 2.99 * 7
      priceArg: 2990   // 2.99 * 1000
    },
    {
      id: 6,
      name: 'Postre Chocolate',
      description: 'Delicioso brownie de chocolate',
      price: 5.99,
      image: 'https://via.placeholder.com/300x200?text=Postre',
      priceBsf: 41.93, // 5.99 * 7
      priceArg: 5990   // 5.99 * 1000
    }
  ]);

  // Filtrar productos según la moneda seleccionada
  const displayedProducts = products.map(product => {
    let priceInSelectedCurrency = product.price;
    if (selectedCurrency === 'BSF') {
      priceInSelectedCurrency = product.priceBsf;
    } else if (selectedCurrency === 'ARS') {
      priceInSelectedCurrency = product.priceArg;
    }
    
    return {
      ...product,
      displayedPrice: priceInSelectedCurrency
    };
  });

  return (
    <div>
      {/* Selector de moneda */}
      <div className="mb-6">
        <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 mb-2">
          Mostrar precios en:
        </label>
        <select
          id="currency-select"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">Dólares (USD)</option>
          <option value="BSF">Bolivianos (BSF)</option>
          <option value="ARS">Pesos Argentinos (ARS)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              {/* Mostrar precios en diferentes monedas */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(product.displayedPrice, selectedCurrency)}
                </span>
                
                {/* Mostrar precios en otras monedas como información adicional */}
                <div className="text-xs text-gray-500">
                  <div>USD: {formatCurrency(product.price, 'USD')}</div>
                  <div>BSF: {formatCurrency(product.priceBsf, 'BSF')}</div>
                  <div>ARS: {formatCurrency(product.priceArg, 'ARS')}</div>
                </div>
              </div>
              
              <button
                onClick={() => addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.displayedPrice,
                  currency: selectedCurrency
                })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};