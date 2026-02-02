import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VendorRegisterPage = () => {
    const { registerVendor } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        businessName: '',
        ownerName: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Usar la función de registro del contexto
            const result = await registerVendor(
                formData.email,
                formData.password,
                formData.businessName,
                formData.ownerName,
                formData.phone
            );

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: '¡Registro exitoso! Tu cuenta está pendiente de aprobación por el administrador.'
                });

                // Limpiar formulario
                setFormData({ email: '', password: '', businessName: '', ownerName: '', phone: '' });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Solicitud de Vendedor
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Crea tu cuenta y espera la aprobación del administrador
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-700">
                    {message.text && (
                        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-800' : 'bg-red-900/50 text-red-200 border border-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    {!message.text?.includes('exitoso') ? (
                        <form className="space-y-6" onSubmit={handleRegister}>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Nombre del Negocio</label>
                                <input
                                    name="businessName"
                                    type="text"
                                    required
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300">Nombre del Dueño</label>
                                <input
                                    name="ownerName"
                                    type="text"
                                    required
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300">Teléfono</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mt-1"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Procesando...' : 'Registrar Cuenta'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-6 text-center">
                            <Link to="/vendor/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                Ir al Login
                            </Link>
                        </div>
                    )}

                    <div className="mt-6 text-center border-t border-gray-700 pt-4">
                        <Link to="/vendor/login" className="text-sm text-gray-400 hover:text-white">
                            ¿Ya tienes cuenta? Inicia sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorRegisterPage;
