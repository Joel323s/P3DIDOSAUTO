import supabase from './supabase';

/**
 * Servicio para manejar operaciones de administrador que requieren privilegios elevados
 */
export const AdminUserService = {
  /**
   * Crear un nuevo usuario empresa (vendedor) con código de acceso
   */
  async createUser({
    email,
    businessName,
    ownerName,
    phone,
    subscriptionStatus = 'active'
  }) {
    try {
      // Verificar si supabase está disponible
      if (!supabase) {
        throw new Error('Servicio de base de datos no disponible');
      }

      // Generar código de acceso único
      const accessCode = this.generateAccessCode();

      // Crear el usuario empresa en la base de datos
      const result = await supabase
        .from('company_users')
        .insert([{
          email,
          business_name: businessName,
          owner_name: ownerName,
          phone,
          access_code: accessCode,
          subscription_status: subscriptionStatus
        }])
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      // Retornar el código de acceso para que se lo demos al vendedor
      return {
        success: true,
        data: {
          ...result.data,
          accessCode: accessCode // Asegurar que devolvemos el código generado
        },
        message: `Usuario creado exitosamente. Código de acceso: ${accessCode}`
      };
    } catch (error) {
      console.error('Error en AdminUserService.createUser:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
        message: 'No se pudo crear el usuario'
      };
    }
  },

  /**
   * Actualizar estado de suscripción de un usuario
   */
  async updateUserSubscription(userId, status, isActive = null) {
    try {
      if (!supabase) {
        throw new Error('Servicio de base de datos no disponible');
      }

      // Preparar los campos a actualizar
      const updateFields = { subscription_status: status };
      if (isActive !== null) {
        updateFields.is_active = isActive;
      }

      const result = await supabase
        .from('company_users')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message || 'Error al actualizar usuario' };
    }
  },

  /**
   * Generar código de acceso único
   */
  generateAccessCode() {
    // Generar un código alfanumérico único de 8 caracteres
    return 'CODE' + Math.random().toString(36).substring(2, 10).toUpperCase();
  },

  /**
   * Obtener todos los usuarios empresa
   */
  async getAllUsers() {
    try {
      if (!supabase) {
        throw new Error('Servicio de base de datos no disponible');
      }

      const result = await supabase
        .from('company_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message || 'Error al obtener usuarios' };
    }
  },

  /**
   * Validar código de acceso
   */
  async validateAccessCode(code) {
    try {
      if (!supabase) {
        throw new Error('Servicio de base de datos no disponible');
      }

      const result = await supabase
        .from('company_users')
        .select('*')
        .eq('access_code', code)
        .eq('is_active', true)
        .single();

      if (result.error) {
        return { success: false, error: 'Código de acceso inválido o inactivo' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message || 'Error al validar código' };
    }
  }
};