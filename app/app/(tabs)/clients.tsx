import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { clientService } from '@/services/clientService';
import { Crown, MessageCircle, Phone, Search } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getStats();
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = (name: string, phone: string) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);
    
    const msg = `✨* ¡Hola ${name}!* 👋\n\nTe saludamos de *Dulce Bethel* 🍓. Eres uno de nuestros clientes favoritos y queríamos darte las gracias por tu preferencia.\n\n¿Te gustaría ver nuestro menú de hoy? 🧁🎂`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isTop = index < 3;
    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 100 }}
        className={`bg-white dark:bg-slate-800 p-5 rounded-3xl mb-4 border ${isTop ? 'border-brand-300 shadow-brand-100' : 'border-slate-100 dark:border-slate-700'} shadow-sm`}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center">
              {isTop && <Crown size={16} color="#fbbf24" style={{ marginRight: 6 }} />}
              <Text className="text-xl font-black text-slate-800 dark:text-white" numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text className="text-slate-400 dark:text-slate-500 font-bold font-mono mt-1">
              <Phone size={12} /> {item.phone || 'Sin registro'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] font-black text-slate-400 uppercase">Inversión Total</Text>
            <Text className="text-2xl font-black text-brand-500">${item.total.toFixed(2)}</Text>
          </View>
        </View>

        <View className="flex-row border-t border-slate-50 dark:border-slate-700 pt-4">
          <TouchableOpacity 
            onPress={() => sendWhatsApp(item.name, item.phone)}
            className="flex-1 bg-green-500 flex-row items-center justify-center py-3 rounded-2xl"
          >
            <MessageCircle size={18} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-black text-xs uppercase tracking-wider">WhatsApp Promo</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">Top Clientes VIP</Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold">Tus clientes más fieles ordenados por compra</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FA8072" className="mt-20" />
      ) : (
        <FlatList
          data={clients}
          renderItem={renderItem}
          keyExtractor={item => item.name}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-slate-400 font-bold">Aún no hay ventas registradas</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
