import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from './CartContext';
import supabase from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin', 'vendor', or null
  const [loading, setLoading] = useState(true);
  const { setUser } = useCart(); // Usamos el contexto existente

  useEffect(() => {
    // Verificar sesión actual de Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Obtener información del usuario desde la tabla company_users
        const { data: profile, error } = await supabase
          .from('company_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Determinar rol basado en la información del perfil
          const role = profile.email.includes('admin') ? 'admin' : 'vendor';

          setCurrentUser({ ...session.user, ...profile });
          setUserRole(role);
          setUser({ ...session.user, ...profile });
        } else {
          // Si no hay perfil, pero hay sesión, podría ser un admin tradicional
          setCurrentUser(session.user);
          setUserRole('admin'); // Por defecto asumimos admin si tiene sesión pero no perfil
          setUser(session.user);
        }
      }

      setLoading(false);
    };

    checkSession();

    // Escuchar cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Actualizar información del usuario cuando cambia la sesión
        const updateUserInfo = async () => {
          const { data: profile, error } = await supabase
            .from('company_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Determinar rol basado en la información del perfil
            const role = profile.email.includes('admin') ? 'admin' : 'vendor';

            setCurrentUser({ ...session.user, ...profile });
            setUserRole(role);
            setUser({ ...session.user, ...profile });
          } else {
            // Si no hay perfil, podría ser un admin tradicional
            setCurrentUser(session.user);
            setUserRole('admin');
            setUser(session.user);
          }
        };

        updateUserInfo();
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAdmin = async (email, password) => {
    // Lógica para iniciar sesión como admin
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verificar si el usuario tiene un perfil en company_users
      const { data: profile, error: profileError } = await supabase
        .from('company_users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Determinar el rol basado en el email o en el perfil
      let role = 'vendor'; // Por defecto

      // Si el email contiene 'admin' o es el email específico de admin, lo tratamos como admin
      if (email.includes('admin') || email === 'admin@autopedido.com') {
        role = 'admin';
      } else if (profile && profile.role) {
        // Si tiene un rol definido en el perfil, usarlo
        role = profile.role;
      } else if (profile) {
        // Si tiene perfil pero no rol definido, verificar si es vendedor
        role = 'vendor';
      }

      if (profile) {
        // Si tiene perfil, combinar la información
        const userData = { ...data.user, ...profile, role };
        setCurrentUser(userData);
        setUserRole(role);
        setUser(userData);

        return { success: true, user: userData };
      } else {
        // Si no tiene perfil, usar la información básica del usuario de auth
        const userData = { ...data.user, role };
        setCurrentUser(userData);
        setUserRole(role);
        setUser(userData);

        return { success: true, user: userData };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginVendor = async (emailOrCode, password = null) => {
    // Lógica para iniciar sesión como vendedor con email/contraseña o código de acceso
    try {
      let profile;

      // Determinar si se está ingresando un código o un email
      if (emailOrCode.startsWith('CODE') || emailOrCode.startsWith('AUTH')) {
        // Es un código de acceso
        const { data: profileResult, error: profileError } = await supabase
          .from('company_users')
          .select('*')
          .eq('access_code', emailOrCode.toUpperCase())
          .single();

        if (profileError || !profileResult) {
          throw new Error('Código de acceso inválido');
        }

        profile = profileResult;

        // Verificar si la cuenta está activa/aprobada
        if (!profile.is_active) {
          throw new Error('Tu cuenta aún no ha sido aprobada por el administrador');
        }

        // Verificar el estado de suscripción
        if (profile.subscription_status === 'pending_approval') {
          throw new Error('Tu cuenta está pendiente de aprobación');
        }

        if (profile.subscription_status === 'rejected') {
          throw new Error('Tu cuenta ha sido rechazada');
        }
      } else {
        // Es un email, requerimos contraseña
        if (!password) {
          throw new Error('Se requiere contraseña para iniciar sesión con email');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrCode,
          password
        });

        if (error) throw error;

        // Obtener información del perfil del vendedor
        const { data: profileResult, error: profileError } = await supabase
          .from('company_users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profileResult) {
          throw new Error('Perfil de vendedor no encontrado');
        }

        profile = profileResult;

        // Verificar si la cuenta está activa/aprobada
        if (!profile.is_active) {
          throw new Error('Tu cuenta aún no ha sido aprobada por el administrador');
        }

        // Verificar el estado de suscripción
        if (profile.subscription_status === 'pending_approval') {
          throw new Error('Tu cuenta está pendiente de aprobación');
        }

        if (profile.subscription_status === 'rejected') {
          throw new Error('Tu cuenta ha sido rechazada');
        }
      }

      // Si llegamos aquí, la autenticación fue exitosa
      setCurrentUser(profile);
      setUserRole('vendor');
      setUser(profile);

      return { success: true, user: profile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const registerVendor = async (email, password, businessName, ownerName, phone) => {
    // Lógica para registrar un nuevo vendedor
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generar un código de acceso dummy por compatibilidad
        const dummyAccessCode = 'AUTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Crear perfil en company_users vinculado por ID
        const { error: dbError } = await supabase
          .from('company_users')
          .insert([{
            id: authData.user.id,
            email: email,
            business_name: businessName,
            owner_name: ownerName,
            phone: phone,
            access_code: dummyAccessCode,
            is_active: false, // Por defecto INACTIVO hasta que admin apruebe
            subscription_status: 'pending_approval'
          }]);

        if (dbError) {
          throw new Error('Error al crear perfil de negocio: ' + dbError.message);
        }

        // Actualizar el usuario actual con la información del perfil
        const fullUserData = {
          ...authData.user,
          email: email,
          business_name: businessName,
          owner_name: ownerName,
          phone: phone,
          access_code: dummyAccessCode,
          is_active: false,
          subscription_status: 'pending_approval'
        };

        setCurrentUser(fullUserData);
        setUserRole('vendor');
        setUser(fullUserData);

        return { success: true, user: fullUserData };
      } else {
        throw new Error('No se pudo crear el usuario');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setUser(null);
  };

  const value = {
    currentUser,
    userRole,
    loading,
    loginAdmin,
    loginVendor,
    registerVendor,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};