-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- Ejecuta este código en el SQL Editor de Supabase
-- ============================================

-- 1. Crear el bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Seguridad para el bucket 'product-images'

-- Permitir que cualquiera vea las imágenes (Público)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product-images' );

-- Permitir que usuarios autenticados suban imágenes
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'product-images' );

-- Permitir que los usuarios borren sus propias imágenes (Opcional, para desarrollo permitimos todo)
CREATE POLICY "Full Access for All" 
ON storage.objects FOR ALL 
USING ( bucket_id = 'product-images' );
