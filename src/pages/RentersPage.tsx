
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RentersPage() {
  const { data: renters = [], isLoading, error } = useQuery({
    queryKey: ['renters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, phone')
        .eq('role', 'renter');

      if (error) {
        toast.error(`Error fetching renters: ${error.message}`);
        throw error;
      }
      
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Renters</h1>
      <p className="text-muted-foreground">All users with 'renter' role in the system.</p>
      
      <DataTable 
        title="Renters List" 
        description="Users who can rent products from owners"
        columns={[
          { key: 'user_id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
        ]}
        data={renters}
        isLoading={isLoading}
        error={error?.message}
      />
    </div>
  );
}
