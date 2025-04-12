
export type UserRole = 'renter' | 'owner' | 'admin';

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface Product {
  product_id: number;
  name: string;
  category: 'mens' | 'womens' | 'accessories';
  sub_category?: string;
  owner_id: number;
  owner_name?: string; // For joined queries
  rental_price: number;
  available_quantity: number;
  image_url?: string;
}

export interface Rental {
  rental_id: number;
  renter_id: number;
  renter_name?: string; // For joined queries
  product_id: number;
  product_name?: string; // For joined queries
  owner_name?: string; // For joined queries
  rental_start: string;
  rental_end: string;
  total_cost: number;
  status: 'ongoing' | 'completed' | 'canceled';
}

export interface Payment {
  payment_id: number;
  rental_id: number;
  user_id: number;
  amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_date: string;
}

export interface Review {
  review_id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
  review_date: string;
}

export interface Maintenance {
  maintenance_id: number;
  product_id: number;
  last_cleaned: string;
  next_cleaning_due?: string;
  status: 'pending' | 'completed';
}

// Mock data
const users: User[] = [
  { user_id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-1234', role: 'renter' },
  { user_id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678', role: 'owner' },
  { user_id: 3, name: 'Admin User', email: 'admin@example.com', phone: '555-9012', role: 'admin' },
  { user_id: 4, name: 'Alice Johnson', email: 'alice@example.com', phone: '555-3456', role: 'owner' },
  { user_id: 5, name: 'Bob Williams', email: 'bob@example.com', phone: '555-7890', role: 'renter' },
  { user_id: 6, name: 'Carol Brown', email: 'carol@example.com', phone: '555-2345', role: 'renter' },
  { user_id: 7, name: 'David Miller', email: 'david@example.com', phone: '555-6789', role: 'owner' },
  { user_id: 8, name: 'Eva Wilson', email: 'eva@example.com', phone: '555-0123', role: 'renter' },
];

const products: Product[] = [
  { product_id: 1, name: 'Formal Tuxedo', category: 'mens', sub_category: 'tuxedo', owner_id: 2, rental_price: 1200, available_quantity: 5, image_url: 'https://placehold.co/300x400?text=Tuxedo' },
  { product_id: 2, name: 'Evening Gown', category: 'womens', sub_category: 'gown', owner_id: 2, rental_price: 1100, available_quantity: 3, image_url: 'https://placehold.co/300x400?text=Evening+Gown' },
  { product_id: 3, name: 'Diamond Necklace', category: 'accessories', sub_category: 'jewelry', owner_id: 4, rental_price: 1500, available_quantity: 2, image_url: 'https://placehold.co/300x400?text=Necklace' },
  { product_id: 4, name: 'Leather Jacket', category: 'mens', sub_category: 'casual', owner_id: 4, rental_price: 800, available_quantity: 4, image_url: 'https://placehold.co/300x400?text=Leather+Jacket' },
  { product_id: 5, name: 'Cocktail Dress', category: 'womens', sub_category: 'dress', owner_id: 7, rental_price: 950, available_quantity: 6, image_url: 'https://placehold.co/300x400?text=Cocktail+Dress' },
  { product_id: 6, name: 'Designer Watch', category: 'accessories', sub_category: 'watch', owner_id: 7, rental_price: 1300, available_quantity: 3, image_url: 'https://placehold.co/300x400?text=Watch' },
  { product_id: 7, name: 'Business Suit', category: 'mens', sub_category: 'suit', owner_id: 2, rental_price: 1100, available_quantity: 8, image_url: 'https://placehold.co/300x400?text=Business+Suit' },
  { product_id: 8, name: 'Wedding Dress', category: 'womens', sub_category: 'bridal', owner_id: 4, rental_price: 2500, available_quantity: 2, image_url: 'https://placehold.co/300x400?text=Wedding+Dress' },
  { product_id: 9, name: 'Designer Handbag', category: 'accessories', sub_category: 'bag', owner_id: 7, rental_price: 900, available_quantity: 5, image_url: 'https://placehold.co/300x400?text=Handbag' },
  { product_id: 10, name: 'Luxury Scarf', category: 'accessories', sub_category: 'scarf', owner_id: 4, rental_price: 400, available_quantity: 10, image_url: 'https://placehold.co/300x400?text=Luxury+Scarf' },
];

const rentals: Rental[] = [
  { rental_id: 1, renter_id: 1, product_id: 1, rental_start: '2023-01-01', rental_end: '2023-01-03', total_cost: 2400, status: 'completed' },
  { rental_id: 2, renter_id: 5, product_id: 2, rental_start: '2023-01-05', rental_end: '2023-01-07', total_cost: 2200, status: 'completed' },
  { rental_id: 3, renter_id: 6, product_id: 3, rental_start: '2023-01-10', rental_end: '2023-01-12', total_cost: 3000, status: 'completed' },
  { rental_id: 4, renter_id: 8, product_id: 4, rental_start: '2023-01-15', rental_end: '2023-01-17', total_cost: 1600, status: 'completed' },
  { rental_id: 5, renter_id: 1, product_id: 5, rental_start: '2023-02-01', rental_end: '2023-02-03', total_cost: 1900, status: 'completed' },
  { rental_id: 6, renter_id: 5, product_id: 6, rental_start: '2023-02-05', rental_end: '2023-02-08', total_cost: 3900, status: 'completed' },
  { rental_id: 7, renter_id: 6, product_id: 7, rental_start: '2023-04-10', rental_end: '2023-04-14', total_cost: 4400, status: 'ongoing' },
  { rental_id: 8, renter_id: 8, product_id: 8, rental_start: '2023-04-15', rental_end: '2023-04-16', total_cost: 2500, status: 'ongoing' },
];

const payments: Payment[] = [
  { payment_id: 1, rental_id: 1, user_id: 1, amount: 2400, payment_status: 'completed', payment_date: '2023-01-01' },
  { payment_id: 2, rental_id: 2, user_id: 5, amount: 2200, payment_status: 'completed', payment_date: '2023-01-05' },
  { payment_id: 3, rental_id: 3, user_id: 6, amount: 3000, payment_status: 'completed', payment_date: '2023-01-10' },
  { payment_id: 4, rental_id: 4, user_id: 8, amount: 1600, payment_status: 'completed', payment_date: '2023-01-15' },
  { payment_id: 5, rental_id: 5, user_id: 1, amount: 1900, payment_status: 'completed', payment_date: '2023-02-01' },
  { payment_id: 6, rental_id: 6, user_id: 5, amount: 3900, payment_status: 'completed', payment_date: '2023-02-05' },
  { payment_id: 7, rental_id: 7, user_id: 6, amount: 4400, payment_status: 'pending', payment_date: '2023-04-10' },
  { payment_id: 8, rental_id: 8, user_id: 8, amount: 2500, payment_status: 'pending', payment_date: '2023-04-15' },
];

const reviews: Review[] = [
  { review_id: 1, user_id: 1, product_id: 1, rating: 5, comment: 'Great tuxedo, perfect fit!', review_date: '2023-01-04' },
  { review_id: 2, user_id: 5, product_id: 2, rating: 4, comment: 'Beautiful gown, minor issue with zipper.', review_date: '2023-01-08' },
  { review_id: 3, user_id: 6, product_id: 3, rating: 5, comment: 'Stunning necklace, received many compliments.', review_date: '2023-01-13' },
  { review_id: 4, user_id: 8, product_id: 4, rating: 3, comment: 'Good jacket, but had a small stain.', review_date: '2023-01-18' },
  { review_id: 5, user_id: 1, product_id: 5, rating: 5, comment: 'Perfect for the occasion!', review_date: '2023-02-04' },
  { review_id: 6, user_id: 5, product_id: 6, rating: 4, comment: 'Beautiful watch, ran a bit slow.', review_date: '2023-02-09' },
];

const maintenance: Maintenance[] = [
  { maintenance_id: 1, product_id: 1, last_cleaned: '2023-01-05', next_cleaning_due: '2023-02-05', status: 'completed' },
  { maintenance_id: 2, product_id: 2, last_cleaned: '2023-01-08', next_cleaning_due: '2023-02-08', status: 'completed' },
  { maintenance_id: 3, product_id: 3, last_cleaned: '2023-01-13', next_cleaning_due: '2023-02-13', status: 'completed' },
  { maintenance_id: 4, product_id: 4, last_cleaned: '2023-01-19', next_cleaning_due: '2023-02-19', status: 'completed' },
  { maintenance_id: 5, product_id: 5, last_cleaned: '2023-02-04', next_cleaning_due: '2023-03-04', status: 'completed' },
  { maintenance_id: 6, product_id: 6, last_cleaned: '2023-02-09', next_cleaning_due: '2023-03-09', status: 'completed' },
  { maintenance_id: 7, product_id: 7, last_cleaned: '2023-03-01', next_cleaning_due: '2023-04-01', status: 'pending' },
  { maintenance_id: 8, product_id: 8, last_cleaned: '2023-03-05', next_cleaning_due: '2023-04-05', status: 'pending' },
  { maintenance_id: 9, product_id: 9, last_cleaned: '2023-03-10', next_cleaning_due: '2023-04-10', status: 'pending' },
  { maintenance_id: 10, product_id: 10, last_cleaned: '2023-03-15', next_cleaning_due: '2023-04-15', status: 'pending' },
];

// Mock API functions that simulate querying the backend
export const mockApi = {
  // Find renters
  findRenters: () => {
    return users.filter(user => user.role === 'renter');
  },

  // Find renter, product, and owner pairs
  findRentalPairs: () => {
    return rentals.map(rental => {
      const renter = users.find(u => u.user_id === rental.renter_id);
      const product = products.find(p => p.product_id === rental.product_id);
      const owner = users.find(u => u.user_id === product?.owner_id);
      
      return {
        rental_id: rental.rental_id,
        renter_name: renter?.name,
        product_name: product?.name,
        owner_name: owner?.name
      };
    });
  },

  // How many products a user is renting (products owned by user)
  productsByOwner: () => {
    const result: { owner_name: string; total_products: number }[] = [];
    
    users.forEach(user => {
      if (user.role === 'owner') {
        const count = products.filter(p => p.owner_id === user.user_id).length;
        result.push({
          owner_name: user.name,
          total_products: count
        });
      }
    });
    
    return result;
  },

  // How many products a user is renting, filter by more than X products
  productsByOwnerMoreThanX: (minCount: number = 2) => {
    return mockApi.productsByOwner().filter(item => item.total_products > minCount);
  },

  // Buyers with total spending more than average spending
  highSpendingRenters: () => {
    const rentalsByRenter: { [key: number]: number } = {};
    rentals.forEach(r => {
      if (!rentalsByRenter[r.renter_id]) {
        rentalsByRenter[r.renter_id] = 0;
      }
      rentalsByRenter[r.renter_id] += r.total_cost;
    });
    
    const totalRentals = Object.values(rentalsByRenter);
    const avgSpending = totalRentals.reduce((a, b) => a + b, 0) / totalRentals.length;
    
    const highSpenders = Object.entries(rentalsByRenter)
      .filter(([_, total]) => total > avgSpending)
      .map(([renterId]) => parseInt(renterId));
    
    return users
      .filter(u => highSpenders.includes(u.user_id))
      .map(u => ({ name: u.name }));
  },

  // List of products not yet rented
  productsNotRented: () => {
    const rentedProductIds = rentals.map(r => r.product_id);
    return products
      .filter(p => !rentedProductIds.includes(p.product_id))
      .map(p => ({ product_id: p.product_id, name: p.name }));
  },

  // Products and average rental duration
  avgRentalDuration: () => {
    const productDurations: { [key: number]: number[] } = {};
    
    rentals.forEach(r => {
      const start = new Date(r.rental_start);
      const end = new Date(r.rental_end);
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      
      if (!productDurations[r.product_id]) {
        productDurations[r.product_id] = [];
      }
      
      productDurations[r.product_id].push(days);
    });
    
    return Object.entries(productDurations).map(([productId, durations]) => {
      const product = products.find(p => p.product_id === parseInt(productId));
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      return {
        product_name: product?.name,
        avg_duration: avgDuration
      };
    });
  },

  // Top 5 products with the highest revenue
  topProductsByRevenue: (limit: number = 5) => {
    const productRevenue: { [key: number]: number } = {};
    
    rentals.forEach(r => {
      if (!productRevenue[r.product_id]) {
        productRevenue[r.product_id] = 0;
      }
      
      productRevenue[r.product_id] += r.total_cost;
    });
    
    return Object.entries(productRevenue)
      .map(([productId, revenue]) => {
        const product = products.find(p => p.product_id === parseInt(productId));
        return {
          product_name: product?.name,
          revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  // Products with rental price above category average
  productsAboveCategoryAvg: () => {
    const categoryAvgs: { [key: string]: number } = {};
    
    // Calculate category averages
    products.forEach(p => {
      if (!categoryAvgs[p.category]) {
        const categoryProducts = products.filter(prod => prod.category === p.category);
        const totalPrice = categoryProducts.reduce((sum, prod) => sum + prod.rental_price, 0);
        categoryAvgs[p.category] = totalPrice / categoryProducts.length;
      }
    });
    
    return products
      .filter(p => p.rental_price > categoryAvgs[p.category])
      .map(p => ({ 
        name: p.name, 
        category: p.category, 
        rental_price: p.rental_price 
      }));
  },

  // List of owners and admins
  ownersAndAdmins: () => {
    return users
      .filter(u => u.role === 'owner' || u.role === 'admin')
      .map(u => ({ email: u.email, role: u.role }));
  },

  // Users with role-specific names
  usersWithRoleLabels: () => {
    return users.map(u => ({
      name: u.name,
      role_label: u.role === 'renter' 
        ? 'Customer' 
        : u.role === 'owner' 
          ? 'Product Lister' 
          : 'Administrator'
    }));
  },

  // Filter by category (e.g. mens), subcategory (e.g. tuxedo), and price
  filterProducts: (
    category: string, 
    subCategory?: string, 
    maxPrice?: number
  ) => {
    return products.filter(p => 
      p.category === category &&
      (!subCategory || p.sub_category === subCategory) &&
      (!maxPrice || p.rental_price < maxPrice)
    );
  },

  // Filter by womens category, rating >= 4, and price < 1300
  filterWomensWithRating: (minRating: number = 4, maxPrice: number = 1300) => {
    const productRatings: { [key: number]: number[] } = {};
    
    reviews.forEach(r => {
      if (!productRatings[r.product_id]) {
        productRatings[r.product_id] = [];
      }
      
      productRatings[r.product_id].push(r.rating);
    });
    
    return products
      .filter(p => 
        p.category === 'womens' &&
        p.rental_price < maxPrice &&
        productRatings[p.product_id] &&
        (productRatings[p.product_id].reduce((a, b) => a + b, 0) / 
         productRatings[p.product_id].length) >= minRating
      )
      .map(p => ({
        product_id: p.product_id,
        name: p.name,
        rental_price: p.rental_price,
        avg_rating: productRatings[p.product_id] 
          ? productRatings[p.product_id].reduce((a, b) => a + b, 0) / productRatings[p.product_id].length
          : 0
      }));
  },

  // Filter products by quantity > X and last cleaned in previous month
  filterByQuantityAndCleaning: (
    category: string = 'accessories', 
    minQuantity: number = 3
  ) => {
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    return products
      .filter(p => {
        const maintenanceRecord = maintenance.find(m => m.product_id === p.product_id);
        
        if (!maintenanceRecord) return false;
        
        const cleaningDate = new Date(maintenanceRecord.last_cleaned);
        return p.category === category &&
               p.available_quantity > minQuantity &&
               cleaningDate.getMonth() === prevMonth.getMonth() &&
               cleaningDate.getFullYear() === prevMonth.getFullYear();
      })
      .map(p => {
        const maintenanceRecord = maintenance.find(m => m.product_id === p.product_id);
        return {
          product_id: p.product_id,
          name: p.name,
          available_quantity: p.available_quantity,
          last_cleaned: maintenanceRecord?.last_cleaned
        };
      });
  },

  // Sort mens and womens products by average rating
  sortProductsByRating: () => {
    const productRatings: { [key: number]: number[] } = {};
    
    reviews.forEach(r => {
      if (!productRatings[r.product_id]) {
        productRatings[r.product_id] = [];
      }
      
      productRatings[r.product_id].push(r.rating);
    });
    
    return products
      .filter(p => p.category === 'mens' || p.category === 'womens')
      .map(p => {
        const ratings = productRatings[p.product_id] || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
        
        return {
          product_id: p.product_id,
          name: p.name,
          category: p.category,
          avg_rating: avgRating
        };
      })
      .sort((a, b) => b.avg_rating - a.avg_rating);
  },

  // Find users who list more than X products and have spent more than Y on rentals
  findPowerUsers: (minProducts: number = 2, minSpending: number = 700) => {
    const usersWithCount: {
      user_id: number;
      name: string;
      email: string;
      total_products_listed: number;
      total_spent_on_rentals: number;
    }[] = [];
    
    users.forEach(user => {
      const productsListed = products.filter(p => p.owner_id === user.user_id).length;
      
      const rentalsForUser = rentals.filter(r => r.renter_id === user.user_id);
      const totalSpent = rentalsForUser.reduce((sum, r) => sum + r.total_cost, 0);
      
      if (productsListed > minProducts && totalSpent > minSpending) {
        usersWithCount.push({
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          total_products_listed: productsListed,
          total_spent_on_rentals: totalSpent
        });
      }
    });
    
    return usersWithCount;
  },

  // Get all products (with owner information joined)
  getAllProducts: () => {
    return products.map(p => {
      const owner = users.find(u => u.user_id === p.owner_id);
      return {
        ...p,
        owner_name: owner?.name
      };
    });
  },

  // Get product by ID
  getProductById: (id: number) => {
    const product = products.find(p => p.product_id === id);
    if (!product) return null;
    
    const owner = users.find(u => u.user_id === product.owner_id);
    const productReviews = reviews.filter(r => r.product_id === id);
    
    return {
      ...product,
      owner_name: owner?.name,
      reviews: productReviews.map(r => {
        const reviewer = users.find(u => u.user_id === r.user_id);
        return {
          ...r,
          reviewer_name: reviewer?.name
        };
      })
    };
  },

  // Get user authenticated details
  getCurrentUser: () => {
    // Simulating a logged-in user (owner in this case)
    return users.find(u => u.user_id === 2);
  },

  // Get my products (for logged-in owner)
  getMyProducts: () => {
    const currentUser = mockApi.getCurrentUser();
    if (!currentUser || currentUser.role !== 'owner') return [];
    
    return products.filter(p => p.owner_id === currentUser.user_id);
  },

  // Get my rentals (for logged-in renter)
  getMyRentals: () => {
    const currentUser = mockApi.getCurrentUser();
    if (!currentUser) return [];
    
    return rentals
      .filter(r => r.renter_id === currentUser.user_id)
      .map(r => {
        const product = products.find(p => p.product_id === r.product_id);
        const owner = product ? users.find(u => u.user_id === product.owner_id) : undefined;
        
        return {
          ...r,
          product_name: product?.name,
          owner_name: owner?.name,
          image_url: product?.image_url
        };
      });
  },

  // Get maintenance records for my products
  getMyProductMaintenance: () => {
    const myProducts = mockApi.getMyProducts();
    const productIds = myProducts.map(p => p.product_id);
    
    return maintenance
      .filter(m => productIds.includes(m.product_id))
      .map(m => {
        const product = products.find(p => p.product_id === m.product_id);
        return {
          ...m,
          product_name: product?.name
        };
      });
  }
};
