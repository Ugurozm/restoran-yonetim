-- Masalar
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'empty' -- empty | occupied | partial | closed
);

-- Adisyonlar
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_id INT REFERENCES tables(id),
  total_amount NUMERIC(10,2) NOT NULL,
  remaining_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open | partial | closed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sipariş kalemleri
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  item_name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE
);

-- Ödeme kayıtları
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_type VARCHAR(20) NOT NULL, -- item_based | amount_based
  payer_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demo verisi: 5 masa
INSERT INTO tables (table_number) VALUES (1),(2),(3),(4),(5)
ON CONFLICT DO NOTHING;

-- Demo adisyon: masa 1'de açık hesap
INSERT INTO orders (table_id, total_amount, remaining_amount, status)
VALUES (1, 450.00, 450.00, 'open');

INSERT INTO order_items (order_id, item_name, price) VALUES
(1, 'Et Döner', 120.00),
(1, 'Izgara Köfte', 150.00),
(1, 'Kola x2', 60.00),
(1, 'Ayran x2', 40.00),
(1, 'Baklava', 80.00);

UPDATE tables SET status = 'occupied' WHERE table_number = 1;