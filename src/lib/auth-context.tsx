
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User } from "./mock-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  register: (userData: RegisterUserData) => Promise<boolean>;
}

interface RegisterUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
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
        .from("users")
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
          role: data.role as "renter" | "owner" | "admin" | "both"
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

  const register = async (userData: RegisterUserData) => {
    try {
      // Check if user with this email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("email", userData.email)
        .maybeSingle();

      if (checkError) {
        console.error("Registration error:", checkError);
        toast.error("Registration failed: " + checkError.message);
        return false;
      }

      if (existingUser) {
        toast.error("A user with this email already exists");
        return false;
      }

      // Insert the new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            name: userData.name,
            email: userData.email, 
            phone: userData.phone,
            password: userData.password, 
            role: userData.role 
          }
        ])
        .select();
      
      if (error) {
        console.error("Registration error:", error);
        toast.error("Registration failed: " + error.message);
        return false;
      }
      
      if (data && data.length > 0) {
        toast.success("Account created successfully");
        
        // Auto-login the user
        const loggedInUser = {
          user_id: data[0].user_id,
          name: data[0].name,
          email: data[0].email,
          phone: data[0].phone,
          role: data[0].role as "renter" | "owner" | "admin" | "both"
        };
        
        setUser(loggedInUser);
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred during registration");
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
      register
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
