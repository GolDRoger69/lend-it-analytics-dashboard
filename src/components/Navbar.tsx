
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";

export function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-primary text-white p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 mr-2 rounded-md hover:bg-primary-700 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="text-2xl font-bold">
            Lend-IT
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center space-x-6">
          <Link to="/" className="hover:text-accent">Home</Link>
          <Link to="/products" className="hover:text-accent">Products</Link>
          <Link to="/analytics" className="hover:text-accent">Analytics</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-accent">Dashboard</Link>
              <div className="flex items-center space-x-2">
                <span>Hi, {user.name}</span>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-primary-700">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="border-white text-white bg-primary-700 hover:bg-white hover:text-primary">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        <div className="lg:hidden">
          <Button 
            variant="ghost"
            className="text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <User size={24} />}
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="lg:hidden bg-primary-800 mt-2 p-4 rounded-md">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/" 
              className="hover:text-accent px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="hover:text-accent px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/analytics" 
              className="hover:text-accent px-3 py-2 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="hover:text-accent px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-primary-700 w-full"
                  >
                    Login
                  </Button>
                </Link>
                <Link 
                  to="/register" 
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-primary w-full"
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
