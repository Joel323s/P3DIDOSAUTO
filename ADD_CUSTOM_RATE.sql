-- ============================================
-- SOPORTE PARA TASA DE CAMBIO PERSONALIZADA
-- ============================================

ALTER TABLE company_users ADD COLUMN IF NOT EXISTS custom_rate DECIMAL(10, 4) DEFAULT 7.0000;

-- Comentario
COMMENT ON COLUMN company_users.custom_rate IS 'Tasa de cambio personalizada (USD a BOB/BSF) definida por el vendedor';
