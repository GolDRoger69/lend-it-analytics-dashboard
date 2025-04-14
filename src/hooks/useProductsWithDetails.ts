
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductWithDetails {
  product_id: number;
  name: string;
  category: string;
  sub_category?: string;
  rental_price: number;
  image_url?: string;
  owner_name?: string;
  avg_rating?: number;
  available_quantity?: number;
}

export function useProductsWithDetails() {
  return useQuery({
    queryKey: ['products-with-details'],
    queryFn: async () => {
      // Get products with owner information
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          category,
          sub_category,
          rental_price,
          available_quantity,
          users!products_owner_id_fkey (name)
        `);
      
      if (productsError) {
        toast.error(`Error fetching products: ${productsError.message}`);
        throw productsError;
      }

      // Get reviews for calculating average ratings
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating');
        
      if (reviewsError) {
        toast.error(`Error fetching reviews: ${reviewsError.message}`);
        throw reviewsError;
      }
      
      // Calculate average ratings for products
      const avgRatings = reviews.reduce((acc, review) => {
        const productId = review.product_id;
        if (!acc[productId]) {
          acc[productId] = { sum: 0, count: 0 };
        }
        acc[productId].sum += review.rating;
        acc[productId].count += 1;
        return acc;
      }, {} as Record<number, { sum: number, count: number }>);
      
      // Format the products with all required details
      const productsWithDetails: ProductWithDetails[] = products.map(product => {
        // Calculate average rating if reviews exist
        const productRatings = avgRatings[product.product_id];
        const avgRating = productRatings 
          ? productRatings.sum / productRatings.count
          : undefined;
        
        return {
          product_id: product.product_id,
          name: product.name,
          category: product.category,
          sub_category: product.sub_category,
          rental_price: product.rental_price,
          available_quantity: product.available_quantity,
          owner_name: product.users?.name,
          avg_rating: avgRating,
          // Add placeholder image URL
          image_url: `https://placehold.co/300x400?text=${encodeURIComponent(product.name)}`
        };
      });

      return productsWithDetails;
    }
  });
}
