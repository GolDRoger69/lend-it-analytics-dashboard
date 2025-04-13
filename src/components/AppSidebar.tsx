
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBasket, 
  LineChart, 
  Home, 
  ListChecks,
  Settings, 
  LogOut,
  WrenchIcon,
  UsersIcon,
  BarChart3Icon,
  PieChartIcon,
  Database
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, href, isActive, onClick }: SidebarItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function AppSidebar({ 
  collapsed, 
  setCollapsed 
}: { 
  collapsed: boolean; 
  setCollapsed: (collapsed: boolean) => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div 
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between pb-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl">Leasel</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1.5 hover:bg-accent"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={cn("transition-transform", collapsed ? "rotate-0" : "rotate-180")}
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <line x1="9" x2="15" y1="9" y2="9"/>
              <line x1="9" x2="15" y1="15" y2="15"/>
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SidebarItem 
            icon={<Home className="h-5 w-5" />}
            label="Home"
            href="/home"
            isActive={isActive("/home")}
          />
          
          <SidebarItem 
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            href="/dashboard"
            isActive={isActive("/dashboard")}
          />
          
          <SidebarItem 
            icon={<ShoppingBasket className="h-5 w-5" />}
            label="Products"
            href="/products"
            isActive={isActive("/products")}
          />
          
          <SidebarItem 
            icon={<LineChart className="h-5 w-5" />}
            label="Analytics"
            href="/analytics"
            isActive={isActive("/analytics")}
          />
          
          <SidebarItem 
            icon={<WrenchIcon className="h-5 w-5" />}
            label="Maintenance"
            href="/maintenance"
            isActive={isActive("/maintenance")}
          />

          <SidebarItem 
            icon={<UsersIcon className="h-5 w-5" />}
            label="Renters"
            href="/renters"
            isActive={isActive("/renters")}
          />

          <SidebarItem 
            icon={<BarChart3Icon className="h-5 w-5" />}
            label="Revenue Reports"
            href="/revenue-reports"
            isActive={isActive("/revenue-reports")}
          />

          <SidebarItem 
            icon={<PieChartIcon className="h-5 w-5" />}
            label="Product Analytics"
            href="/product-analytics"
            isActive={isActive("/product-analytics")}
          />
          
          <SidebarItem 
            icon={<Database className="h-5 w-5" />}
            label="Data Queries"
            href="/data-queries"
            isActive={isActive("/data-queries")}
          />
        </nav>
      </div>
      
      <div className="mt-auto border-t p-4">
        {user ? (
          <>
            <div className={cn(
              "mb-4 flex gap-3 items-center",
              collapsed ? "justify-center" : "justify-start"
            )}>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {collapsed ? user.name[0] : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <SidebarItem 
                icon={<Settings className="h-5 w-5" />}
                label="Settings"
                href="/settings"
                isActive={isActive("/settings")}
              />
              
              <button onClick={() => logout()} className="w-full">
                <SidebarItem 
                  icon={<LogOut className="h-5 w-5" />}
                  label="Logout"
                  href="#"
                  isActive={false}
                />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <SidebarItem 
              icon={<Users className="h-5 w-5" />}
              label="Login"
              href="/login"
              isActive={isActive("/login")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
