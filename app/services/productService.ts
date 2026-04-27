import { supabase } from '../lib/supabase';

export interface Product {
  id: number;
  name: string;
  price: number;
  wholesale_price: number;
  stock: number;
  created_at?: string;
}

export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Product[];
  },

  async save(product: Partial<Product> & { name: string }) {
    const { data, error } = await supabase
      .from('products')
      .upsert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async recordProduction(productId: number, quantity: number) {
    const { error } = await supabase.rpc('record_production', {
      p_product_id: productId,
      p_quantity: quantity
    });
    
    if (error) throw error;
  }
};
