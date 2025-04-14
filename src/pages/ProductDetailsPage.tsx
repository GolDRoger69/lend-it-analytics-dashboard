
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Star, Loader2 } from "lucide-react";

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))); // 7 days from now
  const [isRenting, setIsRenting] = useState(false);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_owner_id_fkey (
            name
          ),
          reviews (
            rating,
            comment,
            review_date,
            users (
              name
            )
          )
        `)
        .eq('product_id', parseInt(id))
        .single();
      
      if (error) throw error;
      
      // Calculate average rating
      const ratings = data.reviews.map((review: any) => review.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
        : 0;
      
      return {
        ...data,
        avg_rating: parseFloat(avgRating.toFixed(1)),
        // Generate placeholder image based on product name
        image_url: `https://placehold.co/600x400?text=${encodeURIComponent(data.name)}`
      };
    }
  });
  
  const handleRent = async () => {
    if (!user) {
      toast.error("Please log in to rent this product");
      navigate("/login");
      return;
    }
    
    if (!selectedStartDate || !selectedEndDate) {
      toast.error("Please select rental start and end dates");
      return;
    }
    
    if (selectedEndDate < selectedStartDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    
    // Calculate rental duration in days
    const durationMs = selectedEndDate.getTime() - selectedStartDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    // Calculate total cost based on rental price and duration
    const totalCost = product ? parseFloat((product.rental_price * durationDays).toFixed(2)) : 0;
    
    setIsRenting(true);
    
    try {
      // Check if product is available (quantity > 0)
      if (product && product.available_quantity < 1) {
        toast.error("This product is currently not available");
        setIsRenting(false);
        return;
      }
      
      // Create rental record
      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .insert([
          {
            product_id: parseInt(id!),
            renter_id: user.user_id,
            rental_start: selectedStartDate.toISOString().split('T')[0],
            rental_end: selectedEndDate.toISOString().split('T')[0],
            total_cost: totalCost,
            status: 'active'
          }
        ])
        .select();
      
      if (rentalError) throw rentalError;
      
      // Update product available quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ available_quantity: product!.available_quantity - 1 })
        .eq('product_id', parseInt(id!));
      
      if (updateError) throw updateError;
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            rental_id: rental[0].rental_id,
            user_id: user.user_id,
            amount: totalCost,
            payment_status: 'completed',
            payment_date: new Date().toISOString()
          }
        ]);
      
      if (paymentError) throw paymentError;
      
      toast.success("Product rented successfully!");
      navigate("/dashboard");
      
    } catch (error: any) {
      toast.error(`Failed to rent product: ${error.message}`);
      console.error("Rental error:", error);
    } finally {
      setIsRenting(false);
    }
  };
  
  // Helper function to render star ratings
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={18}
            className={index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The product you're looking for could not be found or has been removed.
        </p>
        <Button onClick={() => navigate("/products")}>
          Browse All Products
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-md"
          />
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              ${product.rental_price}/day
            </Badge>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-1">
                {renderStarRating(product.avg_rating)}
                <span className="text-sm ml-1">({product.avg_rating})</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              {product.category} &gt; {product.sub_category}
            </p>
            <p className="mt-2">
              Owner: <span className="font-medium">{product.users?.name}</span>
            </p>
          </div>
          
          <Separator />
          
          {/* Rental Form */}
          <Card>
            <CardHeader>
              <CardTitle>Rent This Item</CardTitle>
              <CardDescription>
                Select your rental dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 font-medium">Start Date</p>
                  <Calendar
                    mode="single"
                    selected={selectedStartDate}
                    onSelect={setSelectedStartDate}
                    disabled={(date) => date < new Date()}
                    className="border rounded-md"
                  />
                </div>
                <div>
                  <p className="mb-2 font-medium">End Date</p>
                  <Calendar
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    disabled={(date) => date < (selectedStartDate || new Date())}
                    className="border rounded-md"
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Price per day:</span>
                  <span>${product.rental_price}</span>
                </div>
                
                {selectedStartDate && selectedEndDate && (
                  <>
                    <div className="flex justify-between mb-2">
                      <span>Duration:</span>
                      <span>
                        {Math.ceil(
                          (selectedEndDate.getTime() - selectedStartDate.getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )} days
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>
                        ${(
                          product.rental_price * 
                          Math.ceil(
                            (selectedEndDate.getTime() - selectedStartDate.getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleRent}
                  disabled={!user || isRenting || product.available_quantity < 1}
                >
                  {isRenting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : product.available_quantity < 1 ? (
                    "Out of Stock"
                  ) : (
                    `Rent Now (${product.available_quantity} available)`
                  )}
                </Button>
                
                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Please <a href="/login" className="underline text-primary">log in</a> to rent this item
                  </p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Product Reviews */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Reviews</h2>
        
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStarRating(review.rating)}
                        <span className="font-medium">{review.users.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(review.review_date).toLocaleDateString()}
                      </p>
                      <p>{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">No reviews yet for this product</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
