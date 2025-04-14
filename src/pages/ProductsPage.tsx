
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterIcon, SearchIcon, X, Loader2, Star } from "lucide-react";
import { useProductCategories } from "@/integrations/supabase/hooks";
import { useProductsWithDetails } from "@/hooks/useProductsWithDetails";

type CategoryType = 'all' | string;
type SortOption = 'price-asc' | 'price-desc' | 'rating-desc';

export function ProductsPage() {
  const { data: products = [], isLoading: productsLoading } = useProductsWithDetails();
  const { data: categoryData = { categories: [], subcategories: [] }, isLoading: categoriesLoading } = useProductCategories();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [ratingRange, setRatingRange] = useState([0, 5]);
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");
  const [showFilters, setShowFilters] = useState(false);
  
  const subcategories = categoryData.subcategories;
  
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const toggleSubcategory = (subcategory: string) => {
    if (selectedSubcategories.includes(subcategory)) {
      setSelectedSubcategories(selectedSubcategories.filter(sc => sc !== subcategory));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcategory]);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange([0, 3000]);
    setRatingRange([0, 5]);
    setSelectedSubcategories([]);
    setSortOption("price-asc");
  };

  const filteredProducts = products
    .filter(product => 
      (searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory === "all" || product.category === selectedCategory) &&
      (selectedSubcategories.length === 0 || 
        (product.sub_category && selectedSubcategories.includes(product.sub_category))) &&
      product.rental_price >= priceRange[0] &&
      product.rental_price <= priceRange[1] &&
      ((product.avg_rating || 0) >= ratingRange[0] && 
       (product.avg_rating || 0) <= ratingRange[1])
    );
  
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-asc") {
      return a.rental_price - b.rental_price;
    } else if (sortOption === "price-desc") {
      return b.rental_price - a.rental_price;
    } else if (sortOption === "rating-desc") {
      const ratingA = a.avg_rating || 0;
      const ratingB = b.avg_rating || 0;
      return ratingB - ratingA;
    } else {
      return a.rental_price - b.rental_price;
    }
  });

  const isLoading = productsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Browse Products</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block lg:w-64 space-y-6 flex-shrink-0`}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold">Filters</h3>
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-0 text-sm"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value)}
                  >
                    <SelectTrigger id="category" className="w-full mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryData.categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="block mb-2">Sub-category</Label>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((subcategory) => (
                      <Badge
                        key={subcategory}
                        variant={selectedSubcategories.includes(subcategory) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => toggleSubcategory(subcategory)}
                      >
                        {subcategory}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Price Range</Label>
                    <span className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 3000]}
                    min={0}
                    max={3000}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="my-4"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Rating</Label>
                    <span className="text-sm text-muted-foreground">
                      {ratingRange[0]} - {ratingRange[1]} stars
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 5]}
                    min={0}
                    max={5}
                    step={0.5}
                    value={ratingRange}
                    onValueChange={setRatingRange}
                    className="my-4"
                  />
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-gray-300" />
                      <span className="text-xs ml-1">0</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs ml-1">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} products found
            </p>
            
            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="rating-desc">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(selectedCategory !== "all" || 
            selectedSubcategories.length > 0 || 
            searchQuery || 
            priceRange[0] > 0 || 
            priceRange[1] < 3000 ||
            ratingRange[0] > 0 ||
            ratingRange[1] < 5) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {selectedCategory}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedCategory("all")}
                  />
                </Badge>
              )}
              
              {selectedSubcategories.map(subcat => (
                <Badge key={subcat} variant="secondary" className="flex items-center gap-1 capitalize">
                  {subcat}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleSubcategory(subcat)}
                  />
                </Badge>
              ))}
              
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              
              {(priceRange[0] > 0 || priceRange[1] < 3000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Price: ${priceRange[0]} - ${priceRange[1]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setPriceRange([0, 3000])}
                  />
                </Badge>
              )}
              
              {(ratingRange[0] > 0 || ratingRange[1] < 5) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Rating: {ratingRange[0]} - {ratingRange[1]} stars
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setRatingRange([0, 5])}
                  />
                </Badge>
              )}
            </div>
          )}
          
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
              <Button 
                variant="link" 
                onClick={clearFilters}
                className="mt-2"
              >
                Clear filters and try again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map(product => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
