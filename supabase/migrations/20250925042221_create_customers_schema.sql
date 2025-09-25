-- Migration: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  name VARCHAR(50) NOT NULL UNIQUE, 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Create updated_at trigger for categories
CREATE 
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_categories_updated_at BEFORE 
UPDATE 
  ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Insert predefined categories
INSERT INTO categories (name) 
VALUES 
  ('Family'), 
  ('Friend'), 
  ('Regular Customer'), 
  ('Wholesale'), 
  ('Retail') ON CONFLICT (name) DO NOTHING;
-- Enable RLS (Row Level Security)
ALTER TABLE 
  categories ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to read categories (shared across users)
CREATE POLICY "Allow read access to all categories" ON categories FOR 
SELECT 
  TO authenticated USING (true);
-- Allow all authenticated users to insert new categories
CREATE POLICY "Allow insert access to categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
-- Migration: Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  name VARCHAR(100) NOT NULL, 
  phone VARCHAR(10) NOT NULL UNIQUE, 
  notes TEXT, 
  is_archived BOOLEAN DEFAULT FALSE NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
  -- Constraints
  CONSTRAINT phone_format CHECK (phone ~ '^[6-9][0-9]{9}$')
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_archived ON customers (is_archived);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);
-- Create updated_at trigger for customers
CREATE TRIGGER update_customers_updated_at BEFORE 
UPDATE 
  ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS (Row Level Security)
ALTER TABLE 
  customers ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to access all customers (shared across users)
CREATE POLICY "Allow full access to customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Migration: Create customer_categories junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS customer_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE, 
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE, 
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, 
  -- Ensure unique customer-category combinations
  UNIQUE(customer_id, category_id)
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_categories_customer ON customer_categories (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_categories_category ON customer_categories (category_id);
-- Enable RLS (Row Level Security)
ALTER TABLE 
  customer_categories ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to access customer categories
CREATE POLICY "Allow full access to customer_categories" ON customer_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migration: Create orders table foundation (for future reference)
-- This table will reference customers when you implement order management
-- CREATE TABLE IF NOT EXISTS orders (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
--   order_number VARCHAR(50) UNIQUE NOT NULL,
--   total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
--   status VARCHAR(20) DEFAULT 'pending' NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
--   updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
--   -- Constraints
--   CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
--   CONSTRAINT positive_total CHECK (total_amount >= 0)
-- );

-- -- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- -- Create updated_at trigger for orders
-- CREATE TRIGGER update_orders_updated_at 
--     BEFORE UPDATE ON orders 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- Enable RLS (Row Level Security)
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- -- Allow all authenticated users to access all orders (shared across users)
-- CREATE POLICY "Allow full access to orders" ON orders
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);

