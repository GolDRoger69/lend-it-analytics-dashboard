
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RentalPairsPage() {
  const { data: rentalPairs = [], isLoading, error } = useQuery({
    queryKey: ['rental-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          rental_id,
          users!rentals_renter_id_fkey(name),
          products(name, users!products_owner_id_fkey(name))
        `);

      if (error) {
        toast.error(`Error fetching rental pairs: ${error.message}`);
        throw error;
      }
      
      return data.map(rental => ({
        rental_id: rental.rental_id,
        renter_name: rental.users?.name,
        product_name: rental.products?.name,
        owner_name: rental.products?.users?.name
      }));
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Rental Pairs</h1>
      <p className="text-muted-foreground">Relationships between renters, owners, and products.</p>
      
      <DataTable 
        title="Renter-Product-Owner Pairs" 
        description="Who is renting what from whom"
        columns={[
          { key: 'rental_id', label: 'Rental ID' },
          { key: 'renter_name', label: 'Renter' },
          { key: 'product_name', label: 'Product' },
          { key: 'owner_name', label: 'Owner' }
        ]}
        data={rentalPairs}
        isLoading={isLoading}
        error={error?.message}
      />
    </div>
  );
}
