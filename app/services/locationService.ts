import { supabase } from '../lib/supabase';

export interface Location {
  id: number;
  name: string;
}

export const locationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Location[];
  },

  async save(name: string) {
    const { data, error } = await supabase
      .from('locations')
      .upsert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data as Location;
  }
};
