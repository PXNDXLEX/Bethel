import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { orderService } from '@/services/orderService';
import { BookOpen, MessageCircle, DollarSign, Calendar } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useStore } from '@/store/useStore';

export default function DebtsScreen() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { bcv } = useStore();

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await orderService.getDebts();
      setDebts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = (client: any, amount: number) => {
    if (!client.phone) return;
    let cleanPhone = client.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);
    
    const amountBs = (amount * bcv).toFixed(2);
    const msg = `✨ *¡Hola ${client.name}!* Te saludamos de *Dulce Bethel* 🍓\n\nPasamos por aquí para recordarte que tienes un saldo pendiente de: *$${amount.toFixed(2)}*\n*Monto en Bs: ${amountBs} Bs*\n\n----------------------------------\n💳 *DATOS DE PAGO MÓVIL:*\n* *Banco:* Bancamiga (0172)\n* *Teléfono:* 04148007840\n* *Cédula:* 18401182\n----------------------------------\n\n¡Muchas gracias! 🙏`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: any }) => (
    <MotiView 
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      className="bg-white dark:bg-slate-800 rounded-3xl mb-4 overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="bg-slate-900 dark:bg-slate-950 p-4 flex-row justify-between items-center">
        <View>
          <Text className="text-white font-black text-lg">{item.client.name}</Text>
          <Text className="text-slate-400 text-xs font-bold">{item.client.phone || 'Sin teléfono'}</Text>
        </View>
        <Text className="text-brand-400 font-black text-2xl">${item.total_debt.toFixed(2)}</Text>
      </View>

      <View className="p-4">
        {item.orders.map((order: any) => (
          <View key={order.id} className="flex-row justify-between items-center mb-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl">
            <View className="flex-row items-center">
              <Calendar size={12} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text className="text-slate-600 dark:text-slate-300 text-xs font-bold">
                {new Date(order.date).toLocaleDateString('es-ES')}
              </Text>
            </View>
            <Text className="text-slate-800 dark:text-white font-black text-sm">${order.debt_amount.toFixed(2)}</Text>
          </View>
        ))}

        <View className="flex-row mt-4 gap-2">
          <TouchableOpacity 
            onPress={() => sendReminder(item.client, item.total_debt)}
            className="flex-1 bg-green-500 flex-row items-center justify-center py-3 rounded-2xl"
          >
            <MessageCircle size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-black text-xs uppercase">Recordar</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-brand-500 flex-row items-center justify-center py-3 rounded-2xl">
            <DollarSign size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-black text-xs uppercase">Cobrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">Cuentas por Cobrar</Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold">Gestiona los saldos pendientes de tus clientes</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FA8072" className="mt-20" />
      ) : (
        <FlatList
          data={debts}
          renderItem={renderItem}
          keyExtractor={item => item.client.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-slate-400 font-bold">¡Excelente! No hay deudas pendientes</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
