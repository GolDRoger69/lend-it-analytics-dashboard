
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/sonner";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}
