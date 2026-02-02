import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { AdminUserService } from '../lib/adminUserService';

const VendorLoginPage = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'code'
    const [credentials, setCredentials] = useState({ email: '', password: '', accessCode: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { loginVendor } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (loginMethod === 'email') {
                // ESTRATEGIA 1: EMAIL Y PASSWORD
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password,
                });

                if (authError) throw new Error('Credenciales incorrectas');

                if (authData.user) {
                    const { data: profile, error: profileError } = await supabase
                        .from('company_users')
                        .select('*')
                        .eq('id', authData.user.id)
                        .single();

                    if (profileError || !profile) {
                        // Fallback legacy access
                        const { data: profileByEmail } = await supabase.from('company_users').select('*').eq('email', credentials.email).single();
                        if (profileByEmail) {
                            if (!profileByEmail.is_active) throw new Error('Cuenta pendiente de aprobación.');
                            await loginVendor(profileByEmail.access_code, profileByEmail);
                            navigate('/vendor/dashboard');
                            return;
                        }
                        throw new Error('Perfil no encontrado.');
                    }

                    if (!profile.is_active) throw new Error('Tu cuenta aún no ha sido aprobada por el administrador.');
                    await loginVendor(profile.access_code, profile);
                    navigate('/vendor/dashboard');
                }
            } else {
                // ESTRATEGIA 2: CÓDIGO DE ACCESO
                const result = await AdminUserService.validateAccessCode(credentials.accessCode);
                if (result.success) {
                    await loginVendor(credentials.accessCode, result.data);
                    navigate('/vendor/dashboard');
                } else {
                    throw new Error(result.error || 'Código inválido');
                }
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Acceso Vendedores
                </h2>
                <div className="mt-4 flex justify-center space-x-4">
                    <button
                        onClick={() => setLoginMethod('email')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        Correo y Contraseña
                    </button>
                    <button
                        onClick={() => setLoginMethod('code')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        Código de Acceso
                    </button>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {loginMethod === 'email' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={credentials.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={credentials.password}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Código del Vendedor</label>
                                <input
                                    name="accessCode"
                                    type="text"
                                    required
                                    placeholder="Ej: AUTH-XY123"
                                    value={credentials.accessCode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white font-mono text-center tracking-widest uppercase focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="rounded-md bg-red-900/50 p-4 border border-red-800 text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Verificando...' : (loginMethod === 'email' ? 'Ingresar' : 'Validar Código')}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-gray-700 pt-4">
                        <Link to="/vendor/register" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                            ¿No tienes cuenta? Regístrate
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorLoginPage;
