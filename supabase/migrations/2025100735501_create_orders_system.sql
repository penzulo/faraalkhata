-- ========== SUPPLIERS TABLE ==========
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== REFERRAL PARTNERS TABLE ==========
CREATE TABLE IF NOT EXISTS referral_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percent','fixed')),
  commission_value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to referral_partners" ON referral_partners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== CUSTOMER TABLE ADDITIONS ==========
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_partner_id UUID REFERENCES referral_partners(id);

-- ========== PRODUCTS TABLE ADDITIONS ==========
ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock NUMERIC DEFAULT 0;

-- ========== INVENTORY TRANSACTIONS ==========
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PURCHASE','SALE','ADJUSTMENT')),
  cost_price NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to inventory_transactions" ON inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== SUPPLIER PAYMENTS ==========
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to supplier_payments" ON supplier_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== DELIVERY ADDRESSES ==========
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to delivery_addresses" ON delivery_addresses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== ORDERS ==========
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  referral_partner_id UUID REFERENCES referral_partners(id),
  delivery_address_id UUID REFERENCES delivery_addresses(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready_for_pickup', 'completed', 'cancelled')),
  total_amount NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  due_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== ORDER DISPLAY ID GENERATOR ==========
CREATE OR REPLACE FUNCTION update_order_display_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
  new_id TEXT;
  season_year TEXT := TO_CHAR(NEW.created_at, 'YYYY');
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM orders WHERE TO_CHAR(created_at, 'YYYY') = season_year;
  new_id := 'OID' || season_year || LPAD(next_num::text, 3, '0');
  NEW.display_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_display_id
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION update_order_display_id();

-- ========== ORDER ITEMS ==========
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity NUMERIC NOT NULL,
  price_at_time NUMERIC NOT NULL,
  cost_price_at_time NUMERIC NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== ORDER PAYMENTS ==========
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('Cash','UPI','Card','Bank Transfer')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ref_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to order_payments" ON order_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== ORDER CANCELLATIONS ==========
CREATE TABLE IF NOT EXISTS order_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  notes TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to order_cancellations" ON order_cancellations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========== INDEXES FOR PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments (order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory_transactions (supplier_id);

-- ========== AUTOMATIC TIMESTAMP UPDATE ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== STOCK MANAGEMENT FUNCTIONS ==========

-- Function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET current_stock = current_stock - quantity
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment product stock (for cancellations)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET current_stock = current_stock + quantity
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ========== AUTOMATIC STOCK RESTORATION ON ORDER DELETION ==========

-- Function to restore stock when order is deleted
CREATE OR REPLACE FUNCTION restore_stock_on_order_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore stock for each item in the deleted order
  UPDATE products p
  SET current_stock = current_stock + oi.quantity
  FROM order_items oi
  WHERE oi.order_id = OLD.id
    AND p.id = oi.product_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to restore stock on order deletion
DROP TRIGGER IF EXISTS restore_stock_on_delete ON orders;
CREATE TRIGGER restore_stock_on_delete
BEFORE DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_order_delete();

-- ========== OPTIONAL: PREVENT DELETING NON-CANCELLED ORDERS ==========

-- Function to prevent deleting orders that aren't cancelled
CREATE OR REPLACE FUNCTION prevent_order_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' THEN
    RAISE EXCEPTION 'Cannot delete order %. Please cancel it first using the application.', OLD.display_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent direct deletion of non-cancelled orders
DROP TRIGGER IF EXISTS prevent_direct_order_deletion ON orders;
CREATE TRIGGER prevent_direct_order_deletion
BEFORE DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION prevent_order_deletion();
