-- 1. CREATE THE PRODUCTS TABLE
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(), 
  created_at timestamptz NOT NULL DEFAULT now(), 
  name text NOT NULL, 
  unit_of_measure text NOT NULL, 
  sell_price numeric NOT NULL, 
  CONSTRAINT products_pkey PRIMARY KEY (id), 
  CONSTRAINT products_sell_price_check CHECK (
    (sell_price >= (0)::numeric)
  )
);
COMMENT ON TABLE public.products IS 'Master list of all faraal products offered.';

-- 2. CREATE THE PRODUCT PRICE HISTORY TABLE
CREATE TABLE public.product_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(), 
  created_at timestamptz NOT NULL DEFAULT now(), 
  product_id uuid NOT NULL, 
  cost_price numeric NOT NULL, 
  effective_from_date timestamptz NOT NULL DEFAULT now(), 
  CONSTRAINT product_price_history_pkey PRIMARY KEY (id), 
  CONSTRAINT product_price_history_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE, 
  CONSTRAINT product_price_history_cost_price_check CHECK (
    (cost_price >= (0)::numeric)
  ),
  -- Prevent duplicate prices for same product on same date
  CONSTRAINT product_price_history_unique_date_per_product 
    UNIQUE (product_id, effective_from_date)
);
COMMENT ON TABLE public.product_price_history IS 'Tracks historical cost prices for each product.';

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_product_price_history_product_id 
  ON public.product_price_history(product_id);

CREATE INDEX idx_product_price_history_effective_date 
  ON public.product_price_history(product_id, effective_from_date DESC);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
CREATE POLICY "Allow authenticated users to manage products" 
  ON public.products FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage price history" 
  ON public.product_price_history FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6. HELPER FUNCTION FOR CURRENT COST PRICE
CREATE OR REPLACE FUNCTION public.get_current_cost_price(product_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cost_price 
  FROM public.product_price_history 
  WHERE product_id = product_uuid 
    AND effective_from_date <= now()
  ORDER BY effective_from_date DESC 
  LIMIT 1;
$$;
