
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProductsWithDetails } from "@/hooks/useProductsWithDetails";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, BarChart3, Search, ShoppingCart } from "lucide-react";
import { Loader2 } from "lucide-react";

export function HomePage() {
  // Get featured products using the hook
  const { data: products = [], isLoading } = useProductsWithDetails();
  
  // Select just 4 products for the featured section
  const featuredProducts = products.slice(0, 4);
  
  return (
    <div className="space-y-12 pb-8">
      {/* Hero section */}
      <section className="relative bg-primary rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1200x600?text=')] bg-cover bg-center opacity-20" />
        <div className="relative container mx-auto px-6 py-24 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Rent What You Need, Share What You Don't
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Lend-IT is the premier platform for renting high-quality products from trusted owners. Browse our collection or list your own items to make extra income.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  Browse Products
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Become a Lender
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Find What You Need</h3>
            <p className="text-muted-foreground">
              Browse our extensive catalog of high-quality products available for rent in your area.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rent with Confidence</h3>
            <p className="text-muted-foreground">
              Secure payment, verified owners, and quality assurance make renting simple and safe.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">List & Earn</h3>
            <p className="text-muted-foreground">
              Turn your unused items into income by listing them on our platform for others to rent.
            </p>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link to="/products" className="text-primary flex items-center hover:underline">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>
      
      {/* CTA */}
      <section className="bg-accent/10 rounded-xl">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start renting?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
            Join thousands of users who are already earning and saving with Lend-IT's rental marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-primary hover:bg-primary-800">
                Sign Up Now
              </Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
