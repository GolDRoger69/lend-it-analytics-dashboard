
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProductOwnersPage() {
  const { data: productOwners = [], isLoading, error } = useQuery({
    queryKey: ['product-owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          name,
          email,
          products(product_id)
        `)
        .eq('role', 'owner');

      if (error) {
        toast.error(`Error fetching product owners: ${error.message}`);
        throw error;
      }
      
      return data.map(owner => ({
        user_id: owner.user_id,
        name: owner.name,
        email: owner.email,
        total_products: owner.products?.length || 0
      }));
    }
  });

  // Filter owners with more than 2 products
  const filteredOwners = productOwners.filter(owner => owner.total_products > 2);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Owners</h1>
      <p className="text-muted-foreground">Users who own products in the system.</p>
      
      <DataTable 
        title="All Product Owners" 
        description="All users with owner role and their product counts"
        columns={[
          { key: 'user_id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'total_products', label: 'Total Products' }
        ]}
        data={productOwners}
        isLoading={isLoading}
        error={error?.message}
      />

      <DataTable 
        title="Owners with 3+ Products" 
        description="Owners who have at least 3 products listed"
        columns={[
          { key: 'user_id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'total_products', label: 'Total Products' }
        ]}
        data={filteredOwners}
        isLoading={isLoading}
        error={error?.message}
      />
    </div>
  );
}
