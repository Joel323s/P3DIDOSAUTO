import React, { useState } from 'react'
import supabase from '../lib/supabase'
import { LogOut } from 'lucide-react'
import { useCart } from '../context/CartContext'

export function Header() {
  const { user, setUser, cart } = useCart()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🛒 Auto Pedido</h1>
          <p className="text-blue-100">Sistema de Pedidos Online</p>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right">
                <p className="text-sm text-blue-100">Bienvenido</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </>
          )}
          {cart.length > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
              {cart.length}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
