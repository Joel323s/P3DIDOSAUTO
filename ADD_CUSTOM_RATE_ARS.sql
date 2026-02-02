-- ============================================
-- SOPORTE PARA MÚLTIPLES TASAS Y VISIBILIDAD DE BOB
-- ============================================

-- 1. Renombrar custom_rate si existe, o crear rate_usd_bob
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='company_users' AND column_name='custom_rate') THEN
        ALTER TABLE company_users RENAME COLUMN custom_rate TO rate_usd_bob;
    ELSE
        ALTER TABLE company_users ADD COLUMN IF NOT EXISTS rate_usd_bob DECIMAL(10, 4) DEFAULT 7.0000;
    END IF;
END $$;

-- 2. Añadir tasa para Peso Argentino
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS rate_usd_ars DECIMAL(10, 4) DEFAULT 1000.0000;

-- 3. Añadir toggle para moneda Boliviana
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS enable_bob BOOLEAN DEFAULT true;

-- Comentarios
COMMENT ON COLUMN company_users.rate_usd_bob IS 'Tasa de cambio USD a BOB personalizada';
COMMENT ON COLUMN company_users.rate_usd_ars IS 'Tasa de cambio USD a ARS personalizada';
COMMENT ON COLUMN company_users.enable_bob IS 'Indica si se muestra la opción de pagar en Bolivianos en la presentación';
