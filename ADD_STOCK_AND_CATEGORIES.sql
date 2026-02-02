-- ============================================
-- STOCK Y CATEGORÍAS PERSONALIZADAS
-- ============================================

-- 1. Agregar columnas a products_multicurrency
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS stock_units INT DEFAULT 0;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Crear tabla de categorías por vendedor
CREATE TABLE IF NOT EXISTS vendor_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES company_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, name)
);

-- 3. Habilitar RLS para categorías
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public" 
ON vendor_categories FOR SELECT USING (true);

CREATE POLICY "Vendors can manage own categories" 
ON vendor_categories FOR ALL USING (auth.uid() = vendor_id);

-- 4. Habilitar Realtime para ambas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE products_multicurrency;
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_categories;
