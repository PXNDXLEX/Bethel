import { supabase } from '../lib/supabase';

export const financeService = {
  async getGlobalStats() {
    // 1. Total Ventas (Suma de total_usd en orders)
    const { data: orders, error: oError } = await supabase
      .from('orders')
      .select('total_usd, debt_amount, paid_amount');
    
    if (oError) throw oError;

    // 2. Total Compras (Suma de total en expenses)
    const { data: expenses, error: eError } = await supabase
      .from('expenses')
      .select('total');
    
    if (eError) throw eError;

    const ventaBruta = orders.reduce((sum, o) => sum + o.total_usd, 0);
    const deudaTotal = orders.reduce((sum, o) => sum + o.debt_amount, 0);
    const cajaReal = orders.reduce((sum, o) => sum + o.paid_amount, 0);
    const totalGastos = expenses.reduce((sum, e) => sum + e.total, 0);

    return {
      ventaBruta,
      deudaTotal,
      cajaReal,
      totalGastos,
      utilidad: cajaReal - totalGastos
    };
  }
};
