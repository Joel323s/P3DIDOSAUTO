-- ============================================
-- AGREGAR MODO DE VENTA (UNIDADES/DOCENAS/AMBOS)
-- ============================================

-- 1. Agregar columna sale_mode a products_multicurrency
-- Puede ser: 'unidades', 'docenas', 'ambos'
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS sale_mode TEXT DEFAULT 'unidades';

-- 2. Comentario para documentar
COMMENT ON COLUMN products_multicurrency.sale_mode IS 'Determina cómo se vende el producto: unidades, docenas o ambos';
