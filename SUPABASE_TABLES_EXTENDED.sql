-- ============================================
-- NUEVAS TABLAS PARA SISTEMA ADMIN/VENDEDOR
-- ============================================

-- 1. TABLA DE USUARIOS EMPRESA (VENDEDORES)
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  access_code VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE PRODUCTOS CON PRECIOS MULTIMONEDA
CREATE TABLE products_multicurrency (
  id BIGSERIAL PRIMARY KEY,
  company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_usd DECIMAL(10, 2),           -- Precio en dólares
  price_bsf DECIMAL(10, 2),           -- Precio en bolivianos
  price_arg DECIMAL(10, 2),           -- Precio en pesos argentinos
  image_url TEXT,
  video_url TEXT,                     -- Video promocional opcional
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE COTIZACIONES MONETARIAS
CREATE TABLE currency_rates (
  id BIGSERIAL PRIMARY KEY,
  usd_to_arg_rate DECIMAL(10, 4) NOT NULL,  -- Tasa de conversión Dólar a Peso Argentino
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. TABLA DE SESIONES DE VENDEDOR (PARA GESTIÓN DE ACCESO)
CREATE TABLE vendor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP,
  session_token VARCHAR(255),
  ip_address INET
);

-- 5. TABLA DE CARUSEL/PRESENTACIÓN DE PRODUCTOS
CREATE TABLE product_presentations (
  id BIGSERIAL PRIMARY KEY,
  company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slide_order INT NOT NULL,
  product_id BIGINT REFERENCES products_multicurrency(id),
  image_url TEXT,
  video_url TEXT,
  button_text VARCHAR(100) DEFAULT 'Comprar ahora',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE VENTAS/COMPRAS FINALES
CREATE TABLE final_sales (
  id BIGSERIAL PRIMARY KEY,
  presentation_id BIGINT NOT NULL REFERENCES product_presentations(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency_used VARCHAR(10) NOT NULL, -- USD, BSF, ARS
  exchange_rate_used DECIMAL(10, 4),   -- Si se usó conversión
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
  printed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREAR ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================
CREATE INDEX idx_company_users_code ON company_users(access_code);
CREATE INDEX idx_company_users_active ON company_users(is_active, subscription_status);
CREATE INDEX idx_products_company ON products_multicurrency(company_user_id, is_active);
CREATE INDEX idx_presentations_company ON product_presentations(company_user_id, is_active);

-- ============================================
-- INSERTAR DATOS DE EJEMPLO
-- ============================================

-- Insertar tasa de cambio inicial (ejemplo)
INSERT INTO currency_rates (usd_to_arg_rate) VALUES (1000.0000);

-- Insertar un usuario empresa de ejemplo
INSERT INTO company_users (email, business_name, owner_name, phone, access_code, is_active, subscription_status) 
VALUES ('vendedor@test.com', 'Negocio Test SA', 'Juan Pérez', '78945612', 'TEST123', true, 'active');

-- Insertar productos de ejemplo para el vendedor
INSERT INTO products_multicurrency (company_user_id, name, description, price_usd, price_bsf, price_arg, image_url) 
VALUES 
(gen_random_uuid(), 'Producto Test 1', 'Descripción producto de prueba 1', 10.00, 70.00, 10000.00, 'https://via.placeholder.com/300x200?text=Producto+1'),
(gen_random_uuid(), 'Producto Test 2', 'Descripción producto de prueba 2', 20.00, 140.00, 20000.00, 'https://via.placeholder.com/300x200?text=Producto+2');

-- ============================================
-- CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================

-- RLS para company_users: Solo lectura para el propio usuario
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON company_users
FOR SELECT USING (true); -- Para simplificar, pueden ver cualquier usuario (se podría restringir más adelante)

-- RLS para products_multicurrency: Usuarios pueden ver productos de cualquier compañía activa
ALTER TABLE products_multicurrency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products visible to all" ON products_multicurrency
FOR SELECT USING (is_active = true);

-- Solo el dueño puede editar sus productos
CREATE POLICY "Users can manage own products" ON products_multicurrency
FOR ALL USING (company_user_id = auth.uid());

-- RLS para currency_rates: Todos pueden ver tasas actuales
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rates visible to all" ON currency_rates
FOR SELECT USING (true);

-- Solo admin puede insertar/modificar tasas
CREATE POLICY "Only authenticated users can manage rates" ON currency_rates
FOR ALL USING (auth.role() = 'authenticated');

-- RLS para presentations: Visibles si están activas
ALTER TABLE product_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presentations visible if active" ON product_presentations
FOR SELECT USING (is_active = true);

-- Solo dueño puede gestionar sus presentaciones
CREATE POLICY "Users can manage own presentations" ON product_presentations
FOR ALL USING (company_user_id = auth.uid());