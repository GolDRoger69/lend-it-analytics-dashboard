
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "./mock-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if there's a user stored in local storage for persistence
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // In a real app with proper auth, we would use supabase.auth.signInWithPassword
      // For now, we'll use the database directly to check credentials
      const { data, error } = await supabase
        .from("users") // Changed from "Users" to "users" to match the case in Supabase
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Login error:", error);
        toast.error("Login failed: " + error.message);
        return false;
      }

      if (data && data.password === password) {
        // In a real app, we would never store or compare raw passwords like this
        const loggedInUser = {
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role as "renter" | "owner" | "admin"
        };
        
        setUser(loggedInUser);
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
        return true;
      }
      
      toast.error("Invalid email or password");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
