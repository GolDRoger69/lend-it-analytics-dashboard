import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth-context";
import { Link } from "react-router-dom";
import { CalendarCheck2, CircleDollarSign, MessageSquare, ShoppingBag, Users } from "lucide-react";
import { 
  useMyProducts, 
  useMyRentals, 
  useMyProductMaintenance,
  useRentalPairs
} from "@/integrations/supabase/hooks";

export function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: userProducts = [], isLoading: isLoadingProducts } = useMyProducts(user?.user_id || null);
  const { data: userRentals = [], isLoading: isLoadingRentals } = useMyRentals(user?.user_id || null);
  const { data: maintenanceRecords = [], isLoading: isLoadingMaintenance } = useMyProductMaintenance(user?.user_id || null);
  const { data: rentalPairs = [], isLoading: isLoadingRentalPairs } = useRentalPairs();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <h1 className="text-2xl font-bold">Please log in to access your dashboard</h1>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        {user.role === 'owner' && (
          <Link to="/list-product">
            <Button>+ List New Product</Button>
          </Link>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {user.role === 'owner' && <TabsTrigger value="my-products">My Products</TabsTrigger>}
          {user.role === 'owner' && <TabsTrigger value="maintenance">Maintenance</TabsTrigger>}
          <TabsTrigger value="my-rentals">My Rentals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={user.role === 'owner' ? "Products Listed" : "Products Rented"}
              value={user.role === 'owner' ? userProducts.length : userRentals.length}
              icon={<ShoppingBag />}
              trend={{ value: 5, direction: "up" }}
            />
            <StatCard
              title="Total Revenue"
              value={`$${user.role === 'owner' ? 3500 : 0}`}
              icon={<CircleDollarSign />}
              trend={{ value: 12, direction: "up" }}
            />
            <StatCard
              title="Upcoming Rentals"
              value="3"
              icon={<CalendarCheck2 />}
              trend={{ value: 2, direction: "up" }}
            />
            <StatCard
              title="New Messages"
              value="7"
              icon={<MessageSquare />}
              trend={{ value: 3, direction: "up" }}
            />
          </div>
          
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {user.role === 'owner' ? (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Latest Rentals of Your Products</h3>
                      <DataTable
                        title=""
                        columns={[
                          { key: "rental_id", label: "ID" },
                          { key: "renter_name", label: "Renter" },
                          { key: "product_name", label: "Product" },
                          { key: "total_cost", label: "Amount" },
                        ]}
                        data={rentalPairs.slice(0, 3)}
                        isLoading={isLoadingRentalPairs}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Maintenance Due Soon</h3>
                      <DataTable
                        title=""
                        columns={[
                          { key: "product_name", label: "Product" },
                          { key: "last_cleaned", label: "Last Cleaned" },
                          { key: "next_cleaning_due", label: "Next Due" },
                          { key: "status", label: "Status" },
                        ]}
                        data={maintenanceRecords.filter(r => r.status === 'pending').slice(0, 3)}
                        isLoading={isLoadingMaintenance}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Your Recent Rentals</h3>
                      <DataTable
                        title=""
                        columns={[
                          { key: "rental_id", label: "ID" },
                          { key: "product_name", label: "Product" },
                          { key: "owner_name", label: "Owner" },
                          { key: "rental_start", label: "Start Date" },
                          { key: "rental_end", label: "End Date" },
                          { key: "total_cost", label: "Amount" },
                        ]}
                        data={userRentals.slice(0, 3)}
                        isLoading={isLoadingRentals}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Recommended for You</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {isLoadingProducts ? (
                          <div className="col-span-3 h-40 flex items-center justify-center">
                            Loading recommendations...
                          </div>
                        ) : (
                          userProducts.slice(0, 3).map(product => (
                            <ProductCard key={product.product_id} product={product} />
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {user.role === 'owner' && (
          <TabsContent value="my-products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Product Listings</h2>
              <Link to="/list-product">
                <Button>+ Add New Product</Button>
              </Link>
            </div>
            
            {userProducts.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium mb-2">You haven't listed any products yet</h3>
                <p className="text-muted-foreground mb-6">Start earning by listing your unused items for rent.</p>
                <Link to="/list-product">
                  <Button>+ List Your First Product</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProducts.map(product => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
        
        {user.role === 'owner' && (
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Maintenance</h2>
              <Button variant="outline">Schedule Cleaning</Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Records</CardTitle>
                <CardDescription>Cleaning and maintenance history for your products</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  title=""
                  columns={[
                    { key: "product_name", label: "Product" },
                    { key: "last_cleaned", label: "Last Cleaned" },
                    { key: "next_cleaning_due", label: "Next Due" },
                    { key: "status", label: "Status" },
                  ]}
                  data={maintenanceRecords}
                  isLoading={isLoadingMaintenance}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="my-rentals" className="space-y-6">
          <h2 className="text-2xl font-bold">My Rentals</h2>
          
          {userRentals.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">You haven't rented any products yet</h3>
              <p className="text-muted-foreground mb-6">Browse our catalog and find something you love.</p>
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rental History</CardTitle>
                <CardDescription>All your past and current rentals</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  title=""
                  columns={[
                    { key: "rental_id", label: "ID" },
                    { key: "product_name", label: "Product" },
                    { key: "owner_name", label: "Owner" },
                    { key: "rental_start", label: "Start Date" },
                    { key: "rental_end", label: "End Date" },
                    { key: "total_cost", label: "Amount" },
                    { key: "status", label: "Status" },
                  ]}
                  data={userRentals}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
