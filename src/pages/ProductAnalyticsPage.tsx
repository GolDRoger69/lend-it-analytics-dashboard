
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function ProductAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("all-analytics");
  
  // Product owners count
  const { data: productOwners = [], isLoading: ownersLoading, error: ownersError } = useQuery({
    queryKey: ['product-owners-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          owner_id,
          users!products_owner_id_fkey (
            name
          )
        `)
        .order('owner_id');

      if (error) {
        toast.error(`Error fetching product owners: ${error.message}`);
        throw error;
      }
      
      // Count products per owner
      const ownerCounts = data.reduce((acc, product) => {
        const ownerId = product.owner_id;
        const ownerName = product.users?.name || 'Unknown';
        
        if (!acc[ownerId]) {
          acc[ownerId] = { owner_name: ownerName, total_products: 0 };
        }
        
        acc[ownerId].total_products += 1;
        return acc;
      }, {});
      
      return Object.values(ownerCounts);
    }
  });
  
  // Owners with more than 2 products
  const ownersWithMultipleProducts = productOwners.filter(
    (owner: any) => owner.total_products > 2
  );
  
  // Products not rented yet
  const { data: unrentedProducts = [], isLoading: unrentedLoading, error: unrentedError } = useQuery({
    queryKey: ['unrented-products'],
    queryFn: async () => {
      // First get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category, rental_price');
      
      if (productsError) {
        toast.error(`Error fetching products: ${productsError.message}`);
        throw productsError;
      }
      
      // Then get rented product ids
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('product_id');
      
      if (rentalsError) {
        toast.error(`Error fetching rentals: ${rentalsError.message}`);
        throw rentalsError;
      }
      
      // Filter products that haven't been rented
      const rentedProductIds = new Set(rentals.map(rental => rental.product_id));
      return products.filter(product => !rentedProductIds.has(product.product_id));
    }
  });
  
  // Products with higher than avg price in their category
  const { data: premiumProducts = [], isLoading: premiumLoading, error: premiumError } = useQuery({
    queryKey: ['premium-products'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category, rental_price');
      
      if (productsError) {
        toast.error(`Error fetching products: ${productsError.message}`);
        throw productsError;
      }
      
      // Calculate average prices by category
      const categoryPrices = products.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = {
            total: 0,
            count: 0,
            average: 0
          };
        }
        
        acc[category].total += product.rental_price;
        acc[category].count += 1;
        return acc;
      }, {});
      
      // Calculate averages
      Object.keys(categoryPrices).forEach(category => {
        categoryPrices[category].average = 
          categoryPrices[category].total / categoryPrices[category].count;
      });
      
      // Filter products above average price in their category
      return products.filter(product => 
        product.rental_price > categoryPrices[product.category].average
      ).map(product => ({
        ...product,
        avg_category_price: categoryPrices[product.category].average.toFixed(2)
      }));
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Analytics</h1>
      <p className="text-muted-foreground">Detailed analysis of products and ownership patterns.</p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all-analytics">All Analytics</TabsTrigger>
          <TabsTrigger value="ownership">Ownership Analysis</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-analytics" className="space-y-6 mt-6">
          <DataTable
            title="Product Owners"
            description="Number of products owned by each user"
            columns={[
              { key: 'owner_name', label: 'Owner' },
              { key: 'total_products', label: 'Total Products' }
            ]}
            data={productOwners}
            isLoading={ownersLoading}
            error={ownersError?.message}
          />
          
          <DataTable
            title="Unrented Products"
            description="Products that haven't been rented yet"
            columns={[
              { key: 'product_id', label: 'ID' },
              { key: 'name', label: 'Product Name' },
              { key: 'category', label: 'Category' },
              { key: 'rental_price', label: 'Price' }
            ]}
            data={unrentedProducts}
            isLoading={unrentedLoading}
            error={unrentedError?.message}
          />
        </TabsContent>
        
        <TabsContent value="ownership" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ownership Analysis</CardTitle>
              <CardDescription>
                Analysis of product ownership patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Power Sellers (>2 Products)"
                description="Owners with more than 2 products"
                columns={[
                  { key: 'owner_name', label: 'Owner' },
                  { key: 'total_products', label: 'Total Products' }
                ]}
                data={ownersWithMultipleProducts}
                isLoading={ownersLoading}
                error={ownersError?.message}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pricing" className="space-y-6 mt-6">
          <DataTable
            title="Premium Products"
            description="Products priced above average for their category"
            columns={[
              { key: 'name', label: 'Product Name' },
              { key: 'category', label: 'Category' },
              { key: 'rental_price', label: 'Price' },
              { key: 'avg_category_price', label: 'Category Avg Price' }
            ]}
            data={premiumProducts}
            isLoading={premiumLoading}
            error={premiumError?.message}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
