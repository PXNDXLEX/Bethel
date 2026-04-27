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
  Platform,
  ScrollView
} from 'react-native';
import { productService, Product } from '@/services/productService';
import { Package, Plus, Hammer, Edit3, Trash2, X, DollarSign } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productionModal, setProductionModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  
  // Formulario nuevo producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newWholesale, setNewWholesale] = useState('');
  const [newStock, setNewStock] = useState('');

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

  const handleSaveProduct = async () => {
    if (!newName || !newPrice) return;
    try {
      await productService.save({
        name: newName,
        price: parseFloat(newPrice),
        wholesale_price: parseFloat(newWholesale || '0'),
        stock: parseInt(newStock || '0')
      });
      setProductModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setNewName(''); setNewPrice(''); setNewWholesale(''); setNewStock('');
  };

  const handleProduction = async () => {
    if (!selectedProduct || !qty) return;
    try {
      await productService.recordProduction(selectedProduct.id, parseInt(qty));
      setProductionModal(false);
      setQty('');
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <MotiView 
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 flex-row items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm"
    >
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-800 dark:text-white">{item.name}</Text>
        <View className="flex-row mt-1">
          <Text className="text-brand-500 font-bold mr-3">${item.price.toFixed(2)}</Text>
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Mayor: ${item.wholesale_price.toFixed(2)}</Text>
        </View>
      </View>

      <View className="items-end">
        <View className={`px-3 py-1 rounded-xl ${item.stock <= 5 ? 'bg-red-100' : 'bg-slate-100'} dark:bg-slate-700 mb-2`}>
          <Text className={`font-black text-xs ${item.stock <= 5 ? 'text-red-600' : 'text-slate-700'} dark:text-slate-300`}>
            Stock: {item.stock}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            onPress={() => { setSelectedProduct(item); setProductionModal(true); }}
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
          <Text className="text-slate-500 dark:text-slate-400 font-bold">Gestión y registro de productos</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setProductModal(true)}
          className="bg-brand-500 p-3 rounded-2xl shadow-lg"
        >
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
        />
      )}

      {/* Modal Nuevo Producto */}
      <Modal visible={productModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-[40px] p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">Nuevo Producto</Text>
              <TouchableOpacity onPress={() => setProductModal(false)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                  <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Nombre</Text>
                  <TextInput value={newName} onChangeText={setNewName} className="text-lg font-bold dark:text-white" placeholder="Ej: Torta de Chocolate" />
                </View>
                
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Precio Detal ($)</Text>
                    <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" className="text-lg font-bold dark:text-white" placeholder="0.00" />
                  </View>
                  <View className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Precio Mayor ($)</Text>
                    <TextInput value={newWholesale} onChangeText={setNewWholesale} keyboardType="numeric" className="text-lg font-bold dark:text-white" placeholder="0.00" />
                  </View>
                </View>

                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl">
                  <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Stock Inicial</Text>
                  <TextInput value={newStock} onChangeText={setNewStock} keyboardType="numeric" className="text-lg font-bold dark:text-white" placeholder="0" />
                </View>
              </View>

              <TouchableOpacity onPress={handleSaveProduct} className="bg-brand-500 py-4 rounded-2xl mt-8 shadow-lg">
                <Text className="text-white font-black text-center text-lg">GUARDAR PRODUCTO</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Producción (Reutilizado pero mejorado) */}
      <Modal visible={productionModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white dark:bg-slate-800 w-full rounded-3xl p-6">
            <Text className="text-xl font-black mb-2 text-slate-800 dark:text-white">Sumar Producción</Text>
            <Text className="text-brand-500 font-bold mb-6">{selectedProduct?.name}</Text>
            
            <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl mb-6">
              <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Unidades Producidas</Text>
              <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" autoFocus className="text-2xl font-black dark:text-white" placeholder="0" />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity onPress={() => setProductionModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-4 rounded-2xl">
                <Text className="text-slate-500 font-black text-center">CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleProduction} className="flex-1 bg-brand-500 py-4 rounded-2xl">
                <Text className="text-white font-black text-center">GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
