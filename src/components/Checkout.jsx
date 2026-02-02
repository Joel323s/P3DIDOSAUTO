import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export const Checkout = () => {
  const { cart, user, clearCart } = useCart();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Calcular el total del carrito
  const getTotal = () => {
    if (cart.length === 0) return { amount: 0, currency: 'USD' };
    
    const referenceCurrency = cart[0].currency || 'USD';
    const totalAmount = cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    return { amount: totalAmount, currency: referenceCurrency };
  };

  const { amount: total, currency: totalCurrency } = getTotal();

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular envío de pedido
    setTimeout(() => {
      console.log('Pedido enviado:', {
        userId: user.id,
        items: cart,
        total: { amount: total, currency: totalCurrency },
        address,
        phone,
        notes
      });

      clearCart();
      setOrderPlaced(true);
      setLoading(false);
    }, 1500);
  };

  if (orderPlaced) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-green-600 mb-4">¡Pedido Realizado!</h3>
        <p className="text-gray-700 mb-4">Gracias por tu compra, {user?.email || 'Cliente'}.</p>
        <p className="text-gray-700">Tu pedido ha sido registrado correctamente.</p>
        <button
          onClick={() => setOrderPlaced(false)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Hacer Otro Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Finalizar Pedido</h3>
      
      <form onSubmit={handleCheckout}>
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número de contacto"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección de Entrega *
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Indica la dirección de entrega"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instrucciones especiales..."
            ></textarea>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total, totalCurrency)}</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !phone || !address}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            {loading ? 'Procesando...' : 'Realizar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};