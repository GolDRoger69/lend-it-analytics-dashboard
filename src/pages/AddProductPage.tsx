
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useProductCategories } from "@/integrations/supabase/hooks";

export function AddProductPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categoryData = { categories: [], subcategories: [] } } = useProductCategories();
  
  // Custom subcategory input for new subcategories
  const [newSubCategory, setNewSubCategory] = useState("");
  const [showCustomSubCategory, setShowCustomSubCategory] = useState(false);
  
  if (!user) {
    navigate("/login");
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !price || !quantity) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Determine which subcategory to use
      const finalSubCategory = showCustomSubCategory ? newSubCategory : subCategory;
      
      // Parse values
      const rentalPrice = parseFloat(price);
      const availableQty = parseInt(quantity);
      
      if (isNaN(rentalPrice) || rentalPrice <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
      
      if (isNaN(availableQty) || availableQty <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }
      
      // Insert the new product into the database
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          category,
          sub_category: finalSubCategory,
          rental_price: rentalPrice,
          available_quantity: availableQty,
          owner_id: user.user_id
        })
        .select();
      
      if (error) {
        console.error("Error adding product:", error);
        toast.error("Failed to add product: " + error.message);
        return;
      }
      
      toast.success("Product added successfully!");
      navigate("/products");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Product</CardTitle>
          <CardDescription>
            Add your product to the platform for renting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                required
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryData.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowCustomSubCategory(!showCustomSubCategory)}
                  className="text-xs"
                >
                  {showCustomSubCategory ? "Choose from existing" : "Create new"}
                </Button>
              </div>
              
              {showCustomSubCategory ? (
                <Input
                  id="custom-subcategory"
                  placeholder="Enter new subcategory"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <Select
                  value={subCategory}
                  onValueChange={setSubCategory}
                  disabled={isLoading}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryData.subcategories.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Rental Price ($ per day) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Available Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading}
            >
              {isLoading ? "Adding Product..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/products")}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
