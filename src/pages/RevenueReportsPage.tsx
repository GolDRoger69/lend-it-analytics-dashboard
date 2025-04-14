
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function RevenueReportsPage() {
  // Top 5 products by revenue
  const { data: topProducts = [], isLoading: topProductsLoading, error: topProductsError } = useQuery({
    queryKey: ['top-products-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          total_cost,
          products (
            name,
            product_id
          )
        `);

      if (error) {
        toast.error(`Error fetching top products: ${error.message}`);
        throw error;
      }
      
      // Calculate total revenue per product
      const productRevenue = data.reduce((acc, rental) => {
        const productId = rental.products.product_id;
        const productName = rental.products.name;
        const amount = rental.total_cost;
        
        if (!acc[productId]) {
          acc[productId] = { product_name: productName, revenue: 0 };
        }
        acc[productId].revenue += amount;
        return acc;
      }, {});
      
      // Convert to array and sort
      const sortedProducts = Object.values(productRevenue)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);
      
      return sortedProducts;
    }
  });
  
  // High spending customers
  const { data: highSpenders = [], isLoading: highSpendersLoading, error: highSpendersError } = useQuery({
    queryKey: ['high-spending-customers'],
    queryFn: async () => {
      // First get average spending
      const { data: avgData, error: avgError } = await supabase
        .from('rentals')
        .select('total_cost')
        .then(result => {
          const avg = result.data?.reduce((sum, r) => sum + r.total_cost, 0) / (result.data?.length || 1);
          return { data: avg, error: result.error };
        });
        
      if (avgError) {
        toast.error(`Error calculating average spending: ${avgError.message}`);
        throw avgError;
      }
      
      const avgSpending = avgData || 0;
      
      // Get customers with spending > avg
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          renter_id,
          total_cost,
          users!rentals_renter_id_fkey (
            name,
            email
          )
        `);
      
      if (error) {
        toast.error(`Error fetching high spenders: ${error.message}`);
        throw error;
      }
      
      // Calculate total spending per customer
      const customerSpending = data.reduce((acc, rental) => {
        const renterId = rental.renter_id;
        const amount = rental.total_cost;
        
        if (!acc[renterId]) {
          acc[renterId] = { 
            name: rental.users.name, 
            email: rental.users.email,
            total_spent: 0 
          };
        }
        acc[renterId].total_spent += amount;
        return acc;
      }, {});
      
      // Filter customers with spending > avg
      return Object.values(customerSpending)
        .filter((customer: any) => customer.total_spent > avgSpending);
    }
  });
  
  // Chart data for visualization
  const chartData = topProducts.map((product: any) => ({
    name: product.product_name.substring(0, 20) + (product.product_name.length > 20 ? '...' : ''),
    value: product.revenue
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Revenue Reports</h1>
      <p className="text-muted-foreground">Revenue analysis and top performing products.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Revenue Generating Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsLoading ? (
              <div className="flex justify-center p-8">Loading chart data...</div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <DataTable
          title="Top Revenue Products"
          description="Products that have generated the most revenue"
          columns={[
            { key: 'product_name', label: 'Product' },
            { key: 'revenue', label: 'Total Revenue' }
          ]}
          data={topProducts}
          isLoading={topProductsLoading}
          error={topProductsError?.message}
        />
      </div>
      
      <DataTable
        title="High Spending Customers"
        description="Customers with spending above average"
        columns={[
          { key: 'name', label: 'Customer Name' },
          { key: 'email', label: 'Email' },
          { key: 'total_spent', label: 'Total Spent' }
        ]}
        data={highSpenders}
        isLoading={highSpendersLoading}
        error={highSpendersError?.message}
      />
    </div>
  );
}
