import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Plus, X, User, Tag, FileText } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function MovementsScreen() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Formulario
  const [type, setType] = useState('Ingreso');
  const [category, setCategory] = useState('');
  const [person, setPerson] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setMovements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!category || !amount) return;
    try {
      const { error } = await supabase.from('movements').insert({
        type,
        category,
        person,
        description,
        amount: parseFloat(amount)
      });
      if (error) throw error;
      setModalVisible(false);
      resetForm();
      loadMovements();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setType('Ingreso'); setCategory(''); setPerson(''); setDescription(''); setAmount('');
  };

  const renderItem = ({ item }: { item: any }) => (
    <MotiView 
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      className="bg-white dark:bg-slate-800 p-4 rounded-3xl mb-3 flex-row items-center border border-slate-100 dark:border-slate-700"
    >
      <View className={`p-3 rounded-2xl mr-4 ${item.type === 'Ingreso' ? 'bg-green-100' : 'bg-red-100'}`}>
        {item.type === 'Ingreso' ? <TrendingUp size={20} color="#10b981" /> : <TrendingDown size={20} color="#ef4444" />}
      </View>
      
      <View className="flex-1">
        <Text className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{item.category}</Text>
        <Text className="text-xs text-slate-400 font-bold">{item.person || 'Sin persona'}</Text>
      </View>

      <View className="items-end">
        <Text className={`text-lg font-black ${item.type === 'Ingreso' ? 'text-green-600' : 'text-red-600'}`}>
          {item.type === 'Ingreso' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
        <Text className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 p-4">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-black text-slate-800 dark:text-white">Préstamos y Otros</Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold">Registro de entradas y salidas varias</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-brand-500 p-3 rounded-2xl shadow-lg">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FA8072" className="mt-20" />
      ) : (
        <FlatList data={movements} renderItem={renderItem} keyExtractor={item => item.id.toString()} contentContainerStyle={{ paddingBottom: 100 }} />
      )}

      {/* Modal Registro */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-800 rounded-t-[40px] p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">Registrar Movimiento</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color="#94a3b8" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl mb-6">
                <TouchableOpacity onPress={() => setType('Ingreso')} className={`flex-1 py-3 rounded-xl items-center ${type === 'Ingreso' ? 'bg-white shadow-sm' : ''}`}>
                  <Text className={`font-black ${type === 'Ingreso' ? 'text-brand-500' : 'text-slate-400'}`}>INGRESO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setType('Egreso')} className={`flex-1 py-3 rounded-xl items-center ${type === 'Egreso' ? 'bg-white shadow-sm' : ''}`}>
                  <Text className={`font-black ${type === 'Egreso' ? 'text-red-500' : 'text-slate-400'}`}>EGRESO</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl flex-row items-center">
                  <Tag size={18} color="#94a3b8" />
                  <TextInput value={category} onChangeText={setCategory} className="flex-1 ml-3 text-lg font-bold dark:text-white" placeholder="Categoría (Ej: Préstamo)" />
                </View>
                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl flex-row items-center">
                  <User size={18} color="#94a3b8" />
                  <TextInput value={person} onChangeText={setPerson} className="flex-1 ml-3 text-lg font-bold dark:text-white" placeholder="Persona / Entidad" />
                </View>
                <View className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl flex-row items-center">
                  <FileText size={18} color="#94a3b8" />
                  <TextInput value={description} onChangeText={setDescription} className="flex-1 ml-3 text-lg font-bold dark:text-white" placeholder="Descripción corta" />
                </View>
                <View className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl flex-row items-center border border-brand-100">
                  <Text className="text-brand-500 font-black text-xl">$</Text>
                  <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" className="flex-1 ml-3 text-2xl font-black text-brand-500" placeholder="0.00" />
                </View>
              </View>

              <TouchableOpacity onPress={handleSave} className="bg-brand-500 py-4 rounded-2xl mt-8 shadow-lg">
                <Text className="text-white font-black text-center text-lg uppercase">Guardar Movimiento</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
