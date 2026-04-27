import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useStore } from '@/store/useStore';
import { productService, Product } from '@/services/productService';
import { Search, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';

export default function POSScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { cart, addToCart, updateQuantity, removeFromCart, bcv } = useStore();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalBS = totalUSD * bcv;

  const renderProductItem = ({ item }: { item: Product }) => {
    const inCart = cart.find(c => c.id === item.id);
    
    return (
      <TouchableOpacity 
        onPress={() => addToCart(item)}
        className="bg-white dark:bg-slate-800 p-4 rounded-3xl m-2 flex-1 border border-slate-100 dark:border-slate-700 shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-sm font-bold text-slate-800 dark:text-white flex-1 mr-2" numberOfLines={2}>
            {item.name}
          </Text>
          <View className={`px-2 py-1 rounded-lg ${item.stock <= 5 ? 'bg-red-100' : 'bg-slate-100'} dark:bg-slate-700`}>
            <Text className={`text-[10px] font-black ${item.stock <= 5 ? 'text-red-600' : 'text-slate-500'} dark:text-slate-400`}>
              {item.stock}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-end">
          <Text className="text-lg font-black text-brand-500">
            ${item.price.toFixed(2)}
          </Text>
          {inCart && (
            <MotiView 
              from={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="bg-brand-500 w-6 h-6 rounded-full items-center justify-center"
            >
              <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
            </MotiView>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header & Search */}
      <View className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-2xl">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Buscar producto..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 text-slate-800 dark:text-white h-10"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FA8072" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-slate-400 font-bold">No se encontraron productos</Text>
            </View>
          }
        />
      )}

      {/* Mini Cart / Checkout Bar */}
      {cart.length > 0 && (
        <MotiView 
          from={{ translateY: 100 }}
          animate={{ translateY: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-slate-900 dark:bg-brand-600 p-4 rounded-3xl flex-row items-center justify-between shadow-2xl"
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-xl mr-3">
              <ShoppingCart size={24} color="white" />
            </View>
            <View>
              <Text className="text-white font-black text-xl">${totalUSD.toFixed(2)}</Text>
              <Text className="text-white/60 text-xs font-bold">Total a pagar</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="bg-white px-6 py-3 rounded-2xl"
            onPress={() => {/* Navigate to Checkout Modal */}}
          >
            <Text className="text-slate-900 font-black">PAGAR</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}
