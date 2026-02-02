-- ============================================
-- AGREGAR SOPORTE PARA MÚLTIPLES IMÁGENES
-- ============================================

ALTER TABLE products_multicurrency ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Comentario
COMMENT ON COLUMN products_multicurrency.images IS 'Lista de URLs de imágenes para el carrusel del producto';
