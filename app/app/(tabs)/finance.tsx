import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { financeService } from '@/services/financeService';
import { TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function FinanceScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await financeService.getGlobalStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const KPICard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <MotiView 
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-800 p-6 rounded-3xl mb-4 border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className={`p-3 rounded-2xl ${color}20`}>
          <Icon size={24} color={color} />
        </View>
        <Text className="text-2xl font-black text-slate-800 dark:text-white">${value.toFixed(2)}</Text>
      </View>
      <Text className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">{title}</Text>
      {subValue && (
        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 italic">{subValue}</Text>
      )}
    </MotiView>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#FA8072" className="flex-1" />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-slate-50 dark:bg-slate-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#FA8072" />}
    >
      <View className="mb-6">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">Finanzas Globales</Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold">Resumen acumulado de tu negocio</Text>
      </View>

      <KPICard 
        title="Venta Bruta" 
        value={stats.ventaBruta} 
        icon={TrendingUp} 
        color="#10b981" 
        subValue="Total facturado en pedidos"
      />
      
      <KPICard 
        title="Caja Real (Cobrado)" 
        value={stats.cajaReal} 
        icon={Wallet} 
        color="#3b82f6" 
        subValue="Dinero que ya entró a cuenta"
      />

      <KPICard 
        title="Cuentas por Cobrar" 
        value={stats.deudaTotal} 
        icon={DollarSign} 
        color="#f59e0b" 
        subValue="Dinero pendiente en la calle"
      />

      <KPICard 
        title="Gastos (Inversión MP)" 
        value={stats.totalGastos} 
        icon={TrendingDown} 
        color="#ef4444" 
        subValue="Compra de materia prima"
      />

      <View className="bg-brand-500 p-8 rounded-[40px] mb-10 shadow-xl shadow-brand-200">
        <View className="flex-row justify-between items-center mb-2">
          <PiggyBank size={32} color="white" />
          <Text className="text-white font-black text-4xl">${stats.utilidad.toFixed(2)}</Text>
        </View>
        <Text className="text-white/80 font-black uppercase text-xs tracking-widest">Utilidad Real (Caja - Gastos)</Text>
      </View>
    </ScrollView>
  );
}
