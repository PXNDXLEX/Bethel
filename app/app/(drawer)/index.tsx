import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { useStore } from '@/store/useStore';
import { productService, Product } from '@/services/productService';
import { clientService } from '@/services/clientService';
import { locationService } from '@/services/locationService';
import { orderService } from '@/services/orderService';
import { Search, Plus, Minus, ShoppingCart, Trash2, X, User, MapPin, ReceiptText } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useFocusEffect } from 'expo-router';

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  
  // Checkout Form
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { cart, addToCart, updateQuantity, removeFromCart, bcv, clearCart } = useStore();

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pData, cData, lData] = await Promise.all([
        productService.getAll(),
        clientService.getAll(),
        locationService.getAll()
      ]);
      setProducts(pData);
      setClients(cData);
      setLocations(lData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedClientId || !selectedLocationId) {
      Alert.alert('Error', 'Selecciona cliente y zona');
      return;
    }
    
    try {
      setSubmitting(true);
      const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await orderService.saveOrder({
        client_id: selectedClientId,
        location_id: selectedLocationId,
        delivery_number: deliveryNumber,
        notes,
        bcv_rate: bcv,
        total_usd: totalUSD,
        paid_amount: parseFloat(paidAmount || '0'),
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      });

      Alert.alert('Éxito', 'Pedido registrado correctamente');
      clearCart();
      setCheckoutModal(false);
      resetCheckout();
      loadInitialData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCheckout = () => {
    setSelectedClientId(null); setSelectedLocationId(null); setDeliveryNumber(''); setPaidAmount(''); setNotes('');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const renderProductItem = ({ item }: { item: Product }) => {
    const inCart = cart.find(c => c.id === item.id);
    return (
      <TouchableOpacity 
        onPress={() => addToCart(item)}
        className="bg-white dark:bg-slate-800 p-4 rounded-3xl m-2 flex-1 border border-slate-100 dark:border-slate-700 shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-sm font-bold text-slate-800 dark:text-white flex-1 mr-2" numberOfLines={2}>{item.name}</Text>
          <View className={`px-2 py-1 rounded-lg ${item.stock <= 5 ? 'bg-red-100' : 'bg-slate-100'} dark:bg-slate-700`}>
            <Text className={`text-[10px] font-black ${item.stock <= 5 ? 'text-red-600' : 'text-slate-500'} dark:text-slate-400`}>{item.stock}</Text>
          </View>
        </View>
        <View className="flex-row justify-between items-end">
          <Text className="text-lg font-black text-brand-500">${item.price.toFixed(2)}</Text>
          {inCart && (
            <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} className="bg-brand-500 w-6 h-6 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
            </MotiView>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <View className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl">
          <Search size={20} color="#94a3b8" />
          <TextInput placeholder="Buscar producto..." placeholderTextColor="#94a3b8" className="flex-1 ml-2 text-slate-800 dark:text-white h-10" value={searchTerm} onChangeText={setSearchTerm} />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#FA8072" /></View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          ListEmptyComponent={<View className="py-20 items-center"><Text className="text-slate-400 font-bold">Sin productos</Text></View>}
        />
      )}

      {cart.length > 0 && (
        <MotiView from={{ translateY: 100 }} animate={{ translateY: 0 }} className="absolute bottom-4 left-4 right-4 bg-slate-900 dark:bg-brand-600 p-4 rounded-3xl flex-row items-center justify-between shadow-2xl">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-xl mr-3"><ShoppingCart size={24} color="white" /></View>
            <View>
              <Text className="text-white font-black text-xl">${totalUSD.toFixed(2)}</Text>
              <Text className="text-white/60 text-xs font-bold">Carrito ({cart.length})</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-white px-6 py-3 rounded-2xl" onPress={() => setCheckoutModal(true)}>
            <Text className="text-slate-900 font-black">PAGAR</Text>
          </TouchableOpacity>
        </MotiView>
      )}

      {/* Modal de Pago / Checkout */}
      <Modal visible={checkoutModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-[40px] p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">Confirmar Venta</Text>
              <TouchableOpacity onPress={() => setCheckoutModal(false)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Cliente */}
              <Text className="text-xs font-black text-slate-400 uppercase mb-2">Cliente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {clients.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    onPress={() => setSelectedClientId(c.id)}
                    className={`mr-2 px-4 py-2 rounded-xl border ${selectedClientId === c.id ? 'bg-brand-500 border-brand-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent'}`}
                  >
                    <Text className={`font-bold ${selectedClientId === c.id ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Zona */}
              <Text className="text-xs font-black text-slate-400 uppercase mb-2">Zona de Entrega</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                {locations.map(l => (
                  <TouchableOpacity 
                    key={l.id} 
                    onPress={() => setSelectedLocationId(l.id)}
                    className={`mr-2 px-4 py-2 rounded-xl border ${selectedLocationId === l.id ? 'bg-slate-900 border-slate-900' : 'bg-slate-100 dark:bg-slate-700 border-transparent'}`}
                  >
                    <Text className={`font-bold ${selectedLocationId === l.id ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{l.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="space-y-4">
                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                  <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">N° Entrega (NE)</Text>
                  <TextInput value={deliveryNumber} onChangeText={setDeliveryNumber} className="text-lg font-bold dark:text-white" placeholder="Ej: 0001" />
                </View>
                <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100">
                  <Text className="text-[10px] font-black text-green-500 uppercase mb-1">Abono / Pago Inicial ($)</Text>
                  <TextInput value={paidAmount} onChangeText={setPaidAmount} keyboardType="numeric" className="text-2xl font-black text-green-600" placeholder="0.00" />
                </View>
              </View>

              <View className="bg-slate-900 p-6 rounded-3xl mt-8">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white/60 font-bold">Total Pedido:</Text>
                  <Text className="text-white font-black text-xl">${totalUSD.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-white/60 font-bold">Monto en Bs ({bcv}):</Text>
                  <Text className="text-brand-400 font-black text-xl">{(totalUSD * bcv).toFixed(2)} Bs</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleCheckout} 
                disabled={submitting}
                className={`py-4 rounded-2xl mt-6 shadow-lg ${submitting ? 'bg-slate-400' : 'bg-brand-500'}`}
              >
                {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-center text-lg">CONFIRMAR VENTA</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
