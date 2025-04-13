
import { useMaintenanceRecords } from "@/integrations/supabase/hooks";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MaintenancePage() {
  const { data: maintenanceRecords = [], isLoading, error } = useMaintenanceRecords();
  
  // Format the date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Calculate if maintenance is due (next_cleaning_due < today)
  const isDue = (nextCleaning: string) => {
    const today = new Date();
    const dueDate = new Date(nextCleaning);
    return dueDate < today;
  };
  
  // Format the data for the table
  const formattedData = maintenanceRecords.map(record => ({
    maintenance_id: record.maintenance_id,
    product_name: record.product_name || 'Unknown',
    product_id: record.product_id,
    last_cleaned: formatDate(record.last_cleaned),
    next_cleaning_due: formatDate(record.next_cleaning_due),
    status: record.status,
    maintenance_due: isDue(record.next_cleaning_due) ? 'Overdue' : 'On Schedule',
  }));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage product maintenance schedules.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Products</CardTitle>
            <CardDescription>Products in maintenance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {maintenanceRecords.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Maintenance Due</CardTitle>
            <CardDescription>Products needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {formattedData.filter(record => record.maintenance_due === 'Overdue').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Clean Status</CardTitle>
            <CardDescription>Products with clean status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formattedData.filter(record => record.status === 'clean').length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DataTable
        title="Maintenance Records"
        description="Product maintenance schedule and status"
        columns={[
          { key: 'maintenance_id', label: 'ID' },
          { key: 'product_name', label: 'Product' },
          { key: 'product_id', label: 'Product ID' },
          { key: 'last_cleaned', label: 'Last Cleaned' },
          { key: 'next_cleaning_due', label: 'Next Due' },
          { key: 'status', label: 'Status' },
          { key: 'maintenance_due', label: 'Schedule' }
        ]}
        data={formattedData}
        isLoading={isLoading}
        error={error?.message}
      />
    </div>
  );
}
