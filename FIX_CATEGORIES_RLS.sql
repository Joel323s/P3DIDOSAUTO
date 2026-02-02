-- ============================================
-- ARREGLAR CATEGORÍAS Y PERMISOS (VERSIÓN FIX)
-- ============================================

-- 1. Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS vendor_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES company_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, name)
);

-- 2. Habilitar RLS
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Categories are public" ON vendor_categories;
DROP POLICY IF EXISTS "Vendors can manage own categories" ON vendor_categories;
DROP POLICY IF EXISTS "Enable select for all" ON vendor_categories;
DROP POLICY IF EXISTS "Enable all for all" ON vendor_categories;

-- 4. Crear políticas permisivas (compatibles con login por código de acceso)
-- Nota: Como no usamos el Auth estándar de Supabase para vendedores, 
-- auth.uid() es nulo. Por eso usamos políticas abiertas de desarrollo.

CREATE POLICY "Enable select for all" ON vendor_categories FOR SELECT USING (true);
CREATE POLICY "Enable all for all" ON vendor_categories FOR ALL USING (true);

-- 5. Asegurar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_categories;

-- 6. Agregar columna category a productos si no existe
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS stock_units INT DEFAULT 0;
