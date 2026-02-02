-- ============================================
-- FIX FINAL_SALES TABLE STRUCTURE
-- ============================================

-- 1. Modificar presentation_id para que sea opcional
ALTER TABLE final_sales ALTER COLUMN presentation_id DROP NOT NULL;

-- 2. Agregar columna item_description si no existe
ALTER TABLE final_sales ADD COLUMN IF NOT EXISTS item_description TEXT;

-- 3. Agregar columna company_user_id para vincular al vendedor
ALTER TABLE final_sales ADD COLUMN IF NOT EXISTS company_user_id UUID REFERENCES company_users(id);

-- 4. Deshabilitar RLS para permitir que los clientes envíen pedidos sin trabas
ALTER TABLE final_sales DISABLE ROW LEVEL SECURITY;

-- 5. Comentario de verificación
COMMENT ON TABLE final_sales IS 'Tabla de pedidos corregida para el flujo simplificado';
