
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Fixed arithmetic operation issue by using proper date calculation
const calculateDateDifference = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const differenceInTime = endDate.getTime() - startDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return Math.round(differenceInDays);
};

export function DataQueriesPage() {
  const [activeTab, setActiveTab] = useState("renters");

  // Query 1: List of Renters
  const { data: renters = [], isLoading: rentersLoading } = useQuery({
    queryKey: ['data-queries', 'renters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email')
        .eq('role', 'renter');
        
      if (error) {
        toast.error('Error fetching renters: ' + error.message);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 2: Rental Pairs (Renter, Product, Owner)
  const { data: rentalPairs = [], isLoading: rentalPairsLoading } = useQuery({
    queryKey: ['data-queries', 'rental-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          rental_id,
          users!rentals_renter_id_fkey(name),
          products(name, users(name))
        `);
        
      if (error) {
        toast.error('Error fetching rental pairs: ' + error.message);
        throw error;
      }
      
      return data.map(item => ({
        rental_id: item.rental_id,
        renter_name: item.users?.name || 'Unknown',
        product_name: item.products?.name || 'Unknown',
        owner_name: item.products?.users?.name || 'Unknown'
      })) || [];
    }
  });

  // Query 3: Products Per Owner
  const { data: productsPerOwner = [], isLoading: productsPerOwnerLoading } = useQuery({
    queryKey: ['data-queries', 'products-per-owner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('owner_id, users!products_owner_id_fkey(name)');
        
      if (error) {
        toast.error('Error fetching products per owner: ' + error.message);
        throw error;
      }
      
      // Group by owner and count
      const ownerMap = new Map();
      data.forEach(item => {
        const ownerId = item.owner_id;
        const ownerName = item.users?.name || 'Unknown';
        
        if (!ownerMap.has(ownerId)) {
          ownerMap.set(ownerId, { owner_name: ownerName, total_products: 0 });
        }
        
        ownerMap.get(ownerId).total_products++;
      });
      
      return Array.from(ownerMap.values());
    }
  });

  // Query 4: Owners With More Than 2 Products
  const { data: ownersWithMany = [], isLoading: ownersWithManyLoading } = useQuery({
    queryKey: ['data-queries', 'owners-with-many'],
    queryFn: async () => {
      // Filter from previous query result
      return productsPerOwner.filter(owner => owner.total_products > 2);
    },
    enabled: !productsPerOwnerLoading && productsPerOwner.length > 0
  });

  // Query 5: Buyers With Above Average Spending
  const { data: highSpenders = [], isLoading: highSpendersLoading } = useQuery({
    queryKey: ['data-queries', 'high-spenders'],
    queryFn: async () => {
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('renter_id, total_cost');
        
      if (rentalsError) {
        toast.error('Error fetching rentals: ' + rentalsError.message);
        throw rentalsError;
      }
      
      // Calculate average spending
      const totalSpent = rentals.reduce((sum, rental) => sum + (rental.total_cost || 0), 0);
      const avgSpending = totalSpent / rentals.length;
      
      // Group by renter and calculate total spent
      const renterSpending = new Map();
      rentals.forEach(rental => {
        const renterId = rental.renter_id;
        const cost = rental.total_cost || 0;
        
        if (!renterSpending.has(renterId)) {
          renterSpending.set(renterId, 0);
        }
        
        renterSpending.set(renterId, renterSpending.get(renterId) + cost);
      });
      
      // Filter renters who spent more than average
      const highSpenderIds = Array.from(renterSpending.entries())
        .filter(([_, spent]) => spent > avgSpending)
        .map(([id, _]) => id);
      
      // Get user details for high spenders
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('name')
        .in('user_id', highSpenderIds);
        
      if (usersError) {
        toast.error('Error fetching high spenders: ' + usersError.message);
        throw usersError;
      }
      
      return users || [];
    }
  });

  // Query 6: Unrented Products
  const { data: unrentedProducts = [], isLoading: unrentedProductsLoading } = useQuery({
    queryKey: ['data-queries', 'unrented-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name')
        .not('product_id', 'in', supabase
          .from('rentals')
          .select('product_id')
        );
        
      if (error) {
        toast.error('Error fetching unrented products: ' + error.message);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 7: Average Rental Duration
  const { data: avgRentalDuration = [], isLoading: avgRentalDurationLoading } = useQuery({
    queryKey: ['data-queries', 'avg-rental-duration'],
    queryFn: async () => {
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('product_id, rental_start, rental_end');
        
      if (rentalsError) {
        toast.error('Error fetching rental durations: ' + rentalsError.message);
        throw rentalsError;
      }
      
      // Group rentals by product
      const productRentals = new Map();
      rentals.forEach(rental => {
        if (!rental.product_id || !rental.rental_start || !rental.rental_end) return;
        
        if (!productRentals.has(rental.product_id)) {
          productRentals.set(rental.product_id, []);
        }
        
        const duration = calculateDateDifference(rental.rental_start, rental.rental_end);
        productRentals.get(rental.product_id).push(duration);
      });
      
      // Calculate average duration for each product
      const productDurations = Array.from(productRentals.entries()).map(([productId, durations]) => {
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        return { product_id: productId, avg_duration: avgDuration };
      });
      
      // Get product names
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name')
        .in('product_id', productDurations.map(p => p.product_id));
        
      if (productsError) {
        toast.error('Error fetching product details: ' + productsError.message);
        throw productsError;
      }
      
      // Join product names with durations
      return productDurations.map(pd => {
        const product = products.find(p => p.product_id === pd.product_id);
        return {
          product_name: product?.name || 'Unknown',
          avg_duration: pd.avg_duration.toFixed(1)
        };
      });
    }
  });

  // Query 8: Top 5 Revenue Products
  const { data: topRevenueProducts = [], isLoading: topRevenueProductsLoading } = useQuery({
    queryKey: ['data-queries', 'top-revenue-products'],
    queryFn: async () => {
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('product_id, total_cost');
        
      if (rentalsError) {
        toast.error('Error fetching rental revenue: ' + rentalsError.message);
        throw rentalsError;
      }
      
      // Group rentals by product and calculate total revenue
      const productRevenue = new Map();
      rentals.forEach(rental => {
        if (!rental.product_id || !rental.total_cost) return;
        
        if (!productRevenue.has(rental.product_id)) {
          productRevenue.set(rental.product_id, 0);
        }
        
        productRevenue.set(rental.product_id, productRevenue.get(rental.product_id) + rental.total_cost);
      });
      
      // Get top 5 products by revenue
      const topProductIds = Array.from(productRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, _]) => id);
      
      // Get product names
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name')
        .in('product_id', topProductIds);
        
      if (productsError) {
        toast.error('Error fetching top revenue products: ' + productsError.message);
        throw productsError;
      }
      
      // Join product names with revenue
      return Array.from(productRevenue.entries())
        .filter(([id, _]) => topProductIds.includes(id))
        .map(([id, revenue]) => {
          const product = products.find(p => p.product_id === id);
          return {
            product_name: product?.name || 'Unknown',
            revenue: revenue
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    }
  });

  // Query 9: Products Above Category Avg Price
  const { data: aboveAvgProducts = [], isLoading: aboveAvgProductsLoading } = useQuery({
    queryKey: ['data-queries', 'above-avg-products'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category, rental_price');
        
      if (productsError) {
        toast.error('Error fetching products: ' + productsError.message);
        throw productsError;
      }
      
      // Calculate category averages
      const categoryPrices = new Map();
      products.forEach(product => {
        if (!product.category || !product.rental_price) return;
        
        if (!categoryPrices.has(product.category)) {
          categoryPrices.set(product.category, []);
        }
        
        categoryPrices.get(product.category).push(product.rental_price);
      });
      
      const categoryAvgs = new Map();
      categoryPrices.forEach((prices, category) => {
        const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        categoryAvgs.set(category, avg);
      });
      
      // Filter products above their category average
      return products
        .filter(product => 
          product.rental_price > (categoryAvgs.get(product.category) || 0)
        )
        .map(({ name, category, rental_price }) => ({ name, category, rental_price }));
    }
  });

  // Query 10: Sellers and Admins
  const { data: sellersAdmins = [], isLoading: sellersAdminsLoading } = useQuery({
    queryKey: ['data-queries', 'sellers-admins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('email, role')
        .in('role', ['owner', 'admin']);
        
      if (error) {
        toast.error('Error fetching sellers and admins: ' + error.message);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 11: Users with Role Labels
  const { data: usersWithRoles = [], isLoading: usersWithRolesLoading } = useQuery({
    queryKey: ['data-queries', 'users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, role');
        
      if (error) {
        toast.error('Error fetching users with roles: ' + error.message);
        throw error;
      }
      
      return data.map(user => ({
        name: user.name,
        role_label: user.role === 'renter' ? 'Customer' :
                   user.role === 'owner' ? 'Product Lister' :
                   user.role === 'admin' ? 'Administrator' : 
                   user.role === 'both' ? 'Customer & Product Lister' : 'Unknown'
      })) || [];
    }
  });

  // Query 12: Men's Tuxedo under $1500
  const { data: mensTuxedos = [], isLoading: mensTuxedosLoading } = useQuery({
    queryKey: ['data-queries', 'mens-tuxedos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'mens')
        .eq('sub_category', 'tuxedo')
        .lt('rental_price', 1500);
        
      if (error) {
        toast.error('Error fetching mens tuxedos: ' + error.message);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 13: Women's Products High Rating Low Price
  const { data: womensProducts = [], isLoading: womensProductsLoading } = useQuery({
    queryKey: ['data-queries', 'womens-products'],
    queryFn: async () => {
      // Get all womens products under $1300
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, rental_price')
        .eq('category', 'womens')
        .lt('rental_price', 1300);
        
      if (productsError) {
        toast.error('Error fetching womens products: ' + productsError.message);
        throw productsError;
      }
      
      // Get reviews for these products
      const productIds = products.map(p => p.product_id);
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
        
      if (reviewsError) {
        toast.error('Error fetching product reviews: ' + reviewsError.message);
        throw reviewsError;
      }
      
      // Calculate average ratings
      const productRatings = new Map();
      reviews.forEach(review => {
        if (!productRatings.has(review.product_id)) {
          productRatings.set(review.product_id, []);
        }
        
        productRatings.get(review.product_id).push(review.rating);
      });
      
      // Return products with avg rating >= 4
      return products
        .filter(product => {
          const ratings = productRatings.get(product.product_id) || [];
          if (ratings.length === 0) return false;
          
          const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          return avgRating >= 4;
        })
        .map(product => {
          const ratings = productRatings.get(product.product_id) || [];
          const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          
          return {
            ...product,
            avg_rating: avgRating.toFixed(1)
          };
        });
    }
  });

  // Query 14: Accessories cleaned last month with quantity > 3
  const { data: accessories = [], isLoading: accessoriesLoading } = useQuery({
    queryKey: ['data-queries', 'accessories'],
    queryFn: async () => {
      // Get date for last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startOfLastMonth = lastMonth.toISOString().split('T')[0];
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          available_quantity,
          maintenance(last_cleaned)
        `)
        .eq('category', 'accessories')
        .gt('available_quantity', 3);
        
      if (error) {
        toast.error('Error fetching accessories: ' + error.message);
        throw error;
      }
      
      // Filter for last month cleaned
      return data
        .filter(item => {
          const cleanDate = item.maintenance?.[0]?.last_cleaned;
          if (!cleanDate) return false;
          
          return cleanDate >= startOfLastMonth && cleanDate <= endOfLastMonth;
        })
        .map(item => ({
          product_id: item.product_id,
          name: item.name,
          available_quantity: item.available_quantity,
          last_cleaned: item.maintenance?.[0]?.last_cleaned
        })) || [];
    }
  });

  // Query 15: Mens/Womens Products by Rating
  const { data: productsByRating = [], isLoading: productsByRatingLoading } = useQuery({
    queryKey: ['data-queries', 'products-by-rating'],
    queryFn: async () => {
      // Get mens/womens products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category')
        .in('category', ['mens', 'womens']);
        
      if (productsError) {
        toast.error('Error fetching mens/womens products: ' + productsError.message);
        throw productsError;
      }
      
      // Get reviews for these products
      const productIds = products.map(p => p.product_id);
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
        
      if (reviewsError) {
        toast.error('Error fetching product reviews: ' + reviewsError.message);
        throw reviewsError;
      }
      
      // Calculate average ratings
      const productRatings = new Map();
      reviews.forEach(review => {
        if (!productRatings.has(review.product_id)) {
          productRatings.set(review.product_id, []);
        }
        
        productRatings.get(review.product_id).push(review.rating);
      });
      
      // Return products with ratings, sorted
      return products
        .map(product => {
          const ratings = productRatings.get(product.product_id) || [];
          const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : 0;
          
          return {
            ...product,
            avg_rating: avgRating
          };
        })
        .sort((a, b) => b.avg_rating - a.avg_rating);
    }
  });

  // Query 16: Users who are both sellers and renters
  const { data: sellerRenters = [], isLoading: sellerRentersLoading } = useQuery({
    queryKey: ['data-queries', 'seller-renters'],
    queryFn: async () => {
      // First approach: users with role 'both'
      const { data: bothUsers, error: bothError } = await supabase
        .from('users')
        .select('user_id, name, email')
        .eq('role', 'both');
        
      if (bothError) {
        toast.error('Error fetching users with both roles: ' + bothError.message);
        throw bothError;
      }
      
      // Get product counts for these users
      const userProductCounts = new Map();
      for (const user of bothUsers) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('product_id')
          .eq('owner_id', user.user_id);
          
        if (!productsError) {
          userProductCounts.set(user.user_id, products.length);
        }
      }
      
      // Get rental costs for these users
      const userRentalCosts = new Map();
      for (const user of bothUsers) {
        const { data: rentals, error: rentalsError } = await supabase
          .from('rentals')
          .select('total_cost')
          .eq('renter_id', user.user_id);
          
        if (!rentalsError) {
          const totalCost = rentals.reduce((sum, rental) => sum + (rental.total_cost || 0), 0);
          userRentalCosts.set(user.user_id, totalCost);
        }
      }
      
      // Filter and format results
      return bothUsers
        .filter(user => 
          (userProductCounts.get(user.user_id) || 0) > 2 &&
          (userRentalCosts.get(user.user_id) || 0) > 700
        )
        .map(user => ({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          total_products_listed: userProductCounts.get(user.user_id) || 0,
          total_spent_on_rentals: userRentalCosts.get(user.user_id) || 0
        }));
    }
  });

  // Loading state for all queries
  const isLoading = rentersLoading || rentalPairsLoading || productsPerOwnerLoading ||
                    ownersWithManyLoading || highSpendersLoading || unrentedProductsLoading ||
                    avgRentalDurationLoading || topRevenueProductsLoading || aboveAvgProductsLoading ||
                    sellersAdminsLoading || usersWithRolesLoading || mensTuxedosLoading ||
                    womensProductsLoading || accessoriesLoading || productsByRatingLoading ||
                    sellerRentersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Queries</h1>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Data
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-8">
          <TabsTrigger value="renters">Renters</TabsTrigger>
          <TabsTrigger value="rental-pairs">Rental Pairs</TabsTrigger>
          <TabsTrigger value="products-per-owner">Products/Owner</TabsTrigger>
          <TabsTrigger value="owners-with-many">Owners >2 Products</TabsTrigger>
          <TabsTrigger value="high-spenders">High Spenders</TabsTrigger>
          <TabsTrigger value="unrented">Unrented</TabsTrigger>
          <TabsTrigger value="avg-duration">Avg Duration</TabsTrigger>
          <TabsTrigger value="top-revenue">Top Revenue</TabsTrigger>
          <TabsTrigger value="above-avg-price">Above Avg Price</TabsTrigger>
          <TabsTrigger value="sellers-admins">Sellers & Admins</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
          <TabsTrigger value="mens-tuxedo">Mens Tuxedo</TabsTrigger>
          <TabsTrigger value="womens-rated">Womens Rated</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
          <TabsTrigger value="by-rating">By Rating</TabsTrigger>
          <TabsTrigger value="seller-renters">Seller-Renters</TabsTrigger>
        </TabsList>
        
        <TabsContent value="renters">
          <DataTable
            title="List of Renters"
            description="All users who can rent products"
            columns={[
              { key: 'user_id', label: 'User ID' },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' }
            ]}
            data={renters}
          />
        </TabsContent>
        
        <TabsContent value="rental-pairs">
          <DataTable
            title="Rental Pairs"
            description="Relationships between renters, products, and owners"
            columns={[
              { key: 'rental_id', label: 'Rental ID' },
              { key: 'renter_name', label: 'Renter' },
              { key: 'product_name', label: 'Product' },
              { key: 'owner_name', label: 'Owner' }
            ]}
            data={rentalPairs}
          />
        </TabsContent>
        
        <TabsContent value="products-per-owner">
          <DataTable
            title="Products Per Owner"
            description="Number of products each user is renting out"
            columns={[
              { key: 'owner_name', label: 'Owner' },
              { key: 'total_products', label: 'Total Products' }
            ]}
            data={productsPerOwner}
          />
        </TabsContent>
        
        <TabsContent value="owners-with-many">
          <DataTable
            title="Owners With >2 Products"
            description="Users who own more than 2 products"
            columns={[
              { key: 'owner_name', label: 'Owner' },
              { key: 'total_products', label: 'Total Products' }
            ]}
            data={ownersWithMany}
          />
        </TabsContent>
        
        <TabsContent value="high-spenders">
          <DataTable
            title="High Spenders"
            description="Buyers with above average spending"
            columns={[
              { key: 'name', label: 'Name' }
            ]}
            data={highSpenders}
          />
        </TabsContent>
        
        <TabsContent value="unrented">
          <DataTable
            title="Unrented Products"
            description="Products that have never been rented"
            columns={[
              { key: 'product_id', label: 'Product ID' },
              { key: 'name', label: 'Product Name' }
            ]}
            data={unrentedProducts}
          />
        </TabsContent>
        
        <TabsContent value="avg-duration">
          <DataTable
            title="Average Rental Duration"
            description="Average days each product is rented for"
            columns={[
              { key: 'product_name', label: 'Product' },
              { key: 'avg_duration', label: 'Avg. Duration (Days)' }
            ]}
            data={avgRentalDuration}
          />
        </TabsContent>
        
        <TabsContent value="top-revenue">
          <DataTable
            title="Top 5 Revenue Products"
            description="Products generating the most revenue"
            columns={[
              { key: 'product_name', label: 'Product' },
              { key: 'revenue', label: 'Revenue ($)' }
            ]}
            data={topRevenueProducts}
          />
        </TabsContent>
        
        <TabsContent value="above-avg-price">
          <DataTable
            title="Above Average Price"
            description="Products priced higher than their category average"
            columns={[
              { key: 'name', label: 'Product' },
              { key: 'category', label: 'Category' },
              { key: 'rental_price', label: 'Rental Price ($)' }
            ]}
            data={aboveAvgProducts}
          />
        </TabsContent>
        
        <TabsContent value="sellers-admins">
          <DataTable
            title="Sellers and Admins"
            description="Email addresses of all sellers and administrators"
            columns={[
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' }
            ]}
            data={sellersAdmins}
          />
        </TabsContent>
        
        <TabsContent value="user-roles">
          <DataTable
            title="User Roles"
            description="Users with human-readable role labels"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'role_label', label: 'Role' }
            ]}
            data={usersWithRoles}
          />
        </TabsContent>
        
        <TabsContent value="mens-tuxedo">
          <DataTable
            title="Men's Tuxedo Under $1500"
            description="Affordable tuxedo rental options"
            columns={[
              { key: 'product_id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'rental_price', label: 'Price ($)' }
            ]}
            data={mensTuxedos}
          />
        </TabsContent>
        
        <TabsContent value="womens-rated">
          <DataTable
            title="Women's Products - High Rating, Low Price"
            description="Women's products under $1300 with 4+ star ratings"
            columns={[
              { key: 'product_id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'rental_price', label: 'Price ($)' },
              { key: 'avg_rating', label: 'Rating' }
            ]}
            data={womensProducts}
          />
        </TabsContent>
        
        <TabsContent value="accessories">
          <DataTable
            title="Accessories - Stock > 3, Recently Cleaned"
            description="Accessories with good availability and recent maintenance"
            columns={[
              { key: 'product_id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'available_quantity', label: 'Quantity' },
              { key: 'last_cleaned', label: 'Cleaned Date' }
            ]}
            data={accessories}
          />
        </TabsContent>
        
        <TabsContent value="by-rating">
          <DataTable
            title="Mens/Womens Products by Rating"
            description="Clothing items sorted by customer ratings"
            columns={[
              { key: 'product_id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category' },
              { key: 'avg_rating', label: 'Avg. Rating' }
            ]}
            data={productsByRating.map(product => ({
              ...product,
              avg_rating: product.avg_rating.toFixed(1)
            }))}
          />
        </TabsContent>
        
        <TabsContent value="seller-renters">
          <DataTable
            title="Sellers Who Are Also Renters"
            description="Users who list 3+ items and spent >$700 on rentals"
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'total_products_listed', label: 'Products Listed' },
              { key: 'total_spent_on_rentals', label: 'Total Spent ($)' }
            ]}
            data={sellerRenters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
