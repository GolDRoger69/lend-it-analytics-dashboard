
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export function DataQueriesPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [productCategoriesFilter, setProductCategoriesFilter] = useState<string[]>([]);
  
  // Query for all product categories
  const { data: productCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['productCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');
      
      if (error) {
        toast.error(`Error fetching categories: ${error.message}`);
        throw error;
      }
      
      // Manually get unique categories since we can't use .distinct()
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.map(category => ({ category }));
    }
  });
  
  // Query for all product sub-categories
  const { data: productSubCategories = [], isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ['productSubCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('sub_category')
        .order('sub_category');
      
      if (error) {
        toast.error(`Error fetching sub-categories: ${error.message}`);
        throw error;
      }
      
      // Manually get unique sub-categories
      const uniqueSubCategories = Array.from(new Set(data.map(item => item.sub_category)));
      return uniqueSubCategories.map(sub_category => ({ sub_category }));
    }
  });
  
  // Products with highest rental count
  const { data: topRentedProducts = [], isLoading: isLoadingTopRented } = useQuery({
    queryKey: ['topRentedProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_top_rented_products', { limit_count: 10 })
        .select('*');
      
      if (error) {
        // If RPC function doesn't exist, fall back to a regular query
        if (error.message.includes('function "get_top_rented_products" does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('rentals')
            .select(`
              product_id,
              products!inner (
                name,
                category,
                sub_category,
                rental_price
              )
            `)
            .order('product_id');
          
          if (fallbackError) {
            toast.error(`Error fetching top rented products: ${fallbackError.message}`);
            throw fallbackError;
          }
          
          // Count occurrences of each product_id
          const productCounts = fallbackData.reduce((acc, rental) => {
            acc[rental.product_id] = (acc[rental.product_id] || 0) + 1;
            return acc;
          }, {});
          
          // Create a list of unique products with their rental counts
          const uniqueProducts = [];
          const seenProducts = new Set();
          
          for (const rental of fallbackData) {
            if (!seenProducts.has(rental.product_id)) {
              seenProducts.add(rental.product_id);
              uniqueProducts.push({
                product_id: rental.product_id,
                name: rental.products.name,
                category: rental.products.category,
                sub_category: rental.products.sub_category,
                rental_price: rental.products.rental_price,
                rental_count: productCounts[rental.product_id]
              });
            }
          }
          
          // Sort by rental_count in descending order and take the top 10
          return uniqueProducts
            .sort((a, b) => b.rental_count - a.rental_count)
            .slice(0, 10);
        }
        
        toast.error(`Error fetching top rented products: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Products with highest revenue
  const { data: topRevenueProducts = [], isLoading: isLoadingTopRevenue } = useQuery({
    queryKey: ['topRevenueProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_top_revenue_products', { limit_count: 10 })
        .select('*');
      
      if (error) {
        // If RPC function doesn't exist, fall back to a regular query
        if (error.message.includes('function "get_top_revenue_products" does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('rentals')
            .select(`
              product_id,
              total_cost,
              products!inner (
                name,
                category,
                sub_category,
                rental_price
              )
            `);
          
          if (fallbackError) {
            toast.error(`Error fetching top revenue products: ${fallbackError.message}`);
            throw fallbackError;
          }
          
          // Sum total_cost for each product_id
          const productRevenue = fallbackData.reduce((acc, rental) => {
            acc[rental.product_id] = (acc[rental.product_id] || 0) + parseFloat(rental.total_cost);
            return acc;
          }, {});
          
          // Create a list of unique products with their total revenue
          const uniqueProducts = [];
          const seenProducts = new Set();
          
          for (const rental of fallbackData) {
            if (!seenProducts.has(rental.product_id)) {
              seenProducts.add(rental.product_id);
              uniqueProducts.push({
                product_id: rental.product_id,
                name: rental.products.name,
                category: rental.products.category,
                sub_category: rental.products.sub_category,
                rental_price: rental.products.rental_price,
                total_revenue: productRevenue[rental.product_id]
              });
            }
          }
          
          // Sort by total_revenue in descending order and take the top 10
          return uniqueProducts
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 10);
        }
        
        toast.error(`Error fetching top revenue products: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Products that have never been rented
  const { data: unrentedProducts = [], isLoading: isLoadingUnrented } = useQuery({
    queryKey: ['unrentedProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_unrented_products')
        .select('*');
      
      if (error) {
        // If RPC function doesn't exist, fall back to a regular query
        if (error.message.includes('function "get_unrented_products" does not exist')) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*');
          
          if (productsError) {
            toast.error(`Error fetching products: ${productsError.message}`);
            throw productsError;
          }
          
          const { data: rentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('product_id');
          
          if (rentalsError) {
            toast.error(`Error fetching rentals: ${rentalsError.message}`);
            throw rentalsError;
          }
          
          // Get all product IDs that have been rented
          const rentedProductIds = new Set(rentals.map(rental => rental.product_id));
          
          // Filter products to get only those that haven't been rented
          return products.filter(product => !rentedProductIds.has(product.product_id));
        }
        
        toast.error(`Error fetching unrented products: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Query for maintenance records of specific status
  const getMaintenanceByStatus = (status: string) => {
    return useQuery({
      queryKey: ['maintenance', status],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('maintenance')
          .select(`
            maintenance_id,
            status,
            last_cleaned,
            next_cleaning_due,
            product_id,
            products (
              name
            )
          `)
          .eq('status', status);
        
        if (error) {
          toast.error(`Error fetching ${status} maintenance: ${error.message}`);
          throw error;
        }
        
        return data.map(record => ({
          ...record,
          product_name: record.products?.name || 'Unknown Product'
        }));
      }
    });
  };
  
  // Get maintenance records by status
  const { data: pendingMaintenance = [], isLoading: isLoadingPending } = getMaintenanceByStatus('pending');
  const { data: completedMaintenance = [], isLoading: isLoadingCompleted } = getMaintenanceByStatus('completed');
  
  // Filter products by selected categories
  const toggleCategoryFilter = (category: string) => {
    setProductCategoriesFilter(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Queries and Analysis</h1>
        <p className="text-muted-foreground">
          Explore and analyze rental data across different dimensions
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
          <TabsTrigger value="products">Products Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="renters">Renter Analysis</TabsTrigger>
          <TabsTrigger value="owners">Owner Analysis</TabsTrigger>
          <TabsTrigger value="custom">Custom Queries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-8">
          {/* Category Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Category</CardTitle>
              <CardDescription>Select categories to filter products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {isLoadingCategories ? (
                  <div>Loading categories...</div>
                ) : (
                  productCategories.map((cat, index) => (
                    <Button
                      key={index}
                      variant={productCategoriesFilter.includes(cat.category) ? "default" : "outline"}
                      onClick={() => toggleCategoryFilter(cat.category)}
                      className="text-sm h-8"
                    >
                      {cat.category}
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Top Rented Products */}
          <Card>
            <CardHeader>
              <CardTitle>Most Frequently Rented Products</CardTitle>
              <CardDescription>Products with the highest number of rentals</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Product Name" },
                  { key: "category", label: "Category" },
                  { key: "sub_category", label: "Subcategory" },
                  { key: "rental_count", label: "Number of Rentals" },
                  { key: "rental_price", label: "Price per Day" },
                ]}
                data={topRentedProducts.filter(product => 
                  productCategoriesFilter.length === 0 || 
                  productCategoriesFilter.includes(product.category)
                )}
                isLoading={isLoadingTopRented}
              />
            </CardContent>
          </Card>
          
          {/* Product Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Overview of product categories and subcategories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Main Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {isLoadingCategories ? (
                    <div className="col-span-full">Loading categories...</div>
                  ) : (
                    productCategories.map((cat, index) => (
                      <div key={index} className="bg-muted p-4 rounded-lg">
                        {cat.category}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sub Categories</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {isLoadingSubCategories ? (
                    <div className="col-span-full">Loading subcategories...</div>
                  ) : (
                    productSubCategories.map((subCat, index) => (
                      <div key={index} className="border border-border p-3 rounded-md">
                        {subCat.sub_category}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Unrented Products */}
          <Card>
            <CardHeader>
              <CardTitle>Unrented Products</CardTitle>
              <CardDescription>Products that have never been rented</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Product Name" },
                  { key: "category", label: "Category" },
                  { key: "sub_category", label: "Subcategory" },
                  { key: "rental_price", label: "Price per Day" },
                  { key: "available_quantity", label: "Available Quantity" },
                ]}
                data={unrentedProducts.filter(product => 
                  productCategoriesFilter.length === 0 || 
                  productCategoriesFilter.includes(product.category)
                )}
                isLoading={isLoadingUnrented}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-8">
          {/* Pending Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Maintenance</CardTitle>
              <CardDescription>Products that need cleaning or maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "product_name", label: "Product" },
                  { 
                    key: "last_cleaned", 
                    label: "Last Cleaned",
                    formatter: (value) => formatDate(value)
                  },
                  { 
                    key: "next_cleaning_due", 
                    label: "Next Due",
                    formatter: (value) => formatDate(value)
                  },
                  { 
                    key: "status", 
                    label: "Status",
                    formatter: () => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )
                  },
                ]}
                data={pendingMaintenance}
                isLoading={isLoadingPending}
              />
            </CardContent>
          </Card>
          
          {/* Completed Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Maintenance</CardTitle>
              <CardDescription>Maintenance history of products</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "product_name", label: "Product" },
                  { 
                    key: "last_cleaned", 
                    label: "Cleaned On",
                    formatter: (value) => formatDate(value)
                  },
                  { 
                    key: "next_cleaning_due", 
                    label: "Next Due",
                    formatter: (value) => formatDate(value)
                  },
                  { 
                    key: "status", 
                    label: "Status",
                    formatter: () => (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    )
                  },
                ]}
                data={completedMaintenance}
                isLoading={isLoadingCompleted}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-8">
          {/* Top Revenue Products */}
          <Card>
            <CardHeader>
              <CardTitle>Highest Revenue Products</CardTitle>
              <CardDescription>Products generating the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Product Name" },
                  { key: "category", label: "Category" },
                  { key: "sub_category", label: "Subcategory" },
                  { 
                    key: "total_revenue", 
                    label: "Total Revenue",
                    formatter: (value) => `$${parseFloat(value).toFixed(2)}`
                  },
                  { 
                    key: "rental_price", 
                    label: "Price per Day",
                    formatter: (value) => `$${parseFloat(value).toFixed(2)}`
                  },
                ]}
                data={topRevenueProducts.filter(product => 
                  productCategoriesFilter.length === 0 || 
                  productCategoriesFilter.includes(product.category)
                )}
                isLoading={isLoadingTopRevenue}
              />
            </CardContent>
          </Card>
          
          {/* Revenue Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Total revenue breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would ideally be a chart component */}
                <div className="h-64 flex items-center justify-center bg-muted rounded-md">
                  Chart placeholder - Revenue by Category
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
                <CardDescription>Revenue trends over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would ideally be a chart component */}
                <div className="h-64 flex items-center justify-center bg-muted rounded-md">
                  Chart placeholder - Monthly Revenue
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="renters" className="space-y-8">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Renter Analysis</AlertTitle>
            <AlertDescription>
              This feature is coming soon. You'll be able to analyze renter behavior and preferences.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="owners" className="space-y-8">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Owner Analysis</AlertTitle>
            <AlertDescription>
              This feature is coming soon. You'll be able to analyze owner performance and product listings.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Custom SQL Query</CardTitle>
              <CardDescription>Run custom SQL queries to analyze your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea 
                  className="w-full h-40 p-4 border border-border rounded-md font-mono text-sm"
                  placeholder="SELECT * FROM products WHERE category = 'Electronics' LIMIT 10;"
                  disabled
                />
                <Button disabled>Execute Query</Button>
              </div>
              
              <div className="mt-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    Custom query functionality will be available in a future update. This will require admin privileges.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
