-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA company_users
-- ============================================

-- Eliminar políticas existentes para reemplazarlas con las correctas
DROP POLICY IF EXISTS "Users can view own data" ON company_users;

-- Crear nuevas políticas con los permisos adecuados

-- 1. Política general para que los usuarios puedan ver datos (permite selects)
CREATE POLICY "Users can view company users data" ON company_users
FOR SELECT USING (true);

-- 2. Política para que los usuarios admin puedan insertar (usando service_role)
CREATE POLICY "Service role can create company users" ON company_users
FOR INSERT TO service_role
WITH CHECK (true);

-- 3. Política para que los usuarios admin puedan actualizar
CREATE POLICY "Service role can update company users" ON company_users
FOR UPDATE TO service_role
USING (true)
WITH CHECK (true);

-- 4. Política para que los usuarios admin puedan eliminar
CREATE POLICY "Service role can delete company users" ON company_users
FOR DELETE TO service_role
USING (true);

-- 5. También podemos permitir que los usuarios normales puedan ver sus propios datos
CREATE POLICY "Users can view own company data" ON company_users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 6. Política para usuarios autenticados para actualizar sus propios datos
CREATE POLICY "Users can update own company data" ON company_users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA products_multicurrency
-- ============================================

-- Eliminar la política anterior y crear nuevas
DROP POLICY IF EXISTS "Users can manage own products" ON products_multicurrency;

-- 1. Política para mostrar productos activos a todos
CREATE POLICY "Active products visible to all" ON products_multicurrency
FOR SELECT USING (is_active = true);

-- 2. Política para que compañías puedan insertar productos
CREATE POLICY "Company users can insert their products" ON products_multicurrency
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = company_user_id);

-- 3. Política para que compañías puedan actualizar sus productos
CREATE POLICY "Company users can update their products" ON products_multicurrency
FOR UPDATE TO authenticated
USING (auth.uid() = company_user_id)
WITH CHECK (auth.uid() = company_user_id);

-- 4. Política para que compañías puedan eliminar sus productos
CREATE POLICY "Company users can delete their products" ON products_multicurrency
FOR DELETE TO authenticated
USING (auth.uid() = company_user_id);

-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA currency_rates
-- ============================================

-- Eliminar la política anterior y crear nuevas
DROP POLICY IF EXISTS "Only authenticated users can manage rates" ON currency_rates;

-- 1. Política para que todos puedan ver las tasas de cambio
CREATE POLICY "Rates visible to all" ON currency_rates
FOR SELECT USING (true);

-- 2. Política para que service role pueda gestionar tasas
CREATE POLICY "Service role can manage rates" ON currency_rates
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA product_presentations
-- ============================================

-- Eliminar la política anterior y crear nuevas
DROP POLICY IF EXISTS "Users can manage own presentations" ON product_presentations;

-- 1. Política para mostrar presentaciones activas a todos
CREATE POLICY "Active presentations visible to all" ON product_presentations
FOR SELECT USING (is_active = true);

-- 2. Política para que compañías puedan gestionar sus presentaciones
CREATE POLICY "Company users can manage their presentations" ON product_presentations
FOR ALL TO authenticated
USING (auth.uid() = company_user_id)
WITH CHECK (auth.uid() = company_user_id);

-- ============================================
-- ACTUALIZACIÓN: PERMITIR INSERCIÓN POR PARTE DEL SERVIDOR
-- ============================================

-- Para manejar inserciones desde la aplicación, puedes necesitar esto temporalmente:
-- ALTER TABLE company_users DISABLE ROW LEVEL SECURITY;

-- O crear un trigger o función que permita inserciones específicas

-- Si decides mantener RLS, puedes crear una función que maneje la creación de usuarios
-- CREATE OR REPLACE FUNCTION create_company_user(
--   _email VARCHAR,
--   _business_name VARCHAR,
--   _owner_name VARCHAR,
--   _phone VARCHAR,
--   _access_code VARCHAR
-- ) RETURNS TABLE(
--   id UUID,
--   email VARCHAR,
--   business_name VARCHAR,
--   owner_name VARCHAR,
--   phone VARCHAR,
--   access_code VARCHAR,
--   is_active BOOLEAN,
--   subscription_status VARCHAR,
--   created_at TIMESTAMP
-- ) AS $$
-- BEGIN
--   RETURN QUERY
--   INSERT INTO company_users(email, business_name, owner_name, phone, access_code)
--   VALUES(_email, _business_name, _owner_name, _phone, _access_code)
--   RETURNING *;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;