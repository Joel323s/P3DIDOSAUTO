# Auto Pedido - Sistema de Pedidos Online

Una aplicación web moderna para que los clientes realicen pedidos de forma automática.

## Características

✅ Autenticación de usuarios con Supabase
✅ Catálogo de productos dinámico
✅ Carrito de compras con persistencia local
✅ Sistema de pedidos con dirección de entrega
✅ Panel de administración de pedidos
✅ Interfaz moderna con Tailwind CSS

## Tecnologías

- **Frontend**: React 18 + Vite
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React

## Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se inicialice

### 3. Crear las tablas en Supabase

En el Editor SQL de Supabase, ejecuta el siguiente código:

```sql
-- Tabla de Productos
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Detalles de Pedidos
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_name ON products(name);
```

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**Obtén estas credenciales de:**
- Supabase Dashboard → Project Settings → API

### 5. Insertar productos de ejemplo

En el Editor SQL de Supabase, ejecuta:

```sql
INSERT INTO products (name, description, price, image_url) VALUES
('Pizza Margherita', 'Pizza clásica con tomate, mozzarella y albahaca', 12.99, 'https://via.placeholder.com/300x200?text=Pizza+Margherita'),
('Hamburguesa Premium', 'Hamburguesa con carne de res, queso y vegetales frescos', 14.99, 'https://via.placeholder.com/300x200?text=Hamburguesa'),
('Ensalada César', 'Ensalada fresca con pollo, crutones y aderezo César', 10.99, 'https://via.placeholder.com/300x200?text=Ensalada'),
('Pasta Carbonara', 'Pasta con salsa de huevo, queso y panceta', 13.99, 'https://via.placeholder.com/300x200?text=Pasta'),
('Refresco', 'Bebida refrescante', 2.99, 'https://via.placeholder.com/300x200?text=Refresco'),
('Postre Chocolate', 'Delicioso brownie de chocolate', 5.99, 'https://via.placeholder.com/300x200?text=Postre');
```

## Ejecutar el proyecto

```bash
npm run dev
```

La aplicación se abrirá en [http://localhost:5173](http://localhost:5173)

## Estructura del Proyecto

```
AUTO-PEDIDO/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── LoginForm.jsx
│   │   ├── ProductList.jsx
│   │   ├── Cart.jsx
│   │   └── Checkout.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Funcionalidades

### Autenticación
- Registro de nuevos usuarios
- Inicio de sesión
- Cierre de sesión

### Catálogo
- Visualización de productos
- Filtrado por categoría
- Búsqueda

### Carrito
- Agregar/quitar productos
- Ajustar cantidades
- Persistencia en localStorage

### Pedidos
- Información de entrega (dirección, teléfono)
- Notas especiales
- Confirmación de pedido

## Configuración de RLS (Row Level Security)

Para mayor seguridad, configura RLS en Supabase:

```sql
-- Habilitar RLS en products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver todos los productos
CREATE POLICY "Products visible to all" ON products
FOR SELECT USING (true);

-- Habilitar RLS en orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios pedidos
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propios pedidos
CREATE POLICY "Users can create own orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Habilitar RLS en order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver items de sus propios pedidos
CREATE POLICY "Users can view own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND auth.uid() = orders.user_id
  )
);
```

## Próximas Mejoras

- [ ] Panel de administrador
- [ ] Métodos de pago integrados
- [ ] Notificaciones por email
- [ ] Historial de pedidos
- [ ] Calificaciones de productos
- [ ] Cupones de descuento

## Soporte

Si encuentras problemas, verifica:
1. Las credenciales de Supabase en `.env.local`
2. Las políticas RLS estén configuradas correctamente
3. Las tablas existan en la base de datos

¡Bienvenido a Auto Pedido! 🛒
