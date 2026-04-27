-- ESQUEMA DE BASE DE DATOS PARA DULCE BETHEL

-- 1. Configuraciones generales
CREATE TABLE IF NOT EXISTS config (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT DEFAULT 'Dulce Bethel',
    logo_url TEXT,
    bcv_rate DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lugares / Zonas
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Productos e Inventario
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    wholesale_price DECIMAL(10, 2) DEFAULT 0,
    stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clientes
CREATE TABLE IF NOT EXISTS clients (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    client_id BIGINT REFERENCES clients(id),
    location_id BIGINT REFERENCES locations(id),
    date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'Pendiente', -- Pendiente, Entregado, Cancelado
    delivery_number TEXT,
    notes TEXT,
    bcv_rate DECIMAL(10, 2),
    total_usd DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    debt_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Detalles de Pedido (Para soportar múltiples productos por pedido de forma limpia)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- 7. Pagos
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL, -- Puede ser NULL si es un pago general
    client_id BIGINT REFERENCES clients(id),
    date TIMESTAMPTZ DEFAULT NOW(),
    amount_usd DECIMAL(10, 2) NOT NULL,
    amount_bs DECIMAL(10, 2) NOT NULL,
    bcv_rate DECIMAL(10, 2) NOT NULL,
    reference TEXT,
    note TEXT,
    delivery_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Compras (Gastos de Materia Prima)
CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 0,
    unit_price DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Producción
CREATE TABLE IF NOT EXISTS production (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW(),
    product_id BIGINT REFERENCES products(id),
    quantity INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Movimientos (Préstamos / Otros)
CREATE TABLE IF NOT EXISTS movements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL, -- Ingreso, Egreso
    category TEXT NOT NULL,
    person TEXT,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCIONES ESPECIALES (RPC)

-- A. Función para registrar una venta y actualizar stock
CREATE OR REPLACE FUNCTION save_order_v2(
    p_client_id BIGINT,
    p_location_id BIGINT,
    p_delivery_number TEXT,
    p_notes TEXT,
    p_bcv_rate DECIMAL,
    p_total_usd DECIMAL,
    p_paid_amount DECIMAL,
    p_items JSONB -- [{product_id, quantity, unit_price, total_price}]
) RETURNS BIGINT AS $$
DECLARE
    v_order_id BIGINT;
    item RECORD;
BEGIN
    -- 1. Insertar el pedido
    INSERT INTO orders (client_id, location_id, bcv_rate, total_usd, paid_amount, debt_amount, delivery_number, notes, status)
    VALUES (p_client_id, p_location_id, p_bcv_rate, p_total_usd, p_paid_amount, p_total_usd - p_paid_amount, p_delivery_number, p_notes, 'Pendiente')
    RETURNING id INTO v_order_id;

    -- 2. Insertar los items y actualizar stock
    FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INT, unit_price DECIMAL, total_price DECIMAL)
    LOOP
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (v_order_id, item.product_id, item.quantity, item.unit_price, item.total_price);

        UPDATE products 
        SET stock = stock - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    -- 3. Si hubo pago, registrarlo
    IF p_paid_amount > 0 THEN
        INSERT INTO payments (order_id, client_id, amount_usd, amount_bs, bcv_rate, delivery_number, note)
        VALUES (v_order_id, p_client_id, p_paid_amount, p_paid_amount * p_bcv_rate, p_bcv_rate, p_delivery_number, 'Pago inicial de orden');
    END IF;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- B. Función para registrar producción y aumentar stock
CREATE OR REPLACE FUNCTION record_production(
    p_product_id BIGINT,
    p_quantity INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO production (product_id, quantity)
    VALUES (p_product_id, p_quantity);

    UPDATE products 
    SET stock = stock + p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
