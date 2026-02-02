-- ============================================
-- AGREGAR CAMPOS DE PRESENTACIÓN A VENDEDORES (VERSIÓN CORREGIDA)
-- ============================================

ALTER TABLE company_users 
ADD COLUMN IF NOT EXISTS presentation_media_url TEXT,
ADD COLUMN IF NOT EXISTS presentation_video_url TEXT,
ADD COLUMN IF NOT EXISTS presentation_button_text TEXT DEFAULT 'Comprar ahora';
