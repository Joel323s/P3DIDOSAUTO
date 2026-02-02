import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminUserService } from '../lib/adminUserService';

const VendorCodeLoginPage = () => {
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { loginVendor } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await AdminUserService.validateAccessCode(accessCode);

            if (result.success) {
                // Verificar si la cuenta requiere email/pass (nuevas) o es legacy.
                // En este flujo simplificado, permitimos el acceso directo si tienen el código correcto y están activos.
                const loginResult = await loginVendor(accessCode, result.data);
                if (loginResult.success) {
                    navigate('/vendor/dashboard');
                } else {
                    setError(loginResult.error || 'Error de autenticación');
                }
            } else {
                setError(result.error || 'El código no existe o la cuenta está inactiva');
            }
        } catch (err) {
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <span className="text-6xl">🔐</span>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Acceso Rápido
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Ingresa solo tu <strong>Código de Vendedor</strong>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-t-4 border-t-yellow-400 border-gray-700">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="accessCode" className="block text-sm font-bold text-yellow-400 uppercase tracking-widest text-center mb-4">
                                Tu Código Personal
                            </label>
                            <div className="mt-1">
                                <input
                                    id="accessCode"
                                    name="accessCode"
                                    type="text"
                                    required
                                    value={accessCode}
                                    onChange={(e) => {
                                        setAccessCode(e.target.value.toUpperCase());
                                        setError('');
                                    }}
                                    placeholder="EJ: CODE-1234"
                                    className="appearance-none block w-full px-3 py-4 border-2 border-gray-600 rounded-xl shadow-sm placeholder-gray-600 bg-black/50 text-white text-center font-mono text-2xl tracking-[0.2em] focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 uppercase"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50">
                                <div className="text-sm text-red-200 text-center font-bold px-2">⛔ {error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-black text-black bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transform transition active:scale-95 uppercase tracking-widest"
                            >
                                {loading ? 'Validando...' : 'ENTRAR AL SISTEMA'}
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-gray-600 text-xs mt-8">Solo personal autorizado</p>
            </div>
        </div>
    );
};

export default VendorCodeLoginPage;
