
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Type definitions for our query results
interface RenterData {
  name: string;
  email: string;
  phone: string;
  rental_count: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
}

interface SubcategoryDistribution {
  sub_category: string;
  count: number;
}

interface AvgRentalDuration {
  category: string;
  avg_duration_days: number;
}

interface TopRevenue {
  name: string;
  category: string;
  total_revenue: number;
}

interface SellerAdminEmails {
  email: string;
  role: string;
}

interface RatedProduct {
  name: string;
  category: string;
  avg_rating: number;
}

export function DataQueriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Query to get top renters
  const { data: topRenters = [], isLoading: isLoadingRenters } = useQuery({
    queryKey: ['topRenters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          renter_id,
          users!rentals_renter_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('renter_id');
      
      if (error) throw error;
      
      // Count rentals per user and format the data
      const renterCounts: Record<string, RenterData> = {};
      
      data.forEach((rental: any) => {
        const renterId = rental.renter_id;
        const renterInfo = rental.users;
        
        if (!renterCounts[renterId]) {
          renterCounts[renterId] = {
            name: renterInfo.name,
            email: renterInfo.email,
            phone: renterInfo.phone,
            rental_count: 1
          };
        } else {
          renterCounts[renterId].rental_count++;
        }
      });
      
      return Object.values(renterCounts).sort((a, b) => b.rental_count - a.rental_count);
    }
  });
  
  // Query to get category distribution
  const { data: categoryDistribution = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categoryDistribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');
      
      if (error) throw error;
      
      // Count products per category
      const categoryCounts: Record<string, number> = {};
      
      data.forEach((product: any) => {
        const category = product.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));
    }
  });
  
  // Query to get subcategory distribution for the selected category
  const { data: subcategoryDistribution = [], isLoading: isLoadingSubcategories } = useQuery({
    queryKey: ['subcategoryDistribution', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('sub_category')
        .eq('category', selectedCategory)
        .order('sub_category');
      
      if (error) throw error;
      
      // Count products per subcategory
      const subcategoryCounts: Record<string, number> = {};
      
      if (data) {
        data.forEach((product: any) => {
          const subcategory = product.sub_category;
          subcategoryCounts[subcategory] = (subcategoryCounts[subcategory] || 0) + 1;
        });
      }
      
      return Object.entries(subcategoryCounts).map(([sub_category, count]) => ({
        sub_category,
        count
      }));
    },
    enabled: !!selectedCategory
  });
  
  // Query to get average rental duration by category
  const { data: avgRentalDuration = [], isLoading: isLoadingRentalDuration } = useQuery({
    queryKey: ['avgRentalDuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          rental_start,
          rental_end,
          products (
            category
          )
        `);
      
      if (error) throw error;
      
      // Calculate average rental duration per category
      const categoryDurations: Record<string, { sum: number; count: number }> = {};
      
      data.forEach((rental: any) => {
        const category = rental.products?.category;
        if (!category) return;
        
        const startDate = new Date(rental.rental_start);
        const endDate = new Date(rental.rental_end);
        const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
        
        if (!categoryDurations[category]) {
          categoryDurations[category] = { sum: durationDays, count: 1 };
        } else {
          categoryDurations[category].sum += durationDays;
          categoryDurations[category].count += 1;
        }
      });
      
      return Object.entries(categoryDurations).map(([category, values]) => ({
        category,
        avg_duration_days: parseFloat((values.sum / values.count).toFixed(1))
      }));
    }
  });
  
  // Query to get top revenue generating products
  const { data: topRevenue = [], isLoading: isLoadingTopRevenue } = useQuery({
    queryKey: ['topRevenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          total_cost,
          products (
            name,
            category
          )
        `);
      
      if (error) throw error;
      
      // Calculate total revenue per product
      const productRevenue: Record<string, TopRevenue> = {};
      
      data.forEach((rental: any) => {
        const productName = rental.products?.name;
        const category = rental.products?.category;
        
        if (!productName) return;
        
        const key = `${productName}-${category}`;
        
        if (!productRevenue[key]) {
          productRevenue[key] = {
            name: productName,
            category: category || 'Unknown',
            total_revenue: parseFloat(rental.total_cost) || 0
          };
        } else {
          productRevenue[key].total_revenue += parseFloat(rental.total_cost) || 0;
        }
      });
      
      return Object.values(productRevenue)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    }
  });
  
  // Query to get products above average price
  const { data: aboveAvgPrice = [], isLoading: isLoadingAboveAvgPrice } = useQuery({
    queryKey: ['aboveAvgPrice'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;
      
      // Calculate average price
      let totalPrice = 0;
      products.forEach((product: any) => {
        totalPrice += parseFloat(product.rental_price) || 0;
      });
      const avgPrice = totalPrice / products.length;
      
      // Filter products above average price
      return products
        .filter((product: any) => parseFloat(product.rental_price) > avgPrice)
        .sort((a: any, b: any) => parseFloat(b.rental_price) - parseFloat(a.rental_price));
    }
  });
  
  // Query to get sellers and admins
  const { data: sellersAdmins = [], isLoading: isLoadingSellersAdmins } = useQuery({
    queryKey: ['sellersAdmins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('email, role')
        .in('role', ['owner', 'admin']);
      
      if (error) throw error;
      
      return data;
    }
  });
  
  // Query for aggregated user roles
  const { data: roleLabels = [], isLoading: isLoadingRoleLabels } = useQuery({
    queryKey: ['roleLabels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role');
      
      if (error) throw error;
      
      // Count users per role
      const roleCounts: Record<string, number> = {};
      
      data.forEach((user: any) => {
        const role = user.role;
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      return Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count
      }));
    }
  });
  
  // Query for affordable tuxedos
  const { data: affordableTuxedos = [], isLoading: isLoadingAffordableTuxedos } = useQuery({
    queryKey: ['affordableTuxedos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_owner_id_fkey (
            name
          )
        `)
        .eq('sub_category', 'Tuxedo')
        .lt('rental_price', 100)
        .order('rental_price');
      
      if (error) throw error;
      
      return data;
    }
  });
  
  // Query for high-quality women's products
  const { data: qualityWomens = [], isLoading: isLoadingQualityWomens } = useQuery({
    queryKey: ['qualityWomens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_owner_id_fkey (
            name
          ),
          reviews!inner (
            rating
          )
        `)
        .eq('category', 'Women\'s Clothing')
        .order('rental_price');
      
      if (error) throw error;
      
      // Filter for products with average rating >= 4
      const productsWithAvgRating = data.map((product: any) => {
        const ratings = product.reviews.map((review: any) => review.rating);
        const avgRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
        
        return {
          ...product,
          avg_rating: parseFloat(avgRating.toFixed(1))
        };
      }).filter((product: any) => product.avg_rating >= 4);
      
      return productsWithAvgRating;
    }
  });
  
  // Query for clean accessories
  const { data: cleanAccessories = [], isLoading: isLoadingCleanAccessories } = useQuery({
    queryKey: ['cleanAccessories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_owner_id_fkey (
            name
          ),
          maintenance!inner (
            last_cleaned
          )
        `)
        .eq('category', 'Accessories')
        .gt('available_quantity', 3);
      
      if (error) throw error;
      
      // Filter for products cleaned in the last month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      return data.filter((product: any) => {
        const lastCleaned = new Date(product.maintenance[0].last_cleaned);
        return lastCleaned > oneMonthAgo;
      });
    }
  });
  
  // Query for products with ratings
  const { data: ratedProducts = [], isLoading: isLoadingRatedProducts } = useQuery({
    queryKey: ['ratedProducts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          name,
          category,
          reviews (
            rating
          )
        `)
        .not('reviews', 'is', null);
      
      if (error) throw error;
      
      // Calculate average rating for each product
      return data.map((product: any) => {
        const ratings = product.reviews.map((review: any) => review.rating);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
          : 0;
        
        return {
          name: product.name,
          category: product.category,
          avg_rating: parseFloat(avgRating.toFixed(1))
        };
      }).filter((product: any) => product.avg_rating > 0)
        .sort((a: any, b: any) => b.avg_rating - a.avg_rating);
    }
  });
  
  // Query for users who are both buyers and sellers
  const { data: buyersSellers = [], isLoading: isLoadingBuyersSellers } = useQuery({
    queryKey: ['buyersSellers'],
    queryFn: async () => {
      // Get all users who have rented products
      const { data: renters, error: rentersError } = await supabase
        .from('rentals')
        .select('renter_id')
        .distinct();
      
      if (rentersError) throw rentersError;
      
      // Get all users who have products listed
      const { data: owners, error: ownersError } = await supabase
        .from('products')
        .select('owner_id')
        .distinct();
      
      if (ownersError) throw ownersError;
      
      // Find users who are both renters and owners
      const renterIds = renters.map((r: any) => r.renter_id);
      const ownerIds = owners.map((o: any) => o.owner_id);
      
      const bothIds = renterIds.filter((id: number) => ownerIds.includes(id));
      
      // Get user details
      if (bothIds.length === 0) return [];
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('user_id', bothIds);
      
      if (usersError) throw usersError;
      
      return users;
    }
  });
  
  // Chart data transformations
  const categoryColors = [
    '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
    '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090',
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83A6ED'];
  
  // Format role labels data for pie chart
  const roleLabelsForChart = roleLabels.map((item: any, index: number) => ({
    name: item.role,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));
  
  const handleCategoryClick = (data: any) => {
    setSelectedCategory(data.category);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Queries & Analytics</h1>
          <p className="text-muted-foreground">Explore complex data relationships and insights</p>
        </div>
      </div>
      
      <Tabs defaultValue="renters">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <TabsTrigger value="renters">Top Renters</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="avg-rental-duration">Avg Rental Duration</TabsTrigger>
          <TabsTrigger value="top-revenue">Top Revenue</TabsTrigger>
          <TabsTrigger value="above-avg-price">Above Avg Price</TabsTrigger>
          <TabsTrigger value="sellers-admins">Sellers &amp; Admins</TabsTrigger>
          <TabsTrigger value="role-labels">Role Labels</TabsTrigger>
          <TabsTrigger value="affordable-tuxedos">Affordable Tuxedos</TabsTrigger>
          <TabsTrigger value="quality-womens">Quality Women's</TabsTrigger>
          <TabsTrigger value="clean-accessories">Clean Accessories</TabsTrigger>
          <TabsTrigger value="rated-products">Rated Products</TabsTrigger>
          <TabsTrigger value="buyers-sellers">Buyers &amp; Sellers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="renters" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Renters by Rental Count</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Top Renters"
                description="Users who rent the most products"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'rental_count', label: 'Rentals' },
                ]}
                data={topRenters}
                isLoading={isLoadingRenters}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Categories Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryDistribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Number of Products" 
                      fill="#8884d8" 
                      onClick={handleCategoryClick}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Click on a category to view subcategories
                </p>
              </div>
              
              <div className="w-full md:w-1/2">
                {selectedCategory ? (
                  <>
                    <h4 className="font-semibold mb-4">Subcategories in {selectedCategory}</h4>
                    {isLoadingSubcategories ? (
                      <div className="flex items-center justify-center h-40">
                        <p>Loading subcategories...</p>
                      </div>
                    ) : subcategoryDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={subcategoryDistribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sub_category" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="count" 
                            name="Number of Products" 
                            fill="#82ca9d" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-40">
                        <p>No subcategories found for {selectedCategory}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p>Select a category to view subcategories</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avg-rental-duration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Rental Duration by Category (Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={avgRentalDuration} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="avg_duration_days" 
                    name="Average Days" 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Revenue Generating Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="total_revenue" 
                    name="Total Revenue ($)" 
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="above-avg-price" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Products Above Average Price</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Premium Products"
                description="Products with rental prices above the average"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'category', label: 'Category' },
                  { key: 'sub_category', label: 'Subcategory' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'available_quantity', label: 'Quantity' },
                ]}
                data={aboveAvgPrice}
                isLoading={isLoadingAboveAvgPrice}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sellers-admins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sellers and Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Sellers &amp; Admin Emails"
                description="Email addresses of all sellers and administrators"
                columns={[
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' },
                ]}
                data={sellersAdmins}
                isLoading={isLoadingSellersAdmins}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="role-labels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={roleLabelsForChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleLabelsForChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affordable-tuxedos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Affordable Tuxedo Listings (Under $100)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Affordable Tuxedos"
                description="Tuxedo rentals available for less than $100"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'users.name', label: 'Owner' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'available_quantity', label: 'Quantity' },
                ]}
                data={affordableTuxedos}
                isLoading={isLoadingAffordableTuxedos}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quality-womens" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Women's Products with High Ratings &amp; Low Price</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Quality Women's Clothing"
                description="Women's clothing with ratings of 4+ stars"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'users.name', label: 'Owner' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'avg_rating', label: 'Rating' },
                  { key: 'available_quantity', label: 'Quantity' },
                ]}
                data={qualityWomens}
                isLoading={isLoadingQualityWomens}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clean-accessories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessories (Quantity &gt; 3 &amp; Cleaned Last Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Recently Cleaned Accessories"
                description="Accessories with good availability and recent cleaning"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'users.name', label: 'Owner' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'available_quantity', label: 'Quantity' },
                  { key: 'maintenance[0].last_cleaned', label: 'Last Cleaned' },
                ]}
                data={cleanAccessories}
                isLoading={isLoadingCleanAccessories}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rated-products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Products by Customer Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Rated Products"
                description="Products sorted by average customer rating"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'category', label: 'Category' },
                  { key: 'avg_rating', label: 'Avg Rating' },
                ]}
                data={ratedProducts}
                isLoading={isLoadingRatedProducts}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="buyers-sellers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Users Who Both Rent and List Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Buyers &amp; Sellers"
                description="Users who both rent products and list their own products"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'role', label: 'Role' },
                ]}
                data={buyersSellers}
                isLoading={isLoadingBuyersSellers}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
