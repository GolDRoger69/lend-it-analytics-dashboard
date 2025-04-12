
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ChevronFirst, ChevronLast, Home, Package, ShoppingCart, BarChart3, Users, Settings, User, LogOut } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const sidebarItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Products", href: "/products", icon: Package },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  // Role-specific items
  const ownerItems = [
    { name: "My Listings", href: "/my-listings", icon: ShoppingCart },
    { name: "My Maintenance", href: "/maintenance", icon: Settings },
  ];

  const adminItems = [
    { name: "User Management", href: "/users", icon: Users },
    { name: "System Settings", href: "/settings", icon: Settings },
  ];

  const renterItems = [
    { name: "My Rentals", href: "/my-rentals", icon: ShoppingCart },
  ];

  const userSpecificItems = user?.role === 'owner' 
    ? ownerItems 
    : user?.role === 'admin' 
      ? adminItems 
      : user?.role === 'renter' 
        ? renterItems 
        : [];
        
  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside 
      className={cn(
        "bg-sidebar text-sidebar-foreground h-screen flex flex-col transition-all duration-300",
        sidebarWidth
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && <h2 className="text-xl font-bold">Lend-IT</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronLast size={20} /> : <ChevronFirst size={20} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="flex-shrink-0" size={20} />
              {!collapsed && <span className="ml-4">{item.name}</span>}
            </Link>
          ))}
          
          {user && userSpecificItems.length > 0 && (
            <>
              <hr className="border-sidebar-border my-4" />
              
              {userSpecificItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    location.pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="flex-shrink-0" size={20} />
                  {!collapsed && <span className="ml-4">{item.name}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      
      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div 
              className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center"
              aria-label="User avatar"
            >
              <User size={18} />
            </div>
            {!collapsed && (
              <div className="ml-3 flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/70 capitalize">{user.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-md hover:bg-sidebar-accent"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
