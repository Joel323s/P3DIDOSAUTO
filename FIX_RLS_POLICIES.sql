-- ============================================
-- SQL PARA ARREGLAR POLÍTICAS RLS (VERSIÓN PERMISIVA)
-- Ejecuta este código en el SQL Editor de Supabase
-- ============================================

-- IMPORTANTE: Estas políticas permiten que CUALQUIERA inserte datos para pruebas.
-- Una vez que confirmemos que funciona, podemos volver a restringirlo.

-- 1. Eliminar políticas anteriores para esta tabla
DROP POLICY IF EXISTS "Admins can insert company users" ON company_users;
DROP POLICY IF EXISTS "Admins can update company users" ON company_users;
DROP POLICY IF EXISTS "Admins can view all company users" ON company_users;
DROP POLICY IF EXISTS "Users can view own data" ON company_users;

-- 2. Crear nueva política de INSERCIÓN (Para todos, para asegurar que no falle)
CREATE POLICY "Enable insert for all" ON company_users
FOR INSERT WITH CHECK (true);

-- 3. Crear nueva política de ACTUALIZACIÓN (Para todos)
CREATE POLICY "Enable update for all" ON company_users
FOR UPDATE USING (true);

-- 4. Crear nueva política de LECTURA (Para todos)
CREATE POLICY "Enable select for all" ON company_users
FOR SELECT USING (true);

-- ============================================
-- EJECUTA ESTO TAMBIÉN SI SIGUE DANDO ERROR
-- ============================================
-- ALTER TABLE company_users DISABLE ROW LEVEL SECURITY;
