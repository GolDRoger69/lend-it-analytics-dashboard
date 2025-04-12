
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { useMaintenanceRecords } from "@/integrations/supabase/hooks";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, Loader2, WrenchIcon } from "lucide-react";
import { format } from "date-fns";

export function MaintenancePage() {
  const { data: maintenanceRecords = [], isLoading } = useMaintenanceRecords();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter records based on active tab
  const filteredRecords = activeTab === "all"
    ? maintenanceRecords
    : maintenanceRecords.filter(record => record.status === activeTab);
  
  // Get counts for badge display
  const pendingCount = maintenanceRecords.filter(r => r.status === "pending").length;
  const completedCount = maintenanceRecords.filter(r => r.status === "completed").length;
  const overdueCount = maintenanceRecords.filter(r => r.status === "overdue").length;
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading maintenance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Maintenance Records</h1>
        <Button>
          <WrenchIcon className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Overview</CardTitle>
          <CardDescription>
            Track and manage maintenance schedules for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Pending
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Completed
                </Badge>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  Overdue
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="all" className="flex gap-2">
                All
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {maintenanceRecords.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex gap-2">
                Pending
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {pendingCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex gap-2">
                Completed
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {completedCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex gap-2">
                Overdue
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {overdueCount}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">Product</th>
                      <th className="p-2 text-left font-medium">Last Cleaned</th>
                      <th className="p-2 text-left font-medium">Next Due</th>
                      <th className="p-2 text-left font-medium">Status</th>
                      <th className="p-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.maintenance_id} className="border-t">
                        <td className="p-2">{record.product_name}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {record.last_cleaned && format(new Date(record.last_cleaned), "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 text-muted-foreground" />
                            {record.next_cleaning_due && format(new Date(record.next_cleaning_due), "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button size="sm" variant="outline">Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredRecords.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No maintenance records found for the selected filter.
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              {/* Same table structure will be used for all tabs */}
              {/* The records are already filtered by the filteredRecords variable */}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {/* Same table structure will be used for all tabs */}
            </TabsContent>
            
            <TabsContent value="overdue" className="mt-0">
              {/* Same table structure will be used for all tabs */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
