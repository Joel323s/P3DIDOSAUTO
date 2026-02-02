import React from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export const ShoppingCart = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { formatCurrency } = useCurrency();

  // Calcular el total del carrito
  const getTotal = () => {
    if (cart.length === 0) return { amount: 0, currency: 'USD' };
    
    // Tomar la moneda del primer elemento como referencia
    const referenceCurrency = cart[0].currency || 'USD';
    
    // Sumar cantidades en la moneda de referencia
    const totalAmount = cart.reduce((total, item) => {
      if (item.currency === referenceCurrency) {
        return total + (item.price * item.quantity);
      } else {
        // Si hay diferentes monedas, habría que convertirlas
        // Por simplicidad, asumimos todos los items tienen la misma moneda
        return total + (item.price * item.quantity);
      }
    }, 0);
    
    return { amount: totalAmount, currency: referenceCurrency };
  };

  const { amount: total, currency: totalCurrency } = getTotal();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Carrito de Compras</h3>
      
      {cart.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Tu carrito está vacío</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.price, item.currency)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total, totalCurrency)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};