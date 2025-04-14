
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StarIcon, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Create a schema for rental form
const rentalSchema = z.object({
  rentalStart: z.date({
    required_error: "Rental start date is required",
  }),
  rentalEnd: z.date({
    required_error: "Rental end date is required",
  }),
  quantity: z.number().min(1, "Must rent at least 1 item"),
});

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isRenting, setIsRenting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_owner_id_fkey(name)
        `)
        .eq('product_id', id)
        .single();
      
      if (error) {
        toast.error(`Error fetching product details: ${error.message}`);
        throw error;
      }

      // Fetch product reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, comment, review_date, users!reviews_user_id_fkey(name)')
        .eq('product_id', id);
      
      if (reviewsError) {
        toast.error(`Error fetching reviews: ${reviewsError.message}`);
      }

      // Calculate average rating
      let avgRating = 0;
      if (reviews && reviews.length > 0) {
        avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      }

      return {
        ...data,
        owner_name: data.users?.name,
        reviews: reviews || [],
        avg_rating: avgRating
      };
    }
  });

  // Set up rental form
  const form = useForm<z.infer<typeof rentalSchema>>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      quantity: 1
    },
  });

  // Handle rental submission
  async function onSubmit(values: z.infer<typeof rentalSchema>) {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to rent products");
      navigate("/login");
      return;
    }

    if (!product) return;
    
    const rentalStart = format(values.rentalStart, "yyyy-MM-dd");
    const rentalEnd = format(values.rentalEnd, "yyyy-MM-dd");
    
    // Calculate duration in days
    const startDate = new Date(rentalStart);
    const endDate = new Date(rentalEnd);
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    // Calculate total cost
    const totalCost = product.rental_price * differenceInDays * values.quantity;
    
    setIsRenting(true);
    
    try {
      // Create rental record
      const { data, error } = await supabase
        .from('rentals')
        .insert([
          {
            renter_id: user.user_id,
            product_id: product.product_id,
            rental_start: rentalStart,
            rental_end: rentalEnd,
            total_cost: totalCost,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) {
        toast.error(`Error creating rental: ${error.message}`);
        return;
      }
      
      // Update product availability
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          available_quantity: product.available_quantity - values.quantity 
        })
        .eq('product_id', product.product_id);
      
      if (updateError) {
        toast.error(`Error updating product quantity: ${updateError.message}`);
        return;
      }
      
      toast.success("Product rented successfully!");
      setIsDialogOpen(false);
      
      // Reload the page to show updated availability
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error renting product:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsRenting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.available_quantity < 1;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={product.image_url || `https://placehold.co/800x800?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.avg_rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">({product.avg_rating.toFixed(1)})</span>
              <span className="mx-2">•</span>
              <span className="text-muted-foreground">
                {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">${product.rental_price.toFixed(2)}</div>
            <div className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">
              Per Day
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium capitalize">{product.category}</span>
            </div>
            {product.sub_category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub-category:</span>
                <span className="font-medium capitalize">{product.sub_category}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listed by:</span>
              <span className="font-medium">{product.owner_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                {isOutOfStock ? 'Out of Stock' : `${product.available_quantity} in stock`}
              </span>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="w-full" 
                disabled={isOutOfStock || !isAuthenticated}
              >
                {isOutOfStock ? 'Out of Stock' : 'Rent Now'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Rent {product.name}</DialogTitle>
                <DialogDescription>
                  Choose your rental dates and quantity.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="rentalStart"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When you want to receive the item.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rentalEnd"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.getValues("rentalStart");
                                return (
                                  !startDate ||
                                  date <= startDate ||
                                  date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                                );
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When you plan to return the item.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={product.available_quantity}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum: {product.available_quantity} items
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isRenting}>
                      {isRenting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Complete Rental"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {!isAuthenticated && (
            <p className="text-sm text-center text-muted-foreground">
              Please <a href="/login" className="text-primary hover:underline">log in</a> to rent this product
            </p>
          )}
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet for this product.</p>
        ) : (
          <div className="space-y-6">
            {product.reviews.map((review, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{review.users?.name}</CardTitle>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <CardDescription>
                    {new Date(review.review_date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
