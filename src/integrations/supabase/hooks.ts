
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { toast } from "sonner";

// Users
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Users')
        .select('*');
      
      if (error) {
        toast.error(`Error fetching users: ${error.message}`);
        throw error;
      }
      
      return data;
    }
  });
};

// Products
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Products')
        .select(`
          *,
          Users(name)
        `);
      
      if (error) {
        toast.error(`Error fetching products: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(product => ({
        ...product,
        owner_name: product.Users?.name
      }));
    }
  });
};

// Rentals with joined data
export const useRentalsWithDetails = () => {
  return useQuery({
    queryKey: ['rentals-with-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Rentals')
        .select(`
          rental_id,
          total_cost,
          status,
          rental_start,
          rental_end,
          Users!Rentals_renter_id_fkey(name),
          Products(name, Users(name))
        `);
      
      if (error) {
        toast.error(`Error fetching rentals: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(rental => ({
        rental_id: rental.rental_id,
        renter_name: rental.Users?.name,
        product_name: rental.Products?.name,
        owner_name: rental.Products?.Users?.name,
        total_cost: rental.total_cost,
        status: rental.status,
        rental_start: rental.rental_start,
        rental_end: rental.rental_end
      }));
    }
  });
};

// RentalPairs (simplified rental data)
export const useRentalPairs = () => {
  return useQuery({
    queryKey: ['rental-pairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Rentals')
        .select(`
          rental_id,
          Users!Rentals_renter_id_fkey(name),
          Products(name, Users(name)),
          total_cost
        `);
      
      if (error) {
        toast.error(`Error fetching rental pairs: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(rental => ({
        rental_id: rental.rental_id,
        renter_name: rental.Users?.name,
        product_name: rental.Products?.name,
        owner_name: rental.Products?.Users?.name,
        total_cost: rental.total_cost
      }));
    }
  });
};

// Products by owner
export const useProductsByOwner = () => {
  return useQuery({
    queryKey: ['products-by-owner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Users')
        .select(`
          name,
          Products(product_id)
        `)
        .eq('role', 'owner');
      
      if (error) {
        toast.error(`Error fetching products by owner: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data
        .filter(user => user.Products?.length > 0)
        .map(user => ({
          owner_name: user.name,
          total_products: user.Products?.length || 0
        }));
    }
  });
};

// Maintenance records
export const useMaintenanceRecords = () => {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Maintenance')
        .select(`
          maintenance_id,
          last_cleaned,
          next_cleaning_due,
          status,
          Products(name)
        `);
      
      if (error) {
        toast.error(`Error fetching maintenance records: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(record => ({
        ...record,
        product_name: record.Products?.name
      }));
    }
  });
};

// Current user's products (for owners)
export const useMyProducts = (userId: number | null) => {
  return useQuery({
    queryKey: ['my-products', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .eq('owner_id', userId);
      
      if (error) {
        toast.error(`Error fetching your products: ${error.message}`);
        throw error;
      }
      
      return data;
    },
    enabled: !!userId
  });
};

// Current user's rentals (for renters)
export const useMyRentals = (userId: number | null) => {
  return useQuery({
    queryKey: ['my-rentals', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('Rentals')
        .select(`
          *,
          Products(name, Users(name))
        `)
        .eq('renter_id', userId);
      
      if (error) {
        toast.error(`Error fetching your rentals: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(rental => ({
        ...rental,
        product_name: rental.Products?.name,
        owner_name: rental.Products?.Users?.name
      }));
    },
    enabled: !!userId
  });
};

// Maintenance records for user's products
export const useMyProductMaintenance = (userId: number | null) => {
  return useQuery({
    queryKey: ['my-maintenance', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: products, error: productsError } = await supabase
        .from('Products')
        .select('product_id')
        .eq('owner_id', userId);
      
      if (productsError) {
        toast.error(`Error fetching your products: ${productsError.message}`);
        throw productsError;
      }
      
      if (products.length === 0) return [];
      
      const productIds = products.map(p => p.product_id);
      
      const { data, error } = await supabase
        .from('Maintenance')
        .select(`
          *,
          Products(name)
        `)
        .in('product_id', productIds);
      
      if (error) {
        toast.error(`Error fetching maintenance records: ${error.message}`);
        throw error;
      }
      
      // Format the data to match the expected structure
      return data.map(record => ({
        ...record,
        product_name: record.Products?.name
      }));
    },
    enabled: !!userId
  });
};
