
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function DataQueriesPage() {
  const [activeTab, setActiveTab] = useState("renters");

  // 1. List of Renters
  const { data: renters = [], isLoading: rentersLoading, error: rentersError } = useQuery({
    queryKey: ['renters'],
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
  
  // 2. Rental Info (Renter, Product, Owner)
  const { data: rentalPairs = [], isLoading: rentalPairsLoading, error: rentalPairsError } = useQuery({
    queryKey: ['rental-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          rental_id,
          users!rentals_renter_id_fkey(name),
          products(name, users(name))
        `);
        
      if (error) {
        toast.error(`Error fetching rental pairs: ${error.message}`);
        throw error;
      }
      
      return data.map(rental => ({
        rental_id: rental.rental_id,
        renter_name: rental.users?.name || 'Unknown',
        product_name: rental.products?.name || 'Unknown',
        owner_name: rental.products?.users?.name || 'Unknown'
      })) || [];
    }
  });
  
  // 3. Products Count by Owner
  const { data: productsByOwner = [], isLoading: productsByOwnerLoading, error: productsByOwnerError } = useQuery({
    queryKey: ['products-by-owner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          name,
          products(product_id)
        `)
        .eq('role', 'owner');
        
      if (error) {
        toast.error(`Error fetching products by owner: ${error.message}`);
        throw error;
      }
      
      return data.map(user => ({
        owner_name: user.name,
        total_products: user.products?.length || 0
      })) || [];
    }
  });
  
  // 4. Owners with More Than 2 Products
  const { data: ownersWithManyProducts = [], isLoading: ownersWithManyProductsLoading, error: ownersWithManyProductsError } = useQuery({
    queryKey: ['owners-with-many-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          name,
          products(product_id)
        `)
        .eq('role', 'owner');
        
      if (error) {
        toast.error(`Error fetching owners with many products: ${error.message}`);
        throw error;
      }
      
      return data
        .filter(user => (user.products?.length || 0) > 2)
        .map(user => ({
          owner_name: user.name,
          total_products: user.products?.length || 0
        })) || [];
    }
  });
  
  // 5. Buyers Who Spent More Than Average
  const { data: highSpendingBuyers = [], isLoading: highSpendingBuyersLoading, error: highSpendingBuyersError } = useQuery({
    queryKey: ['high-spending-buyers'],
    queryFn: async () => {
      const { data: rentalTotals, error: totalsError } = await supabase
        .from('rentals')
        .select('renter_id, total_cost');
        
      if (totalsError) {
        toast.error(`Error fetching rental totals: ${totalsError.message}`);
        throw totalsError;
      }
      
      // Calculate average total cost
      const totalSpent = rentalTotals.reduce((sum, rental) => sum + rental.total_cost, 0);
      const avgSpent = totalSpent / rentalTotals.length;
      
      // Group by renter_id and sum total_cost
      const renterTotals = {};
      rentalTotals.forEach(rental => {
        if (!renterTotals[rental.renter_id]) {
          renterTotals[rental.renter_id] = 0;
        }
        renterTotals[rental.renter_id] += rental.total_cost;
      });
      
      // Get renter_ids who spent more than average
      const highSpenderIds = Object.keys(renterTotals)
        .filter(renterId => renterTotals[renterId] > avgSpent)
        .map(id => parseInt(id));
      
      if (highSpenderIds.length === 0) {
        return [];
      }
      
      // Get user details for high spenders
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('name, user_id')
        .in('user_id', highSpenderIds);
        
      if (usersError) {
        toast.error(`Error fetching high spending users: ${usersError.message}`);
        throw usersError;
      }
      
      return users.map(user => ({
        name: user.name,
        user_id: user.user_id,
        total_spent: renterTotals[user.user_id]
      })) || [];
    }
  });
  
  // 6. Unrented Products - Already implemented in UnrentedProductsPage
  
  // 7. Average Renting Duration by Product
  const { data: productDurations = [], isLoading: productDurationsLoading, error: productDurationsError } = useQuery({
    queryKey: ['product-durations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          product_id,
          rental_start,
          rental_end,
          products(name)
        `);
        
      if (error) {
        toast.error(`Error fetching rental durations: ${error.message}`);
        throw error;
      }
      
      // Group by product_id and calculate average duration
      const productDurationMap = {};
      const productNameMap = {};
      
      data.forEach(rental => {
        const productId = rental.product_id;
        const startDate = new Date(rental.rental_start);
        const endDate = new Date(rental.rental_end);
        
        // Calculate difference in days
        const timeDiff = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (!productDurationMap[productId]) {
          productDurationMap[productId] = { total: 0, count: 0 };
          productNameMap[productId] = rental.products?.name || `Product ${productId}`;
        }
        
        productDurationMap[productId].total += durationDays;
        productDurationMap[productId].count += 1;
      });
      
      const result = Object.keys(productDurationMap).map(productId => {
        const { total, count } = productDurationMap[productId];
        const avgDuration = count > 0 ? total / count : 0;
        
        return {
          product_id: parseInt(productId),
          product_name: productNameMap[productId],
          avg_duration: Math.round(avgDuration * 10) / 10 // Round to 1 decimal
        };
      });
      
      return result;
    }
  });
  
  // 8. Top 5 Revenue Generating Products - Already implemented in RevenueReportsPage
  
  // 9. Products With Above-Average Price in Category
  const { data: aboveAvgPriceProducts = [], isLoading: aboveAvgPriceProductsLoading, error: aboveAvgPriceProductsError } = useQuery({
    queryKey: ['above-avg-price-products'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('product_id, name, category, rental_price');
        
      if (error) {
        toast.error(`Error fetching products: ${error.message}`);
        throw error;
      }
      
      // Group products by category and calculate average price per category
      const categoryPrices = {};
      
      products.forEach(product => {
        const category = product.category;
        
        if (!categoryPrices[category]) {
          categoryPrices[category] = { total: 0, count: 0, products: [] };
        }
        
        categoryPrices[category].total += product.rental_price;
        categoryPrices[category].count += 1;
        categoryPrices[category].products.push(product);
      });
      
      // Find products with above average price in their category
      const result = [];
      
      Object.keys(categoryPrices).forEach(category => {
        const { total, count, products } = categoryPrices[category];
        const avgPrice = count > 0 ? total / count : 0;
        
        products.forEach(product => {
          if (product.rental_price > avgPrice) {
            result.push({
              product_id: product.product_id,
              name: product.name,
              category: product.category,
              rental_price: product.rental_price,
              category_avg_price: Math.round(avgPrice * 100) / 100 // Round to 2 decimals
            });
          }
        });
      });
      
      return result;
    }
  });
  
  // 10. Sellers and Admins Emails
  const { data: sellersAdminsEmails = [], isLoading: sellersAdminsEmailsLoading, error: sellersAdminsEmailsError } = useQuery({
    queryKey: ['sellers-admins-emails'],
    queryFn: async () => {
      // Get owners (sellers)
      const { data: owners, error: ownersError } = await supabase
        .from('users')
        .select('email, role')
        .eq('role', 'owner');
        
      if (ownersError) {
        toast.error(`Error fetching owners: ${ownersError.message}`);
        throw ownersError;
      }
      
      // Get admins
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('email, role')
        .eq('role', 'admin');
        
      if (adminsError) {
        toast.error(`Error fetching admins: ${adminsError.message}`);
        throw adminsError;
      }
      
      // Combine results
      return [...(owners || []), ...(admins || [])];
    }
  });
  
  // 11. Users With Role Labels
  const { data: usersWithRoleLabels = [], isLoading: usersWithRoleLabelsLoading, error: usersWithRoleLabelsError } = useQuery({
    queryKey: ['users-with-role-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, role');
        
      if (error) {
        toast.error(`Error fetching users: ${error.message}`);
        throw error;
      }
      
      return data.map(user => {
        let role_label;
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
          default:
            role_label = 'Unknown';
        }
        
        return {
          name: user.name,
          role_label
        };
      }) || [];
    }
  });
  
  // 12. Mens Tuxedo Under 1500
  const { data: mensTuxedos = [], isLoading: mensTuxedosLoading, error: mensTuxedosError } = useQuery({
    queryKey: ['mens-tuxedos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'mens')
        .eq('sub_category', 'tuxedo')
        .lt('rental_price', 1500);
        
      if (error) {
        toast.error(`Error fetching mens tuxedos: ${error.message}`);
        throw error;
      }
      
      return data || [];
    }
  });
  
  // 13. Womens Products With High Ratings & Low Price
  const { data: highRatedWomensProducts = [], isLoading: highRatedWomensProductsLoading, error: highRatedWomensProductsError } = useQuery({
    queryKey: ['high-rated-womens'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, rental_price')
        .eq('category', 'womens')
        .lt('rental_price', 1300);
        
      if (productsError) {
        toast.error(`Error fetching womens products: ${productsError.message}`);
        throw productsError;
      }
      
      if (products.length === 0) {
        return [];
      }
      
      // Get ratings for these products
      const productIds = products.map(p => p.product_id);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
        
      if (reviewsError) {
        toast.error(`Error fetching product reviews: ${reviewsError.message}`);
        throw reviewsError;
      }
      
      // Calculate average rating per product
      const productRatings = {};
      
      reviews.forEach(review => {
        if (!productRatings[review.product_id]) {
          productRatings[review.product_id] = { total: 0, count: 0 };
        }
        
        productRatings[review.product_id].total += review.rating;
        productRatings[review.product_id].count += 1;
      });
      
      // Filter products with avg rating >= 4
      const result = products
        .filter(product => {
          const rating = productRatings[product.product_id];
          if (!rating) return false;
          
          const avgRating = rating.total / rating.count;
          return avgRating >= 4;
        })
        .map(product => {
          const rating = productRatings[product.product_id];
          const avgRating = rating ? rating.total / rating.count : 0;
          
          return {
            product_id: product.product_id,
            name: product.name,
            rental_price: product.rental_price,
            avg_rating: Math.round(avgRating * 10) / 10 // Round to 1 decimal
          };
        });
      
      return result;
    }
  });
  
  // 14. Accessories (Quantity >3 & Cleaned Last Month)
  const { data: accessoriesMaintenance = [], isLoading: accessoriesMaintenanceLoading, error: accessoriesMaintenanceError } = useQuery({
    queryKey: ['accessories-maintenance'],
    queryFn: async () => {
      // Get current date and calculate last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const lastMonthStart = lastMonth.toISOString().split('T')[0];
      const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
      
      // Get accessories with quantity > 3
      const { data: accessories, error: accessoriesError } = await supabase
        .from('products')
        .select('product_id, name, available_quantity')
        .eq('category', 'accessories')
        .gt('available_quantity', 3);
        
      if (accessoriesError) {
        toast.error(`Error fetching accessories: ${accessoriesError.message}`);
        throw accessoriesError;
      }
      
      if (accessories.length === 0) {
        return [];
      }
      
      // Get maintenance records for those products
      const productIds = accessories.map(p => p.product_id);
      
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('product_id, last_cleaned')
        .in('product_id', productIds)
        .gte('last_cleaned', lastMonthStart)
        .lte('last_cleaned', lastMonthEndStr);
        
      if (maintenanceError) {
        toast.error(`Error fetching maintenance records: ${maintenanceError.message}`);
        throw maintenanceError;
      }
      
      // Map maintenance records to products
      const maintenanceMap = {};
      maintenance.forEach(record => {
        maintenanceMap[record.product_id] = record.last_cleaned;
      });
      
      // Return products with maintenance records
      return accessories
        .filter(product => maintenanceMap[product.product_id])
        .map(product => ({
          product_id: product.product_id,
          name: product.name,
          available_quantity: product.available_quantity,
          last_cleaned: maintenanceMap[product.product_id]
        }));
    }
  });
  
  // 15. Sorted Mens and Womens by Rating
  const { data: sortedByRating = [], isLoading: sortedByRatingLoading, error: sortedByRatingError } = useQuery({
    queryKey: ['sorted-by-rating'],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('product_id, name, category')
        .in('category', ['mens', 'womens']);
        
      if (productsError) {
        toast.error(`Error fetching mens/womens products: ${productsError.message}`);
        throw productsError;
      }
      
      if (products.length === 0) {
        return [];
      }
      
      // Get ratings for these products
      const productIds = products.map(p => p.product_id);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating');
        
      if (reviewsError) {
        toast.error(`Error fetching product reviews: ${reviewsError.message}`);
        throw reviewsError;
      }
      
      // Calculate average rating per product
      const productRatings = {};
      
      reviews.forEach(review => {
        if (!productRatings[review.product_id]) {
          productRatings[review.product_id] = { total: 0, count: 0 };
        }
        
        productRatings[review.product_id].total += review.rating;
        productRatings[review.product_id].count += 1;
      });
      
      // Map ratings to products and sort
      const result = products
        .map(product => {
          const rating = productRatings[product.product_id];
          const avgRating = rating ? rating.total / rating.count : 0;
          
          return {
            product_id: product.product_id,
            name: product.name,
            category: product.category,
            avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : 0 // Round to 1 decimal
          };
        })
        .filter(product => product.avg_rating > 0)
        .sort((a, b) => b.avg_rating - a.avg_rating);
      
      return result;
    }
  });
  
  // 16. Users Who Buy and Sell (with filters)
  const { data: buyersAndSellers = [], isLoading: buyersAndSellersLoading, error: buyersAndSellersError } = useQuery({
    queryKey: ['buyers-and-sellers'],
    queryFn: async () => {
      // This is a complex query that needs multiple steps
      
      // First get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('user_id, name, email');
        
      if (usersError) {
        toast.error(`Error fetching users: ${usersError.message}`);
        throw usersError;
      }
      
      // For each user, check if they have products (as owner)
      const { data: productsOwned, error: productsOwnedError } = await supabase
        .from('products')
        .select('owner_id, product_id');
        
      if (productsOwnedError) {
        toast.error(`Error fetching owned products: ${productsOwnedError.message}`);
        throw productsOwnedError;
      }
      
      // For each user, check if they have rentals (as renter)
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('renter_id, total_cost');
        
      if (rentalsError) {
        toast.error(`Error fetching rentals: ${rentalsError.message}`);
        throw rentalsError;
      }
      
      // Group products by owner
      const productsByOwner = {};
      productsOwned.forEach(product => {
        if (!productsByOwner[product.owner_id]) {
          productsByOwner[product.owner_id] = [];
        }
        productsByOwner[product.owner_id].push(product.product_id);
      });
      
      // Group rentals by renter and sum costs
      const rentalsByRenter = {};
      rentals.forEach(rental => {
        if (!rentalsByRenter[rental.renter_id]) {
          rentalsByRenter[rental.renter_id] = { total: 0, count: 0 };
        }
        rentalsByRenter[rental.renter_id].total += rental.total_cost;
        rentalsByRenter[rental.renter_id].count += 1;
      });
      
      // Find users who are both buyers and sellers with the given conditions
      const result = users
        .filter(user => {
          const productsListed = productsByOwner[user.user_id]?.length || 0;
          const totalRentalCost = rentalsByRenter[user.user_id]?.total || 0;
          
          return productsListed > 2 && totalRentalCost > 700;
        })
        .map(user => {
          return {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            total_products_listed: productsByOwner[user.user_id]?.length || 0,
            total_spent_on_rentals: rentalsByRenter[user.user_id]?.total || 0
          };
        });
      
      return result;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Database Query Results</h1>
      <p className="text-muted-foreground">View results from various SQL queries across the database</p>
      
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-8">
              <TabsTrigger value="renters">Renters</TabsTrigger>
              <TabsTrigger value="rental-pairs">Rental Info</TabsTrigger>
              <TabsTrigger value="product-counts">Product Counts</TabsTrigger>
              <TabsTrigger value="owners-3plus">Owners 3+ Prod.</TabsTrigger>
              <TabsTrigger value="high-spenders">High Spenders</TabsTrigger>
              <TabsTrigger value="unrented">Unrented</TabsTrigger>
              <TabsTrigger value="durations">Durations</TabsTrigger>
              <TabsTrigger value="high-revenue">Top Revenue</TabsTrigger>
              <TabsTrigger value="above-avg-price">Above Avg. Price</TabsTrigger>
              <TabsTrigger value="admin-seller">Admins/Owners</TabsTrigger>
              <TabsTrigger value="role-labels">Role Labels</TabsTrigger>
              <TabsTrigger value="mens-tuxedo">Mens Tuxedos</TabsTrigger>
              <TabsTrigger value="womens-rated">Womens Rated</TabsTrigger>
              <TabsTrigger value="accessories">Accessories</TabsTrigger>
              <TabsTrigger value="sorted-rating">Rating Sorted</TabsTrigger>
              <TabsTrigger value="both-roles">Buy & Sell</TabsTrigger>
            </TabsList>
            
            <TabsContent value="renters" className="mt-0 border-0">
              <DataTable
                title="Renters"
                description="Users with role = 'renter'"
                columns={[
                  { key: 'user_id', label: 'User ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' }
                ]}
                data={renters}
                isLoading={rentersLoading}
                error={rentersError instanceof Error ? rentersError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="rental-pairs" className="mt-0 border-0">
              <DataTable
                title="Rental Pairs"
                description="Renter, Product, and Owner relationships"
                columns={[
                  { key: 'rental_id', label: 'Rental ID' },
                  { key: 'renter_name', label: 'Renter' },
                  { key: 'product_name', label: 'Product' },
                  { key: 'owner_name', label: 'Owner' }
                ]}
                data={rentalPairs}
                isLoading={rentalPairsLoading}
                error={rentalPairsError instanceof Error ? rentalPairsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="product-counts" className="mt-0 border-0">
              <DataTable
                title="Products Count by Owner"
                description="Number of products listed by each owner"
                columns={[
                  { key: 'owner_name', label: 'Owner' },
                  { key: 'total_products', label: 'Total Products' }
                ]}
                data={productsByOwner}
                isLoading={productsByOwnerLoading}
                error={productsByOwnerError instanceof Error ? productsByOwnerError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="owners-3plus" className="mt-0 border-0">
              <DataTable
                title="Owners with More Than 2 Products"
                description="Owners who have listed more than 2 products"
                columns={[
                  { key: 'owner_name', label: 'Owner' },
                  { key: 'total_products', label: 'Total Products' }
                ]}
                data={ownersWithManyProducts}
                isLoading={ownersWithManyProductsLoading}
                error={ownersWithManyProductsError instanceof Error ? ownersWithManyProductsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="high-spenders" className="mt-0 border-0">
              <DataTable
                title="Buyers Who Spent More Than Average"
                description="Users who spent more than the average rental cost"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'user_id', label: 'User ID' },
                  { key: 'total_spent', label: 'Total Spent' }
                ]}
                data={highSpendingBuyers}
                isLoading={highSpendingBuyersLoading}
                error={highSpendingBuyersError instanceof Error ? highSpendingBuyersError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="unrented" className="mt-0 border-0">
              <p className="text-sm text-muted-foreground mb-4">
                Please visit the <a href="/unrented-products" className="text-primary underline">Unrented Products</a> page to see this data.
              </p>
            </TabsContent>
            
            <TabsContent value="durations" className="mt-0 border-0">
              <DataTable
                title="Average Renting Duration by Product"
                description="Average rental duration in days for each product"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'product_name', label: 'Product' },
                  { key: 'avg_duration', label: 'Avg. Duration (Days)' }
                ]}
                data={productDurations}
                isLoading={productDurationsLoading}
                error={productDurationsError instanceof Error ? productDurationsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="high-revenue" className="mt-0 border-0">
              <p className="text-sm text-muted-foreground mb-4">
                Please visit the <a href="/revenue-reports" className="text-primary underline">Revenue Reports</a> page to see this data.
              </p>
            </TabsContent>
            
            <TabsContent value="above-avg-price" className="mt-0 border-0">
              <DataTable
                title="Products With Above-Average Price in Category"
                description="Products priced higher than their category average"
                columns={[
                  { key: 'name', label: 'Product' },
                  { key: 'category', label: 'Category' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'category_avg_price', label: 'Category Avg. Price' }
                ]}
                data={aboveAvgPriceProducts}
                isLoading={aboveAvgPriceProductsLoading}
                error={aboveAvgPriceProductsError instanceof Error ? aboveAvgPriceProductsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="admin-seller" className="mt-0 border-0">
              <DataTable
                title="Sellers and Admins Emails"
                description="Emails of users with 'owner' or 'admin' roles"
                columns={[
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Role' }
                ]}
                data={sellersAdminsEmails}
                isLoading={sellersAdminsEmailsLoading}
                error={sellersAdminsEmailsError instanceof Error ? sellersAdminsEmailsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="role-labels" className="mt-0 border-0">
              <DataTable
                title="Users With Role Labels"
                description="Users with human-readable role labels"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'role_label', label: 'Role' }
                ]}
                data={usersWithRoleLabels}
                isLoading={usersWithRoleLabelsLoading}
                error={usersWithRoleLabelsError instanceof Error ? usersWithRoleLabelsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="mens-tuxedo" className="mt-0 border-0">
              <DataTable
                title="Mens Tuxedo Under $1500"
                description="Men's tuxedos with rental price less than $1500"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'sub_category', label: 'Sub-Category' },
                  { key: 'rental_price', label: 'Price' }
                ]}
                data={mensTuxedos}
                isLoading={mensTuxedosLoading}
                error={mensTuxedosError instanceof Error ? mensTuxedosError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="womens-rated" className="mt-0 border-0">
              <DataTable
                title="Womens Products With High Ratings & Low Price"
                description="Women's products with avg rating ≥ 4 and price < $1300"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'rental_price', label: 'Price' },
                  { key: 'avg_rating', label: 'Avg. Rating' }
                ]}
                data={highRatedWomensProducts}
                isLoading={highRatedWomensProductsLoading}
                error={highRatedWomensProductsError instanceof Error ? highRatedWomensProductsError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="accessories" className="mt-0 border-0">
              <DataTable
                title="Accessories (Quantity >3 & Cleaned Last Month)"
                description="Accessories with quantity > 3 that were cleaned last month"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'available_quantity', label: 'Quantity' },
                  { key: 'last_cleaned', label: 'Last Cleaned' }
                ]}
                data={accessoriesMaintenance}
                isLoading={accessoriesMaintenanceLoading}
                error={accessoriesMaintenanceError instanceof Error ? accessoriesMaintenanceError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="sorted-rating" className="mt-0 border-0">
              <DataTable
                title="Sorted Mens and Womens by Rating"
                description="Men's and women's products sorted by average rating"
                columns={[
                  { key: 'product_id', label: 'Product ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'avg_rating', label: 'Avg. Rating' }
                ]}
                data={sortedByRating}
                isLoading={sortedByRatingLoading}
                error={sortedByRatingError instanceof Error ? sortedByRatingError.message : null}
              />
            </TabsContent>
            
            <TabsContent value="both-roles" className="mt-0 border-0">
              <DataTable
                title="Users Who Buy and Sell (with filters)"
                description="Users who have listed >2 products and spent >$700 on rentals"
                columns={[
                  { key: 'user_id', label: 'User ID' },
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'total_products_listed', label: 'Products Listed' },
                  { key: 'total_spent_on_rentals', label: 'Total Spent' }
                ]}
                data={buyersAndSellers}
                isLoading={buyersAndSellersLoading}
                error={buyersAndSellersError instanceof Error ? buyersAndSellersError.message : null}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
