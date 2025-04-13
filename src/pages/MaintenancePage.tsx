
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CheckCircle, AlertCircle, ClockIcon } from "lucide-react";

export function MaintenancePage() {
  const { data: maintenanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          maintenance_id,
          last_cleaned,
          next_cleaning_due,
          status,
          product_id,
          products(name, category, sub_category, rental_price)
        `);

      if (error) {
        toast.error(`Error fetching maintenance records: ${error.message}`);
        throw error;
      }
      
      return data.map(record => ({
        maintenance_id: record.maintenance_id,
        product_id: record.product_id,
        product_name: record.products?.name || 'Unknown',
        category: record.products?.category || 'Unknown',
        sub_category: record.products?.sub_category || 'N/A',
        rental_price: record.products?.rental_price || 0,
        last_cleaned: record.last_cleaned,
        next_cleaning_due: record.next_cleaning_due,
        status: record.status
      })) || [];
    }
  });

  // Check which products need attention (due date is past or today)
  const today = new Date().toISOString().split('T')[0];
  const needsAttention = maintenanceRecords.filter(
    record => record.next_cleaning_due && record.next_cleaning_due <= today
  ).length;

  // Calculate how many products are clean
  const cleanProducts = maintenanceRecords.filter(
    record => record.status === 'clean'
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Maintenance</h1>
      <p className="text-muted-foreground">Track the cleaning and maintenance status of all products</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <CalendarCheck className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{maintenanceRecords.length}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="mr-4 bg-green-100 p-2 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clean Products</p>
            <p className="text-2xl font-bold">{cleanProducts}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center">
          <div className="mr-4 bg-amber-100 p-2 rounded-full">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Needs Attention</p>
            <p className="text-2xl font-bold">{needsAttention}</p>
          </div>
        </Card>
      </div>
      
      <DataTable 
        title="Maintenance Records" 
        description="Complete maintenance history and schedule for all products"
        columns={[
          { key: 'product_id', label: 'ID' },
          { key: 'product_name', label: 'Product Name' },
          { key: 'category', label: 'Category' },
          { key: 'sub_category', label: 'Sub-Category' },
          { key: 'last_cleaned', label: 'Last Cleaned' },
          { key: 'next_cleaning_due', label: 'Due Date' },
          { key: 'status', label: 'Status' }
        ]}
        data={maintenanceRecords}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        renderCell={(column, value, item) => {
          if (column === 'status') {
            let color = 'bg-gray-100 text-gray-800';
            if (value === 'clean') color = 'bg-green-100 text-green-800';
            if (value === 'needs cleaning') color = 'bg-amber-100 text-amber-800';
            if (value === 'damaged') color = 'bg-red-100 text-red-800';
            
            return (
              <Badge variant="outline" className={`${color} capitalize`}>
                {value}
              </Badge>
            );
          }
          
          if (column === 'next_cleaning_due') {
            const today = new Date().toISOString().split('T')[0];
            const isPastDue = value && value < today;
            
            return (
              <div className="flex items-center">
                {isPastDue && <ClockIcon className="h-4 w-4 text-red-500 mr-1" />}
                {value}
              </div>
            );
          }
          
          return value;
        }}
      />
    </div>
  );
}
