import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';
import { AdminUserService } from '../lib/adminUserService';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [initError, setInitError] = useState(null);

  // Estados para el formulario de nuevo usuario
  const [newUser, setNewUser] = useState({
    email: '',
    businessName: '',
    ownerName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar que Supabase esté disponible al montar el componente
  useEffect(() => {
    if (!supabase) {
      setInitError('El servicio de base de datos no está disponible. Verifique la configuración.');
      setLoading(false);
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_users')
        .select('*, id, email, business_name, owner_name, phone, access_code, subscription_status, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la información: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Alternar entre activo/aprobado e inactivo/pending_approval/rejected
    let newStatus, newIsActive;
    if (user.subscription_status === 'active' && user.is_active) {
      // Desactivar completamente
      newStatus = 'inactive';
      newIsActive = false;
    } else if (user.subscription_status === 'pending_approval' || user.subscription_status === 'rejected' || !user.is_active) {
      // Aprobar y activar
      newStatus = 'active';
      newIsActive = true;
    } else {
      // Cambiar a inactivo pero mantener aprobado
      newStatus = 'inactive';
      newIsActive = false;
    }

    try {
      // Usar el servicio de admin para actualizar con privilegios elevados
      const result = await AdminUserService.updateUserSubscription(userId, newStatus, newIsActive);

      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId
            ? { ...u, subscription_status: newStatus, is_active: newIsActive }
            : u
        ));
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Usar el servicio de admin para crear con privilegios elevados
      const result = await AdminUserService.createUser({
        email: newUser.email,
        businessName: newUser.businessName,
        ownerName: newUser.ownerName,
        phone: newUser.phone
      });

      if (result.success) {
        // Recargar la lista de usuarios
        await loadUsers();

        // Limpiar formulario
        setNewUser({
          email: '',
          businessName: '',
          ownerName: '',
          phone: ''
        });

        setSuccess(result.message);
        setTimeout(() => {
          setShowAddUserModal(false);
          setSuccess('');
        }, 3000);
      } else {
        // Mostrar el error detallado si existe
        throw new Error(result.error || result.message || 'Error al crear el usuario');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error detallado al crear usuario:', err);
    }
  };

  const generateAccessCode = () => {
    // Generar un código alfanumérico único de 8 caracteres
    return 'CODE' + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return user.subscription_status === 'active' && user.is_active;
    if (activeTab === 'pending_approval') return user.subscription_status === 'pending_approval' || !user.is_active;
    if (activeTab === 'inactive') return user.subscription_status === 'inactive';
    return user.subscription_status === activeTab;
  });

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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold">Panel de Administrador</div>
            </div>
            <div className="flex items-center space-x-4">
              <span>Bienvenido, {currentUser?.email || currentUser?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Controles para generar usuarios */}
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800">Usuarios Aprobados</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter(u => u.subscription_status === 'active' && u.is_active).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800">Pendientes</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {users.filter(u => u.subscription_status === 'pending_approval' || !u.is_active).length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">Total Usuarios</h3>
                <p className="text-3xl font-bold text-green-600">
                  {users.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg flex items-center justify-center">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  + Agregar Usuario
                </button>
              </div>
            </div>
          </div>

          {/* Tabs para filtrar usuarios */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {[
                  { id: 'all', name: 'Todos' },
                  { id: 'active', name: 'Aprobados' },
                  { id: 'pending_approval', name: 'Pendientes' },
                  { id: 'inactive', name: 'Inactivos' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tabla de usuarios optimizada para tablets */}
          <div className="bg-white shadow overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Negocio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dueño
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.business_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.owner_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.access_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.subscription_status === 'active' && user.is_active
                            ? 'bg-green-100 text-green-800'
                            : user.subscription_status === 'pending_approval' || !user.is_active
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.subscription_status === 'active' && user.is_active
                            ? 'Aprobado'
                            : user.subscription_status === 'pending_approval' || !user.is_active
                            ? 'Pendiente'
                            : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(user.subscription_status === 'pending_approval' || !user.is_active) ? (
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                          >
                            Aprobar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`${
                              user.subscription_status === 'active' && user.is_active
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-yellow-600 hover:bg-yellow-700'
                            } text-white px-3 py-1.5 rounded text-xs font-medium`}
                          >
                            {user.subscription_status === 'active' && user.is_active ? 'Desactivar' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar nuevo usuario */}
      {showAddUserModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Agregar Nuevo Usuario
                    </h3>
                    <div className="mt-4">
                      {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                          {success}
                        </div>
                      )}

                      <form onSubmit={handleCreateUser}>
                        <div className="grid grid-cols-1 gap-y-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Correo Electrónico *
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>

                          <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                              Nombre del Negocio *
                            </label>
                            <input
                              type="text"
                              id="businessName"
                              value={newUser.businessName}
                              onChange={(e) => setNewUser({ ...newUser, businessName: e.target.value })}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>

                          <div>
                            <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                              Nombre del Dueño *
                            </label>
                            <input
                              type="text"
                              id="ownerName"
                              value={newUser.ownerName}
                              onChange={(e) => setNewUser({ ...newUser, ownerName: e.target.value })}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Número de Celular *
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              value={newUser.phone}
                              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                          </div>
                        </div>

                        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Información importante:</strong> Al crear este usuario, se generará automáticamente un código de acceso único que deberá proporcionarse al vendedor para que pueda iniciar sesión.
                          </p>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 sm:col-start-2 disabled:opacity-50"
                          >
                            {loading ? 'Creando...' : 'Crear Usuario'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:col-start-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;