
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function DataQueriesPage() {
  const [activeTab, setActiveTab] = useState("renters");
  
  // Query 1: List of Renters
  const { data: renters = [], isLoading: rentersLoading, error: rentersError } = useQuery({
    queryKey: ['renters-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email')
        .eq('role', 'renter');
        
      if (error) {
        toast.error(`Error fetching renters: ${error.message}`);
        throw error;
      }
      return data || [];
    }
  });

  // Query 2: Rental Pairs (Renter, Product, Owner)
  const { data: rentalPairs = [], isLoading: rentalPairsLoading, error: rentalPairsError } = useQuery({
    queryKey: ['rental-pairs-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          rental_id,
          users!rentals_renter_id_fkey (name),
          products!rentals_product_id_fkey (
            name,
            users!products_owner_id_fkey (name)
          )
        `);
        
      if (error) {
        toast.error(`Error fetching rental pairs: ${error.message}`);
        throw error;
      }
      
      // Transform data to match expected format
      return data?.map(rental => ({
        rental_id: rental.rental_id,
        renter_name: rental.users?.name || 'Unknown Renter',
        product_name: rental.products?.name || 'Unknown Product',
        owner_name: rental.products?.users?.name || 'Unknown Owner'
      })) || [];
    }
  });

  // Query 3: Products Count by Owner
  const { data: productsByOwner = [], isLoading: productsByOwnerLoading, error: productsByOwnerError } = useQuery({
    queryKey: ['products-by-owner-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('count_products_by_owner');
        
      if (error) {
        // Try alternative approach if RPC fails
        const { data: altData, error: altError } = await supabase
          .from('products')
          .select(`
            owner_id,
            users!products_owner_id_fkey (name)
          `);
          
        if (altError) {
          toast.error(`Error fetching product counts: ${altError.message}`);
          throw altError;
        }
        
        // Group by owner and count products
        const counts = altData?.reduce((acc, product) => {
          const ownerName = product.users?.name || 'Unknown';
          acc[ownerName] = (acc[ownerName] || 0) + 1;
          return acc;
        }, {});
        
        return Object.entries(counts || {}).map(([owner_name, total_products]) => ({
          owner_name,
          total_products
        }));
      }
      
      return data || [];
    }
  });

  // Query 4: Owners with More Than 2 Products
  const { data: ownersWithManyProducts = [], isLoading: ownersWithManyProductsLoading, error: ownersWithManyProductsError } = useQuery({
    queryKey: ['owners-with-many-products-query'],
    queryFn: async () => {
      // First try with all results and filter client-side
      const { data, error } = await supabase
        .rpc('count_products_by_owner');
        
      if (error) {
        // Try alternative approach if RPC fails
        const { data: altData, error: altError } = await supabase
          .from('products')
          .select(`
            owner_id,
            users!products_owner_id_fkey (name)
          `);
          
        if (altError) {
          toast.error(`Error fetching owners with many products: ${altError.message}`);
          throw altError;
        }
        
        // Group by owner and count products
        const counts = {};
        altData?.forEach(product => {
          const ownerName = product.users?.name || 'Unknown';
          counts[ownerName] = (counts[ownerName] || 0) + 1;
        });
        
        return Object.entries(counts || {})
          .filter(([_, count]) => (count as number) > 2)
          .map(([owner_name, total_products]) => ({
            owner_name,
            total_products
          }));
      }
      
      return data?.filter(item => item.total_products > 2) || [];
    }
  });

  // Query 5: Buyers Who Spent More Than Average
  const { data: bigSpenders = [], isLoading: bigSpendersLoading, error: bigSpendersError } = useQuery({
    queryKey: ['big-spenders-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_above_average_spenders');
        
      if (error) {
        toast.error(`Error fetching big spenders: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 6: Unrented Products
  const { data: unrentedProducts = [], isLoading: unrentedProductsLoading, error: unrentedProductsError } = useQuery({
    queryKey: ['unrented-products-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name
        `)
        .not('product_id', 'in', supabase
          .from('rentals')
          .select('product_id')
        );
        
      if (error) {
        toast.error(`Error fetching unrented products: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 7: Average Rental Duration by Product
  const { data: avgRentalDurations = [], isLoading: avgRentalDurationsLoading, error: avgRentalDurationsError } = useQuery({
    queryKey: ['avg-rental-durations-query'],
    queryFn: async () => {
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          rental_id,
          product_id,
          rental_start,
          rental_end,
          products (name)
        `);
        
      if (rentalsError) {
        toast.error(`Error fetching rental durations: ${rentalsError.message}`);
        throw rentalsError;
      }
      
      // Calculate durations manually
      const productDurations = {};
      rentals?.forEach(rental => {
        if (!rental.rental_start || !rental.rental_end || !rental.products) return;
        
        // Calculate days difference
        const startDate = new Date(rental.rental_start);
        const endDate = new Date(rental.rental_end);
        const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const productName = rental.products.name;
        if (!productDurations[productName]) {
          productDurations[productName] = { sum: 0, count: 0 };
        }
        
        productDurations[productName].sum += durationDays;
        productDurations[productName].count += 1;
      });
      
      return Object.entries(productDurations).map(([product_name, data]) => ({
        product_name,
        avg_duration: (data.sum / data.count).toFixed(1)
      }));
    }
  });

  // Query 8: Top 5 Revenue Generating Products
  const { data: topRevenueProducts = [], isLoading: topRevenueProductsLoading, error: topRevenueProductsError } = useQuery({
    queryKey: ['top-revenue-products-query'],
    queryFn: async () => {
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          product_id,
          total_cost,
          products (name)
        `);
        
      if (rentalsError) {
        toast.error(`Error fetching revenue data: ${rentalsError.message}`);
        throw rentalsError;
      }
      
      // Calculate revenue by product
      const productRevenue = {};
      rentals?.forEach(rental => {
        if (!rental.products || !rental.total_cost) return;
        
        const productName = rental.products.name;
        productRevenue[productName] = (productRevenue[productName] || 0) + rental.total_cost;
      });
      
      // Sort and limit to top 5
      return Object.entries(productRevenue)
        .map(([product_name, revenue]) => ({ product_name, revenue: Number(revenue).toFixed(2) }))
        .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
        .slice(0, 5);
    }
  });

  // Query 9: Products with Above-Average Price in Category
  const { data: aboveAvgPriceProducts = [], isLoading: aboveAvgPriceProductsLoading, error: aboveAvgPriceProductsError } = useQuery({
    queryKey: ['above-avg-price-products-query'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category, rental_price');
        
      if (productsError) {
        toast.error(`Error fetching products for price comparison: ${productsError.message}`);
        throw productsError;
      }
      
      // Calculate average prices by category
      const categoryAverages = {};
      products?.forEach(product => {
        if (!categoryAverages[product.category]) {
          categoryAverages[product.category] = { sum: 0, count: 0 };
        }
        categoryAverages[product.category].sum += product.rental_price;
        categoryAverages[product.category].count += 1;
      });
      
      Object.keys(categoryAverages).forEach(category => {
        categoryAverages[category] = categoryAverages[category].sum / categoryAverages[category].count;
      });
      
      // Filter products above their category average
      return products?.filter(product => 
        product.rental_price > categoryAverages[product.category]
      ) || [];
    }
  });

  // Query 10: Sellers and Admins Emails
  const { data: sellersAndAdmins = [], isLoading: sellersAndAdminsLoading, error: sellersAndAdminsError } = useQuery({
    queryKey: ['sellers-and-admins-query'],
    queryFn: async () => {
      const { data: sellers, error: sellersError } = await supabase
        .from('users')
        .select('email, role')
        .eq('role', 'owner');
        
      if (sellersError) {
        toast.error(`Error fetching sellers: ${sellersError.message}`);
        throw sellersError;
      }
      
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('email, role')
        .eq('role', 'admin');
        
      if (adminsError) {
        toast.error(`Error fetching admins: ${adminsError.message}`);
        throw adminsError;
      }
      
      return [...(sellers || []), ...(admins || [])];
    }
  });

  // Query 11: Users With Role Labels
  const { data: usersWithRoleLabels = [], isLoading: usersWithRoleLabelsLoading, error: usersWithRoleLabelsError } = useQuery({
    queryKey: ['users-with-role-labels-query'],
    queryFn: async () => {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('name, role');
        
      if (usersError) {
        toast.error(`Error fetching users with roles: ${usersError.message}`);
        throw usersError;
      }
      
      return users?.map(user => {
        let role_label = 'Unknown';
        switch (user.role) {
          case 'renter':
            role_label = 'Customer';
            break;
          case 'owner':
            role_label = 'Product Lister';
            break;
          case 'admin':
            role_label = 'Administrator';
            break;
        }
        
        return {
          name: user.name,
          role_label
        };
      }) || [];
    }
  });

  // Query 12: Mens Tuxedo Under ₹1500
  const { data: affordableTuxedos = [], isLoading: affordableTuxedosLoading, error: affordableTuxedosError } = useQuery({
    queryKey: ['affordable-tuxedos-query'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'mens')
        .eq('sub_category', 'tuxedo')
        .lt('rental_price', 1500);
        
      if (error) {
        toast.error(`Error fetching affordable tuxedos: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });

  // Query 13: Women's Products with High Ratings and Low Price
  const { data: qualityWomensProducts = [], isLoading: qualityWomensProductsLoading, error: qualityWomensProductsError } = useQuery({
    queryKey: ['quality-womens-products-query'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, rental_price, category')
        .eq('category', 'womens')
        .lt('rental_price', 1300);
        
      if (productsError) {
        toast.error(`Error fetching womens products: ${productsError.message}`);
        throw productsError;
      }
      
      const productIds = products?.map(p => p.product_id) || [];
      
      if (productIds.length === 0) {
        return [];
      }
      
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
        
      if (reviewsError) {
        toast.error(`Error fetching product ratings: ${reviewsError.message}`);
        throw reviewsError;
      }
      
      // Calculate average ratings
      const ratingsByProduct = {};
      reviews?.forEach(review => {
        if (!ratingsByProduct[review.product_id]) {
          ratingsByProduct[review.product_id] = { sum: 0, count: 0 };
        }
        ratingsByProduct[review.product_id].sum += review.rating;
        ratingsByProduct[review.product_id].count += 1;
      });
      
      // Filter products with avg rating >= 4
      return products?.filter(product => {
        const rating = ratingsByProduct[product.product_id];
        if (!rating) return false;
        
        const avgRating = rating.sum / rating.count;
        return avgRating >= 4;
      }).map(product => ({
        ...product,
        avg_rating: ratingsByProduct[product.product_id] 
          ? (ratingsByProduct[product.product_id].sum / ratingsByProduct[product.product_id].count).toFixed(1)
          : 'N/A'
      })) || [];
    }
  });

  // Query 14: Accessories (Quantity >3 & Cleaned Last Month)
  const { data: cleanAccessories = [], isLoading: cleanAccessoriesLoading, error: cleanAccessoriesError } = useQuery({
    queryKey: ['clean-accessories-query'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, available_quantity, category')
        .eq('category', 'accessories')
        .gt('available_quantity', 3);
        
      if (productsError) {
        toast.error(`Error fetching accessories: ${productsError.message}`);
        throw productsError;
      }
      
      const productIds = products?.map(p => p.product_id) || [];
      
      if (productIds.length === 0) {
        return [];
      }
      
      // Get current date and calculate last month
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('product_id, last_cleaned')
        .in('product_id', productIds);
        
      if (maintenanceError) {
        toast.error(`Error fetching maintenance records: ${maintenanceError.message}`);
        throw maintenanceError;
      }
      
      // Filter for products cleaned last month
      const lastMonthMaintenanceProductIds = maintenance?.filter(record => {
        const cleanedDate = new Date(record.last_cleaned);
        return cleanedDate >= lastMonth && cleanedDate <= lastMonthEnd;
      }).map(record => record.product_id);
      
      return products?.filter(product => 
        lastMonthMaintenanceProductIds?.includes(product.product_id)
      ).map(product => {
        const maintenanceRecord = maintenance?.find(m => m.product_id === product.product_id);
        return {
          ...product,
          last_cleaned: maintenanceRecord ? maintenanceRecord.last_cleaned : null
        };
      }) || [];
    }
  });

  // Query 15: Sorted Mens and Womens by Rating
  const { data: ratedMensWomens = [], isLoading: ratedMensWomensLoading, error: ratedMensWomensError } = useQuery({
    queryKey: ['rated-mens-womens-query'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category')
        .in('category', ['mens', 'womens']);
        
      if (productsError) {
        toast.error(`Error fetching mens/womens products: ${productsError.message}`);
        throw productsError;
      }
      
      const productIds = products?.map(p => p.product_id) || [];
      
      if (productIds.length === 0) {
        return [];
      }
      
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
        
      if (reviewsError) {
        toast.error(`Error fetching product ratings: ${reviewsError.message}`);
        throw reviewsError;
      }
      
      // Calculate average ratings
      const ratingsByProduct = {};
      reviews?.forEach(review => {
        if (!ratingsByProduct[review.product_id]) {
          ratingsByProduct[review.product_id] = { sum: 0, count: 0 };
        }
        ratingsByProduct[review.product_id].sum += review.rating;
        ratingsByProduct[review.product_id].count += 1;
      });
      
      // Add ratings to products and sort
      const productsWithRatings = products?.map(product => {
        const rating = ratingsByProduct[product.product_id];
        const avgRating = rating ? rating.sum / rating.count : 0;
        
        return {
          ...product,
          avg_rating: avgRating.toFixed(1)
        };
      }).sort((a, b) => parseFloat(b.avg_rating) - parseFloat(a.avg_rating));
      
      return productsWithRatings || [];
    }
  });

  // Query 16: Users Who Buy and Sell (with filters)
  const { data: buyersAndSellers = [], isLoading: buyersAndSellersLoading, error: buyersAndSellersError } = useQuery({
    queryKey: ['buyers-and-sellers-query'],
    queryFn: async () => {
      // This is a complex query, we'll break it down in steps
      
      // 1. Get all users who have at least one product listed
      const { data: sellers, error: sellersError } = await supabase
        .from('products')
        .select('owner_id, users!products_owner_id_fkey (user_id, name, email)')
        .not('users.user_id', 'is', null);
        
      if (sellersError) {
        toast.error(`Error fetching sellers: ${sellersError.message}`);
        throw sellersError;
      }
      
      // Group products by user to count them
      const sellerProductCounts = {};
      sellers?.forEach(product => {
        const userId = product.users?.user_id;
        if (userId) {
          sellerProductCounts[userId] = (sellerProductCounts[userId] || 0) + 1;
        }
      });
      
      // 2. Get all users who have spent money as renters
      const { data: renters, error: rentersError } = await supabase
        .from('rentals')
        .select('renter_id, total_cost');
        
      if (rentersError) {
        toast.error(`Error fetching renters: ${rentersError.message}`);
        throw rentersError;
      }
      
      // Calculate total spent by each renter
      const renterSpending = {};
      renters?.forEach(rental => {
        renterSpending[rental.renter_id] = (renterSpending[rental.renter_id] || 0) + Number(rental.total_cost);
      });
      
      // 3. Find users who are both sellers and renters with required thresholds
      const userIds = Object.keys(sellerProductCounts).filter(userId => 
        sellerProductCounts[userId] > 2 && 
        renterSpending[userId] && 
        renterSpending[userId] > 700
      );
      
      if (userIds.length === 0) {
        return [];
      }
      
      // 4. Get full details of these users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id, name, email')
        .in('user_id', userIds);
        
      if (usersError) {
        toast.error(`Error fetching user details: ${usersError.message}`);
        throw usersError;
      }
      
      // 5. Combine all the data
      return users?.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        total_products_listed: sellerProductCounts[user.user_id],
        total_spent_on_rentals: renterSpending[user.user_id].toFixed(2)
      })) || [];
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Data Queries</h1>
        <p className="text-muted-foreground mt-2">
          Results of various SQL queries across the rental platform database.
        </p>
      </div>
      
      <Tabs defaultValue="renters" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="renters">Renters</TabsTrigger>
          <TabsTrigger value="rental-pairs">Rental Pairs</TabsTrigger>
          <TabsTrigger value="products-by-owner">Products By Owner</TabsTrigger>
          <TabsTrigger value="owners-with-many">Many Products Owners</TabsTrigger>
          <TabsTrigger value="big-spenders">Big Spenders</TabsTrigger>
          <TabsTrigger value="unrented-products">Unrented Products</TabsTrigger>
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
              <CardTitle>List of Renters</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Renters"
                description="Users with the renter role"
                columns={[
                  { key: 'user_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' }
                ]}
                data={renters}
                isLoading={rentersLoading}
                error={rentersError instanceof Error ? rentersError.message : String(rentersError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rental-pairs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Pairs (Renter, Product, Owner)</CardTitle>
            </CardHeader>
            <CardContent>
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
                isLoading={rentalPairsLoading}
                error={rentalPairsError instanceof Error ? rentalPairsError.message : String(rentalPairsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Additional TabsContent sections for other queries */}
        <TabsContent value="products-by-owner" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Number of Products Each Owner Has</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Products by Owner"
                description="Count of products owned by each user"
                columns={[
                  { key: 'owner_name', label: 'Owner Name' },
                  { key: 'total_products', label: 'Total Products' }
                ]}
                data={productsByOwner}
                isLoading={productsByOwnerLoading}
                error={productsByOwnerError instanceof Error ? productsByOwnerError.message : String(productsByOwnerError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="owners-with-many" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Owners With More Than 2 Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Owners with Many Products"
                description="Users who own more than 2 products"
                columns={[
                  { key: 'owner_name', label: 'Owner Name' },
                  { key: 'total_products', label: 'Total Products' }
                ]}
                data={ownersWithManyProducts}
                isLoading={ownersWithManyProductsLoading}
                error={ownersWithManyProductsError instanceof Error ? ownersWithManyProductsError.message : String(ownersWithManyProductsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="big-spenders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Buyers Who Spent More Than Average</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Big Spenders"
                description="Users who spend more than the average rental amount"
                columns={[
                  { key: 'name', label: 'Name' }
                ]}
                data={bigSpenders}
                isLoading={bigSpendersLoading}
                error={bigSpendersError instanceof Error ? bigSpendersError.message : String(bigSpendersError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unrented-products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unrented Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Unrented Products"
                description="Products that have never been rented"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'name', label: 'Product Name' }
                ]}
                data={unrentedProducts}
                isLoading={unrentedProductsLoading}
                error={unrentedProductsError instanceof Error ? unrentedProductsError.message : String(unrentedProductsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avg-rental-duration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Rental Duration by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Average Rental Duration"
                description="Average number of days each product is typically rented for"
                columns={[
                  { key: 'product_name', label: 'Product Name' },
                  { key: 'avg_duration', label: 'Average Duration (days)' }
                ]}
                data={avgRentalDurations}
                isLoading={avgRentalDurationsLoading}
                error={avgRentalDurationsError instanceof Error ? avgRentalDurationsError.message : String(avgRentalDurationsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Revenue Generating Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Top Revenue Products"
                description="Products generating the most rental revenue"
                columns={[
                  { key: 'product_name', label: 'Product Name' },
                  { key: 'revenue', label: 'Total Revenue' }
                ]}
                data={topRevenueProducts}
                isLoading={topRevenueProductsLoading}
                error={topRevenueProductsError instanceof Error ? topRevenueProductsError.message : String(topRevenueProductsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="above-avg-price" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Products with Above-Average Price in Category</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Above Average Price Products"
                description="Products priced higher than their category average"
                columns={[
                  { key: 'name', label: 'Product Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'rental_price', label: 'Price' }
                ]}
                data={aboveAvgPriceProducts}
                isLoading={aboveAvgPriceProductsLoading}
                error={aboveAvgPriceProductsError instanceof Error ? aboveAvgPriceProductsError.message : String(aboveAvgPriceProductsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sellers-admins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sellers and Admins Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Sellers &amp; Admin Emails"
                description="Email addresses of all sellers and administrators"
                columns={[
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' }
                ]}
                data={sellersAndAdmins}
                isLoading={sellersAndAdminsLoading}
                error={sellersAndAdminsError instanceof Error ? sellersAndAdminsError.message : String(sellersAndAdminsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="role-labels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Users with Role Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="User Roles"
                description="Users with human-readable role descriptions"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'role_label', label: 'Role' }
                ]}
                data={usersWithRoleLabels}
                isLoading={usersWithRoleLabelsLoading}
                error={usersWithRoleLabelsError instanceof Error ? usersWithRoleLabelsError.message : String(usersWithRoleLabelsError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="affordable-tuxedos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Men's Tuxedos Under ₹1500</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Affordable Tuxedos"
                description="Men's tuxedos with rental price under ₹1500"
                columns={[
                  { key: 'product_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'available_quantity', label: 'Available Quantity' }
                ]}
                data={affordableTuxedos}
                isLoading={affordableTuxedosLoading}
                error={affordableTuxedosError instanceof Error ? affordableTuxedosError.message : String(affordableTuxedosError)}
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
                title="Quality Women's Products"
                description="Women's products rated 4+ stars with price under ₹1300"
                columns={[
                  { key: 'product_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'avg_rating', label: 'Avg. Rating' }
                ]}
                data={qualityWomensProducts}
                isLoading={qualityWomensProductsLoading}
                error={qualityWomensProductsError instanceof Error ? qualityWomensProductsError.message : String(qualityWomensProductsError)}
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
                title="Clean Accessories"
                description="Accessories with inventory > 3 that were cleaned last month"
                columns={[
                  { key: 'product_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'available_quantity', label: 'Available Quantity' },
                  { key: 'last_cleaned', label: 'Last Cleaned Date' }
                ]}
                data={cleanAccessories}
                isLoading={cleanAccessoriesLoading}
                error={cleanAccessoriesError instanceof Error ? cleanAccessoriesError.message : String(cleanAccessoriesError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rated-products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Men's and Women's Products by Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Rated Products"
                description="Men's and women's products sorted by rating"
                columns={[
                  { key: 'product_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'avg_rating', label: 'Average Rating' }
                ]}
                data={ratedMensWomens}
                isLoading={ratedMensWomensLoading}
                error={ratedMensWomensError instanceof Error ? ratedMensWomensError.message : String(ratedMensWomensError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="buyers-sellers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Users Who Are Both Buyers and Sellers</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Buyer-Sellers"
                description="Users who both list products and rent them (min 3 listings, ₹700+ spent)"
                columns={[
                  { key: 'user_id', label: 'ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'total_products_listed', label: 'Products Listed' },
                  { key: 'total_spent_on_rentals', label: 'Total Spent' }
                ]}
                data={buyersAndSellers}
                isLoading={buyersAndSellersLoading}
                error={buyersAndSellersError instanceof Error ? buyersAndSellersError.message : String(buyersAndSellersError)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
