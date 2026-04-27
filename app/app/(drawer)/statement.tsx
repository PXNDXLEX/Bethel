import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Wallet, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function StatementScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Pagos de Clientes
      const { data: pData } = await supabase.from('payments').select('id, date, amount_usd, client_id, clients(name)').order('date', { ascending: false });
      
      // 2. Movimientos (Préstamos, etc)
      const { data: mData } = await supabase.from('movements').select('*').order('date', { ascending: false });
      
      // 3. Gastos (Materia Prima)
      const { data: eData } = await supabase.from('expenses').select('*').order('date', { ascending: false });

      // Unificar y ordenar
      const unified = [
        ...(pData || []).map(p => ({ ...p, type: 'Pago Cliente', amount: p.amount_usd, icon: Wallet, color: '#3b82f6', sign: '+' })),
        ...(mData || []).map(m => ({ ...m, type: m.type, amount: m.amount, icon: m.type === 'Ingreso' ? TrendingUp : TrendingDown, color: m.type === 'Ingreso' ? '#10b981' : '#ef4444', sign: m.type === 'Ingreso' ? '+' : '-' })),
        ...(eData || []).map(e => ({ ...e, type: 'Gasto/Compra', amount: e.total, icon: ShoppingBag, color: '#f59e0b', sign: '-' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setData(unified);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [expenseModal, setExpenseModal] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expTotal, setExpTotal] = useState('');

  const handleSaveExpense = async () => {
    if (!expDesc || !expTotal) return;
    try {
      const { error } = await supabase.from('expenses').insert({
        description: expDesc,
        total: parseFloat(expTotal)
      });
      if (error) throw error;
      setExpenseModal(false);
      setExpDesc(''); setExpTotal('');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const Icon = item.icon;
    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 50 }}
        className="bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 flex-row items-center border border-slate-100 dark:border-slate-700 shadow-sm"
      >
        <View className={`p-3 rounded-2xl mr-4`} style={{ backgroundColor: `${item.color}20` }}>
          <Icon size={20} color={item.color} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter" numberOfLines={1}>
            {item.clients?.name || item.category || item.description || item.type}
          </Text>
          <Text className="text-[10px] text-slate-400 font-bold uppercase">{item.type}</Text>
        </View>

        <View className="items-end">
          <Text className="text-lg font-black" style={{ color: item.color }}>
            {item.sign}${item.amount.toFixed(2)}
          </Text>
          <Text className="text-[9px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </MotiView>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-black text-slate-800 dark:text-white">Estado de Cuenta</Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold">Historial unificado de flujos</Text>
        </View>
        <TouchableOpacity onPress={() => setExpenseModal(true)} className="bg-orange-500 p-3 rounded-2xl shadow-lg">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#FA8072" className="mt-20" />
      ) : (
        <FlatList 
          data={data} 
          renderItem={renderItem} 
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Modal Gastos */}
      <Modal visible={expenseModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-[40px] p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">Registrar Gasto / Compra</Text>
              <TouchableOpacity onPress={() => setExpenseModal(false)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Descripción / Concepto</Text>
                <TextInput value={expDesc} onChangeText={setExpDesc} className="text-lg font-bold dark:text-white" placeholder="Ej: Compra de Harina 50kg" />
              </View>
              <View className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100">
                <Text className="text-[10px] font-black text-orange-400 uppercase mb-1">Monto Total ($)</Text>
                <TextInput value={expTotal} onChangeText={setExpTotal} keyboardType="numeric" className="text-2xl font-black text-orange-500" placeholder="0.00" />
              </View>
              
              <TouchableOpacity onPress={handleSaveExpense} className="bg-orange-500 py-4 rounded-2xl mt-4 shadow-lg">
                <Text className="text-white font-black text-center text-lg uppercase">Guardar Gasto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
