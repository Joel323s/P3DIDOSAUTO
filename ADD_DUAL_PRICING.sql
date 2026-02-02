-- ============================================
-- AGREGAR PRECIOS POR DOCENA
-- ============================================

-- 1. Agregar columnas de precio por docena a products_multicurrency
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_usd DECIMAL(10,2);
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_bsf DECIMAL(20,2);
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_arg DECIMAL(20,2);

-- 2. Comentarios para documentar
COMMENT ON COLUMN products_multicurrency.price_dozen_usd IS 'Precio especial por docena en USD';
COMMENT ON COLUMN products_multicurrency.price_dozen_bsf IS 'Precio especial por docena en BSF';
COMMENT ON COLUMN products_multicurrency.price_dozen_arg IS 'Precio especial por docena en ARS';
