import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { orderService } from '@/services/orderService';
import { MapPin, CheckCircle, Clock, Package, Printer, ChevronRight } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

export default function RoutesScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrdersByDate(selectedDate);
      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const toggleDelivery = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Entregado' ? 'Pendiente' : 'Entregado';
    try {
      await orderService.updateStatus(id, newStatus);
      loadOrders();
    } catch (error) {
      console.error(error);
    }
  };

  // Agrupar por zona
  const groupedByLocation = orders.reduce((acc: any, order) => {
    const loc = order.locations?.name || 'Sin Zona';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(order);
    return acc;
  }, {});

  // Resumen global de productos
  const globalSummary = orders.reduce((acc: any, order) => {
    order.order_items?.forEach((item: any) => {
      const name = item.products?.name;
      acc[name] = (acc[name] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const renderLocationGroup = (locationName: string, locationOrders: any[]) => {
    const totalItems = locationOrders.reduce((sum, o) => {
      return sum + o.order_items.reduce((s: number, i: any) => s + i.quantity, 0);
    }, 0);

    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        key={locationName}
        className="mb-8"
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <MapPin size={20} color="#FA8072" style={{ marginRight: 8 }} />
            <Text className="text-xl font-black text-slate-800 dark:text-white">{locationName}</Text>
          </View>
          <TouchableOpacity className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex-row items-center">
            <Printer size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs">Comanda</Text>
          </TouchableOpacity>
        </View>

        {locationOrders.map((order) => (
          <View 
            key={order.id} 
            className={`bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 border-l-4 ${order.status === 'Entregado' ? 'border-brand-500' : 'border-slate-300 dark:border-slate-600'} shadow-sm`}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="font-black text-slate-800 dark:text-white">{order.clients?.name}</Text>
                <Text className="text-[10px] text-slate-400 font-bold uppercase">{order.delivery_number || 'Sin NE'}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => toggleDelivery(order.id, order.status)}
                className={`px-4 py-2 rounded-xl ${order.status === 'Entregado' ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-700'}`}
              >
                <Text className={`text-xs font-black ${order.status === 'Entregado' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {order.status === 'Entregado' ? '✓ ENTREGADO' : 'ENTREGAR'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-1">
              {order.order_items?.map((item: any) => (
                <View key={item.id} className="flex-row justify-between">
                  <Text className="text-sm text-slate-600 dark:text-slate-300">
                    <Text className="font-black">{item.quantity}x</Text> {item.products?.name}
                  </Text>
                </View>
              ))}
            </View>
            
            {order.notes ? (
              <Text className="text-[10px] italic text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                "{order.notes}"
              </Text>
            ) : null}
          </View>
        ))}
      </MotiView>
    );
  };

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color="#FA8072" className="flex-1" />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-slate-50 dark:bg-slate-900 p-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#FA8072" />}
    >
      <View className="mb-6">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">Control de Rutas</Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold">Despachos programados para hoy</Text>
      </View>

      {/* Resumen Global */}
      <View className="bg-slate-900 dark:bg-brand-700 p-6 rounded-[35px] mb-8 shadow-xl">
        <Text className="text-white font-black mb-4 flex-row items-center">
          <Package size={16} color="white" /> CARGA TOTAL DEL DÍA
        </Text>
        <View className="flex-row flex-wrap">
          {Object.entries(globalSummary).map(([name, qty]: any) => (
            <View key={name} className="bg-white/10 px-3 py-1.5 rounded-xl mr-2 mb-2">
              <Text className="text-white text-xs font-bold">{qty}x {name}</Text>
            </View>
          ))}
          {Object.keys(globalSummary).length === 0 && (
            <Text className="text-white/50 italic text-sm">No hay pedidos para esta fecha</Text>
          )}
        </View>
      </View>

      {/* Grupos por Zona */}
      {Object.keys(groupedByLocation).length > 0 ? (
        Object.entries(groupedByLocation).map(([loc, orders]: any) => renderLocationGroup(loc, orders))
      ) : (
        <View className="py-20 items-center">
          <Text className="text-slate-400 font-bold">Sin rutas programadas</Text>
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
}
