import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockApi } from "@/lib/mock-data";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DollarSign, Package, ShoppingBag, Star, Users } from "lucide-react";

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data for overview stats
  const totalProducts = mockApi.getAllProducts().length;
  const totalRentals = mockApi.findRentalPairs().length;
  const totalUsers = mockApi.usersWithRoleLabels().length;
  const totalRevenue = mockApi.findRentalPairs().reduce((acc, rental) => {
    const rentalObj = mockApi.findRentalPairs().find(r => r.rental_id === rental.rental_id);
    return acc + (rentalObj?.total_cost || 0);
  }, 0);
  
  // Example data for the charts
  const categoryData = [
    { name: "Men's", count: mockApi.getAllProducts().filter(p => p.category === 'mens').length },
    { name: "Women's", count: mockApi.getAllProducts().filter(p => p.category === 'womens').length },
    { name: "Accessories", count: mockApi.getAllProducts().filter(p => p.category === 'accessories').length },
  ];
  
  const revenueData = mockApi.topProductsByRevenue(5);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Badge variant="outline">Data updates hourly</Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="rentals">Rentals</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Products"
              value={totalProducts}
              icon={<Package />}
              trend={{ value: 12, direction: "up" }}
            />
            <StatCard
              title="Total Rentals"
              value={totalRentals}
              icon={<ShoppingBag />}
              trend={{ value: 8, direction: "up" }}
            />
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<Users />}
              trend={{ value: 5, direction: "up" }}
            />
            <StatCard
              title="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={<DollarSign />}
              trend={{ value: 15, direction: "up" }}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>Distribution of products by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Products by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Highest earning products on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="product_name" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Bar dataKey="revenue" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rentals</CardTitle>
              <CardDescription>Latest rental transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "rental_id", label: "ID" },
                  { key: "renter_name", label: "Renter" },
                  { key: "product_name", label: "Product" },
                  { key: "owner_name", label: "Owner" },
                ]}
                data={mockApi.findRentalPairs().slice(0, 5)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Renters</CardTitle>
              <CardDescription>Users with renter role in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "user_id", label: "ID" },
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                ]}
                data={mockApi.findRenters()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Users with Role-Specific Labels</CardTitle>
              <CardDescription>User roles with custom labels</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Name" },
                  { key: "role_label", label: "Role" },
                ]}
                data={mockApi.usersWithRoleLabels()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Owners and Admins</CardTitle>
              <CardDescription>List of users with owner or admin roles</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role" },
                ]}
                data={mockApi.ownersAndAdmins()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>High-spending Renters</CardTitle>
              <CardDescription>Renters with total spending above average</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Name" },
                ]}
                data={mockApi.highSpendingRenters()}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Products by Owner</CardTitle>
              <CardDescription>Number of products listed by each owner</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "owner_name", label: "Owner" },
                  { key: "total_products", label: "Total Products" },
                ]}
                data={mockApi.productsByOwner()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Power Listers</CardTitle>
              <CardDescription>Owners with more than 2 products</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "owner_name", label: "Owner" },
                  { key: "total_products", label: "Total Products" },
                ]}
                data={mockApi.productsByOwnerMoreThanX()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Products Not Yet Rented</CardTitle>
              <CardDescription>Products that have not been rented yet</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "product_id", label: "ID" },
                  { key: "name", label: "Product Name" },
                ]}
                data={mockApi.productsNotRented()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Products Above Category Average Price</CardTitle>
              <CardDescription>Products with rental price above their category average</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Name" },
                  { key: "category", label: "Category" },
                  { key: "rental_price", label: "Price" },
                ]}
                data={mockApi.productsAboveCategoryAvg()}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Rentals</CardTitle>
              <CardDescription>Mapping of renters, products, and owners</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "rental_id", label: "ID" },
                  { key: "renter_name", label: "Renter" },
                  { key: "product_name", label: "Product" },
                  { key: "owner_name", label: "Owner" },
                ]}
                data={mockApi.findRentalPairs()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Rental Duration</CardTitle>
              <CardDescription>Average number of days each product is rented for</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "product_name", label: "Product" },
                  { key: "avg_duration", label: "Avg. Days" },
                ]}
                data={mockApi.avgRentalDuration()}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Products generating the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "product_name", label: "Product" },
                  { key: "revenue", label: "Revenue" },
                ]}
                data={mockApi.topProductsByRevenue()}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Visualization</CardTitle>
              <CardDescription>Top 5 products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="product_name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="revenue" fill="#6366F1">
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
