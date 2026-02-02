-- ============================================
-- ARREGLAR RLS PARA PRODUCTOS (PERMISIVO)
-- ============================================

-- 1. Deshabilitar RLS temporalmente o crear políticas más abiertas
ALTER TABLE products_multicurrency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products visible to all" ON products_multicurrency;
DROP POLICY IF EXISTS "Users can manage own products" ON products_multicurrency;

-- Permitir SELECT a todos (público)
CREATE POLICY "Enable select for all" ON products_multicurrency FOR SELECT USING (true);

-- Permitir ALL (insert, update, delete) para simplificar en desarrollo
CREATE POLICY "Enable all for all" ON products_multicurrency FOR ALL USING (true);


-- 2. Lo mismo para presentaciones (por si acaso)
ALTER TABLE product_presentations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Presentations visible if active" ON product_presentations;
DROP POLICY IF EXISTS "Users can manage own presentations" ON product_presentations;

CREATE POLICY "Enable select for all" ON product_presentations FOR SELECT USING (true);
CREATE POLICY "Enable all for all" ON product_presentations FOR ALL USING (true);
