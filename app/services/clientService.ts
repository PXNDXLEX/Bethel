import { supabase } from '../lib/supabase';

export interface Client {
  id: number;
  name: string;
  phone: string;
  created_at?: string;
}

export const clientService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Client[];
  },

  async save(client: Partial<Client> & { name: string }) {
    const { data, error } = await supabase
      .from('clients')
      .upsert(client)
      .select()
      .single();
    
    if (error) throw error;
    return data as Client;
  },

  async getStats() {
    // Top clientes por inversión (total_usd en pedidos)
    const { data, error } = await supabase
      .from('orders')
      .select('client_id, clients(name, phone), total_usd')
      .not('client_id', 'is', null);

    if (error) throw error;

    const stats = (data as any[]).reduce((acc, order) => {
      const name = order.clients.name;
      if (!acc[name]) acc[name] = { name, phone: order.clients.phone, total: 0 };
      acc[name].total += order.total_usd;
      return acc;
    }, {});

    return Object.values(stats).sort((a: any, b: any) => b.total - a.total);
  }
};
