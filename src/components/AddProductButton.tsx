
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AddProductButton() {
  const { isAuthenticated, user } = useAuth();
  
  // Only show button if user is authenticated and is a renter or has the "both" role
  if (!isAuthenticated || (user?.role !== "renter" && user?.role !== "both")) {
    return null;
  }
  
  return (
    <Link to="/list-product">
      <Button className="flex items-center gap-1">
        <Plus className="h-4 w-4" />
        Add Product
      </Button>
    </Link>
  );
}
