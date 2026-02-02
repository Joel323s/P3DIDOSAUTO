-- CORRECCIÓN RÁPIDA PARA PERMITIR INSERCIONES EN company_users

-- 1. Deshabilitar temporalmente RLS para hacer cambios
ALTER TABLE company_users DISABLE ROW LEVEL SECURITY;

-- 2. Asegurarse de que existen los roles necesarios
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Habilitar RLS nuevamente con políticas adecuadas
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- 4. Crear una política que permita al role service_role hacer todas las operaciones
CREATE POLICY "Service role full access" ON company_users
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 5. Crear una política para usuarios autenticados (si es necesario)
CREATE POLICY "Authenticated users access" ON company_users
FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Crear una política para permitir selects a todos
CREATE POLICY "Public read access" ON company_users
FOR SELECT TO anon, authenticated
USING (true);

-- 7. Opcional: Si quieres que solo service_role pueda insertar y el resto solo leer:
DROP POLICY IF EXISTS "Allow service role insert only" ON company_users;
CREATE POLICY "Allow service role insert only" ON company_users
FOR INSERT TO service_role
WITH CHECK (true);

-- 8. Para permitir updates solo a service_role o al usuario dueño del registro
DROP POLICY IF EXISTS "Allow service role update" ON company_users;
CREATE POLICY "Allow service role update" ON company_users
FOR UPDATE TO service_role
USING (true)
WITH CHECK (true);

-- 9. Para selects públicos
DROP POLICY IF EXISTS "Allow anyone select" ON company_users;
CREATE POLICY "Allow anyone select" ON company_users
FOR SELECT
USING (true);

-- 10. Si necesitas restablecer completamente (ejecutar si las políticas están muy mal configuradas):
/*
DO $$
BEGIN
  -- Eliminar todas las políticas
  DROP POLICY IF EXISTS "Users can view own data" ON company_users;
  DROP POLICY IF EXISTS "Users can manage own products" ON products_multicurrency;
  DROP POLICY IF EXISTS "Rates visible to all" ON currency_rates;
  DROP POLICY IF EXISTS "Users can manage own presentations" ON product_presentations;
  DROP POLICY IF EXISTS "Active products visible to all" ON products_multicurrency;
  DROP POLICY IF EXISTS "Active presentations visible if active" ON product_presentations;
  DROP POLICY IF EXISTS "Only authenticated users can manage rates" ON currency_rates;
END $$;
*/