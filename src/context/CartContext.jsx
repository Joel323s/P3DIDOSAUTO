import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar usuario actual
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Cargar carrito del localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, isDozen = false) => {
    // Aseguramos que el producto tenga las propiedades necesarias
    const productWithDefaults = {
      ...product,
      currency: product.currency || 'USD',
      stockUnits: product.stockUnits ?? 999
    }

    const unitsToBuy = isDozen ? 12 : 1;
    const itemKey = `${productWithDefaults.id}-${productWithDefaults.currency}-${isDozen ? 'dozen' : 'unit'}`;

    setCart(prevCart => {
      const existingItem = prevCart.find(item =>
        `${item.id}-${item.currency}-${item.isDozen ? 'dozen' : 'unit'}` === itemKey
      )

      if (existingItem) {
        // Verificar si hay stock suficiente para incrementar
        const totalUnitsInCartForThisProduct = prevCart
          .filter(item => item.id === productWithDefaults.id)
          .reduce((sum, item) => sum + (item.quantity * (item.isDozen ? 12 : 1)), 0);

        if (totalUnitsInCartForThisProduct + unitsToBuy > productWithDefaults.stockUnits) {
          alert('No hay más stock disponible para este producto');
          return prevCart;
        }

        return prevCart.map(item =>
          `${item.id}-${item.currency}-${item.isDozen ? 'dozen' : 'unit'}` === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      // Si es un nuevo item, verificar si hay stock
      if (productWithDefaults.stockUnits < unitsToBuy) {
        alert('Stock insuficiente');
        return prevCart;
      }

      return [...prevCart, { ...productWithDefaults, quantity: 1, isDozen }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity, stockUnits, isDozen = false) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item =>
        !(item.id === productId && item.isDozen === isDozen)
      ))
    } else {
      const unitsToBuy = isDozen ? (quantity * 12) : quantity;

      setCart(prevCart => {
        // Calcular cuantas unidades están consumiendo los OTROS items de este mismo producto
        const unitsUsedByOtherItems = prevCart
          .filter(item => item.id === productId && item.isDozen !== isDozen)
          .reduce((sum, item) => sum + (item.quantity * (item.isDozen ? 12 : 1)), 0);

        if (stockUnits !== undefined && (unitsToBuy + unitsUsedByOtherItems) > stockUnits) {
          alert('Stock insuficiente');
          return prevCart;
        }

        return prevCart.map(item =>
          (item.id === productId && item.isDozen === isDozen)
            ? { ...item, quantity }
            : item
        )
      })
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    if (cart.length === 0) return { amount: 0, currency: 'USD' };

    // Tomar la moneda del primer elemento como referencia
    const referenceCurrency = cart[0].currency || 'USD';

    // Sumar cantidades en la moneda de referencia
    const totalAmount = cart.reduce((total, item) => {
      if (item.currency === referenceCurrency) {
        return total + (item.price * item.quantity);
      } else {
        // En una implementación completa, aquí se harían conversiones
        // Por simplicidad, asumimos todos los items tienen la misma moneda
        return total + (item.price * item.quantity);
      }
    }, 0);

    return { amount: totalAmount, currency: referenceCurrency };
  }

  return (
    <CartContext.Provider value={{
      cart,
      user,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      setUser
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
