
-- Define the function to get unrented products
CREATE OR REPLACE FUNCTION public.get_unrented_products()
RETURNS TABLE (
  product_id INTEGER,
  name TEXT,
  category TEXT,
  rental_price NUMERIC
) 
LANGUAGE sql
AS $$
  SELECT p.product_id, p.name, p.category, p.rental_price
  FROM products p
  LEFT JOIN rentals r ON p.product_id = r.product_id
  WHERE r.rental_id IS NULL;
$$;

-- Allow public access to this function
GRANT EXECUTE ON FUNCTION public.get_unrented_products() TO anon;
GRANT EXECUTE ON FUNCTION public.get_unrented_products() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unrented_products() TO service_role;
