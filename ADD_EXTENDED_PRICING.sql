-- ============================================
-- AGREGAR PRECIOS POS, OFERTAS Y MONEDA BASE
-- ============================================

-- 1. Agregar columnas para Precios de Tienda (POS)
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_pos_usd DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_pos_bsf DECIMAL(20,2) DEFAULT 0;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_pos_arg DECIMAL(20,2) DEFAULT 0;

-- 2. Agregar columnas para Precios de Tienda (POS) por Docena
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_pos_usd DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_pos_bsf DECIMAL(20,2) DEFAULT 0;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS price_dozen_pos_arg DECIMAL(20,2) DEFAULT 0;

-- 3. Toggles de Oferta
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS is_offer_unit BOOLEAN DEFAULT FALSE;
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS is_offer_dozen BOOLEAN DEFAULT FALSE;

-- 4. Moneda Primaria (Base)
ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS primary_currency VARCHAR(10) DEFAULT 'USD';

-- 5. Comentarios
COMMENT ON COLUMN products_multicurrency.price_pos_usd IS 'Precio en tienda física (POS) - Unidad';
COMMENT ON COLUMN products_multicurrency.price_dozen_pos_usd IS 'Precio en tienda física (POS) - Docena';
COMMENT ON COLUMN products_multicurrency.is_offer_unit IS 'Indica si la unidad está en oferta';
COMMENT ON COLUMN products_multicurrency.is_offer_dozen IS 'Indica si la docena está en oferta';
COMMENT ON COLUMN products_multicurrency.primary_currency IS 'Moneda utilizada para ingresar los precios (USD o BOB)';
