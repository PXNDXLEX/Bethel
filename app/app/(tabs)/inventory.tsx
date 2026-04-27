import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { productService, Product } from '@/services/productService';
import { Package, Plus, Hammer, Edit3, Trash2, X } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productionQty, setProductionQty] = useState('');

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

  const handleProduction = async () => {
    if (!selectedProduct || !productionQty) return;
    try {
      await productService.recordProduction(selectedProduct.id, parseInt(productionQty));
      setModalVisible(false);
      setProductionQty('');
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 flex-row items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-800 dark:text-white">{item.name}</Text>
        <View className="flex-row mt-1">
          <Text className="text-brand-500 font-bold mr-3">PVP: ${item.price.toFixed(2)}</Text>
          <Text className="text-slate-400 dark:text-slate-500 font-semibold">Mayor: ${item.wholesale_price.toFixed(2)}</Text>
        </View>
      </View>

      <View className="items-end">
        <View className={`px-3 py-1 rounded-xl ${item.stock <= 5 ? 'bg-red-100' : 'bg-slate-100'} dark:bg-slate-700 mb-2`}>
          <Text className={`font-black ${item.stock <= 5 ? 'text-red-600' : 'text-slate-700'} dark:text-slate-300`}>
            Stock: {item.stock}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => { setSelectedProduct(item); setModalVisible(true); }}
            className="bg-brand-100 dark:bg-brand-900/30 p-2 rounded-lg mr-2"
          >
            <Hammer size={18} color="#FA8072" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
            <Edit3 size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-black text-slate-800 dark:text-white">Inventario</Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold">Gestión de productos terminados</Text>
        </View>
        <TouchableOpacity className="bg-brand-500 p-3 rounded-2xl shadow-lg">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FA8072" className="mt-20" />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-slate-400 font-bold">No hay productos registrados</Text>
            </View>
          }
        />
      )}

      {/* Modal de Producción */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center bg-black/50 p-6"
        >
          <View className="bg-white dark:bg-slate-800 w-full rounded-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white">Registrar Producción</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 dark:text-slate-400 font-bold mb-2">Producto seleccionado:</Text>
            <Text className="text-lg font-black text-brand-500 mb-6">{selectedProduct?.name}</Text>

            <View className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl mb-6">
              <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Cantidad Producida</Text>
              <TextInput
                keyboardType="numeric"
                className="text-2xl font-black text-slate-800 dark:text-white"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={productionQty}
                onChangeText={setProductionQty}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              onPress={handleProduction}
              className="bg-brand-500 py-4 rounded-2xl items-center shadow-lg"
            >
              <Text className="text-white font-black text-lg">CONFIRMAR PRODUCCIÓN</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
