
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { 
  useProductsByOwner,
  useRentalPairs
} from "@/integrations/supabase/hooks";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { mockApi } from "@/lib/mock-data";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: productsByOwner = [], isLoading: isLoadingProductsByOwner } = useProductsByOwner();
  const { data: rentalPairs = [], isLoading: isLoadingRentalPairs } = useRentalPairs();

  // For demo purposes, we'll still use some mock data for charts
  // In a real app, we would replace these with Supabase queries
  const topProducts = mockApi.topProductsByRevenue();
  const productsAboveAvg = mockApi.productsAboveCategoryAvg();
  const categoryData = [
    { name: "Mens", value: 35 },
    { name: "Womens", value: 40 },
    { name: "Accessories", value: 25 }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Product Analysis</TabsTrigger>
          <TabsTrigger value="users">User Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Products by Revenue</CardTitle>
                <CardDescription>Highest earning products in the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Product breakdown by category</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[300px] w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <DataTable
              title="Products by Owner"
              description="Number of products listed by each owner"
              columns={[
                { key: "owner_name", label: "Owner" },
                { key: "total_products", label: "Total Products" },
              ]}
              data={productsByOwner}
              isLoading={isLoadingProductsByOwner}
            />
            
            <DataTable
              title="Recent Rental Transactions"
              description="Latest rental activities on the platform"
              columns={[
                { key: "rental_id", label: "Rental ID" },
                { key: "renter_name", label: "Renter" },
                { key: "product_name", label: "Product" },
                { key: "owner_name", label: "Owner" },
                { key: "total_cost", label: "Amount" },
              ]}
              data={rentalPairs.slice(0, 10)}
              isLoading={isLoadingRentalPairs}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product Category</CardTitle>
              <CardDescription>Breakdown of revenue by product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { category: 'Mens', revenue: 45000 },
                      { category: 'Womens', revenue: 52000 },
                      { category: 'Accessories', revenue: 38000 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Revenue per Rental</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "owner_name", label: "Owner" },
                  { key: "total_products", label: "Products Listed" },
                  { key: "avg_revenue", label: "Avg. Revenue/Product" },
                  { key: "total_revenue", label: "Total Revenue" },
                ]}
                data={[
                  { owner_name: "Jane Smith", total_products: 12, avg_revenue: "$145.50", total_revenue: "$1,746.00" },
                  { owner_name: "Alice Johnson", total_products: 8, avg_revenue: "$210.25", total_revenue: "$1,682.00" },
                  { owner_name: "David Miller", total_products: 15, avg_revenue: "$178.33", total_revenue: "$2,675.00" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Products Above Category Average Price</CardTitle>
              <CardDescription>Products priced higher than their category average</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title=""
                columns={[
                  { key: "name", label: "Product" },
                  { key: "category", label: "Category" },
                  { key: "rental_price", label: "Price" },
                ]}
                data={productsAboveAvg}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Rental Duration</CardTitle>
                <CardDescription>Average number of days products are rented</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockApi.avgRentalDuration()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : value} days`} />
                      <Bar dataKey="avg_duration" name="Avg. Days" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Products Not Yet Rented</CardTitle>
                <CardDescription>Products that haven't been rented yet</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  title=""
                  columns={[
                    { key: "product_id", label: "ID" },
                    { key: "name", label: "Product" },
                  ]}
                  data={mockApi.productsNotRented()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>High Spending Renters</CardTitle>
                <CardDescription>Renters who spend more than average</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  title=""
                  columns={[
                    { key: "name", label: "Renter" },
                  ]}
                  data={mockApi.highSpendingRenters()}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Power Users</CardTitle>
                <CardDescription>Users who both list products and rent from others</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  title=""
                  columns={[
                    { key: "name", label: "User" },
                    { key: "email", label: "Email" },
                    { key: "total_products_listed", label: "Products Listed" },
                    { key: "total_spent_on_rentals", label: "Total Spent" },
                  ]}
                  data={mockApi.findPowerUsers()}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Breakdown of users by their roles</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[300px] w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Renters", value: 60 },
                        { name: "Owners", value: 30 },
                        { name: "Admins", value: 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${typeof percent === 'number' ? (percent * 100).toFixed(0) : '0'}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="custom-tooltip bg-background p-3 border rounded-md shadow-md">
        <p className="label font-medium">{`${label}`}</p>
        <p className="value text-primary">{`Revenue: $${typeof value === 'number' ? value.toFixed(2) : value}`}</p>
      </div>
    );
  }
  return null;
};
