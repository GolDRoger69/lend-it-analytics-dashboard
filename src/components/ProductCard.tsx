
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/mock-data";
import { StarIcon } from "lucide-react";

interface ProductCardProps {
  product: Product & { 
    owner_name?: string;
    avg_rating?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100">
        <img
          src={product.image_url || "https://placehold.co/300x400?text=No+Image"}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {product.owner_name ? `By ${product.owner_name}` : ""}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {product.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-grow">
        {product.sub_category && (
          <div className="text-sm text-muted-foreground mt-1 capitalize">
            {product.sub_category}
          </div>
        )}
        
        {product.avg_rating && (
          <div className="flex items-center mt-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.avg_rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-sm ml-1">({product.avg_rating.toFixed(1)})</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="font-bold">${product.rental_price.toFixed(2)} / day</div>
        <Link to={`/products/${product.product_id}`}>
          <Button size="sm" variant="outline">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
