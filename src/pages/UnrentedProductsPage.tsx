
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UnrentedProductsPage() {
  const { data: unrentedProducts = [], isLoading, error } = useQuery({
    queryKey: ['unrented-products'],
    queryFn: async () => {
      // This query uses a left join to find products that haven't been rented
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          category,
          rental_price,
          sub_category,
          available_quantity
        `)
        .not('product_id', 'in', supabase
          .from('rentals')
          .select('product_id')
        );

      if (error) {
        toast.error(`Error fetching unrented products: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Unrented Products</h1>
      <p className="text-muted-foreground">Products that have not been rented yet.</p>
      
      <DataTable 
        title="Unrented Products List" 
        description="Products with no rental history"
        columns={[
          { key: 'product_id', label: 'ID' },
          { key: 'name', label: 'Product Name' },
          { key: 'category', label: 'Category' },
          { key: 'sub_category', label: 'Sub-category' },
          { key: 'available_quantity', label: 'Available Quantity' },
          { key: 'rental_price', label: 'Price' }
        ]}
        data={unrentedProducts}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : String(error)}
      />
    </div>
  );
}
