
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Define explicit types for our DataTable columns to include formatter
interface DataTableColumn {
  key: string;
  label: string;
}

// Define product types to fix TypeScript errors
interface Product {
  product_id: number;
  name: string;
  category: string;
  sub_category: string;
  rental_price: number | string;
  available_quantity?: number;
  owner_id?: number;
}

interface MaintenanceRecord {
  maintenance_id: number;
  product_id: number;
  product_name: string;
  last_cleaned: string;
  next_cleaning_due: string;
  status: string;
  products?: {
    name: string;
  };
}

interface TopRentedProduct extends Product {
  rental_count: number;
}

interface TopRevenueProduct extends Product {
  total_revenue: number | string;
}

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
      
      // Manually get unique categories
      const uniqueCategories: {category: string}[] = [];
      const categories = new Set<string>();
      
      data.forEach(item => {
        if (item.category && !categories.has(item.category)) {
          categories.add(item.category);
          uniqueCategories.push({ category: item.category });
        }
      });
      
      return uniqueCategories;
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
      const uniqueSubCategories: {sub_category: string}[] = [];
      const subCategories = new Set<string>();
      
      data.forEach(item => {
        if (item.sub_category && !subCategories.has(item.sub_category)) {
          subCategories.add(item.sub_category);
          uniqueSubCategories.push({ sub_category: item.sub_category });
        }
      });
      
      return uniqueSubCategories;
    }
  });
  
  // Products with highest rental count
  const { data: topRentedProducts = [], isLoading: isLoadingTopRented } = useQuery<TopRentedProduct[]>({
    queryKey: ['topRentedProducts'],
    queryFn: async () => {
      try {
        // Use the SQL function get_top_rented_products
        const { data, error } = await supabase
          .rpc('get_top_rented_products', { limit_count: 10 });
        
        if (error) {
          toast.error(`Error fetching top rented products: ${error.message}`);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in topRentedProducts query:", error);
        return [];
      }
    }
  });
  
  // Products with highest revenue
  const { data: topRevenueProducts = [], isLoading: isLoadingTopRevenue } = useQuery<TopRevenueProduct[]>({
    queryKey: ['topRevenueProducts'],
    queryFn: async () => {
      try {
        // Use the SQL function get_top_revenue_products
        const { data, error } = await supabase
          .rpc('get_top_revenue_products', { limit_count: 10 });
        
        if (error) {
          toast.error(`Error fetching top revenue products: ${error.message}`);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in topRevenueProducts query:", error);
        return [];
      }
    }
  });
  
  // Products that have never been rented
  const { data: unrentedProducts = [], isLoading: isLoadingUnrented } = useQuery<Product[]>({
    queryKey: ['unrentedProducts'],
    queryFn: async () => {
      try {
        // Use the SQL function get_unrented_products
        const { data, error } = await supabase
          .rpc('get_unrented_products');
        
        if (error) {
          toast.error(`Error fetching unrented products: ${error.message}`);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in unrentedProducts query:", error);
        return [];
      }
    }
  });
  
  // Query for maintenance records of specific status
  const getMaintenanceByStatus = (status: string) => {
    return useQuery<MaintenanceRecord[]>({
      queryKey: ['maintenance', status],
      queryFn: async () => {
        try {
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
        } catch (error) {
          console.error(`Error in ${status} maintenance query:`, error);
          return [];
        }
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
                  { key: "rental_price", label: "Price per Day" }
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
                  { key: "available_quantity", label: "Available Quantity" }
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
                  { key: "last_cleaned", label: "Last Cleaned" },
                  { key: "next_cleaning_due", label: "Next Due" },
                  { key: "status", label: "Status" }
                ]}
                data={pendingMaintenance.map(item => ({
                  ...item,
                  last_cleaned: formatDate(item.last_cleaned),
                  next_cleaning_due: formatDate(item.next_cleaning_due),
                  status: "Pending"
                }))}
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
                  { key: "last_cleaned", label: "Cleaned On" },
                  { key: "next_cleaning_due", label: "Next Due" },
                  { key: "status", label: "Status" }
                ]}
                data={completedMaintenance.map(item => ({
                  ...item,
                  last_cleaned: formatDate(item.last_cleaned),
                  next_cleaning_due: formatDate(item.next_cleaning_due),
                  status: "Completed"
                }))}
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
                  { key: "total_revenue", label: "Total Revenue" },
                  { key: "rental_price", label: "Price per Day" }
                ]}
                data={topRevenueProducts.map(product => ({
                  ...product,
                  total_revenue: typeof product.total_revenue === 'number' ? 
                    `$${product.total_revenue.toFixed(2)}` : product.total_revenue,
                  rental_price: typeof product.rental_price === 'number' ? 
                    `$${product.rental_price.toFixed(2)}` : product.rental_price
                })).filter(product => 
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
