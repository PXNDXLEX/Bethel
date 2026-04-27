import { supabase } from '../lib/supabase';

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderForm {
  client_id: number;
  location_id: number;
  delivery_number: string;
  notes: string;
  bcv_rate: number;
  total_usd: number;
  paid_amount: number;
  items: OrderItem[];
}

export const orderService = {
  async saveOrder(form: OrderForm) {
    const { data, error } = await supabase.rpc('save_order_v2', {
      p_client_id: form.client_id,
      p_location_id: form.location_id,
      p_delivery_number: form.delivery_number,
      p_notes: form.notes,
      p_bcv_rate: form.bcv_rate,
      p_total_usd: form.total_usd,
      p_paid_amount: form.paid_amount,
      p_items: form.items
    });

    if (error) throw error;
    return data;
  },

  async getOrdersByDate(date: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        clients (name, phone),
        locations (name),
        order_items (
          *,
          products (name)
        )
      `)
      .gte('date', `${date}T00:00:00`)
      .lte('date', `${date}T23:59:59`);

    if (error) throw error;
    return data;
  },

  async getDebts() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        debt_amount,
        total_usd,
        date,
        clients (id, name, phone)
      `)
      .gt('debt_amount', 0)
      .order('date', { ascending: false });

    if (error) throw error;
    
    // Agrupar por cliente
    const grouped = (data as any[]).reduce((acc, order) => {
      const clientId = order.clients.id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: order.clients,
          total_debt: 0,
          orders: []
        };
      }
      acc[clientId].total_debt += order.debt_amount;
      acc[clientId].orders.push(order);
      return acc;
    }, {});

    return Object.values(grouped);
  },

  async updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  }
};
