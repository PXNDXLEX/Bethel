import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { 
  ShoppingCart, 
  Package, 
  MapPin, 
  Users, 
  BarChart3,
  BookOpen,
  DollarSign,
  TrendingUp,
  History
} from 'lucide-react-native';
import { View, Text, useColorScheme } from 'react-native';
import { useStore } from '@/store/useStore';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { bcv } = useStore();

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: '#FA8072',
        drawerInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        drawerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          width: 280,
        },
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        headerRight: () => (
          <View className="mr-4 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-2xl flex-row items-center">
            <DollarSign size={16} color="#FA8072" />
            <Text className="text-brand-500 font-black ml-1">
              {bcv > 0 ? bcv.toFixed(2) : '---'}
            </Text>
          </View>
        ),
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Caja Registradora',
          title: 'Ventas',
          drawerIcon: ({ color }) => <ShoppingCart size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          drawerLabel: 'Inventario y Stock',
          title: 'Productos',
          drawerIcon: ({ color }) => <Package size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="routes"
        options={{
          drawerLabel: 'Rutas de Entrega',
          title: 'Despachos',
          drawerIcon: ({ color }) => <MapPin size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="debts"
        options={{
          drawerLabel: 'Cuentas por Cobrar',
          title: 'Cobranzas',
          drawerIcon: ({ color }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="clients"
        options={{
          drawerLabel: 'Clientes VIP',
          title: 'CRM Clientes',
          drawerIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="movements"
        options={{
          drawerLabel: 'Préstamos y Movimientos',
          title: 'Movimientos',
          drawerIcon: ({ color }) => <TrendingUp size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="statement"
        options={{
          drawerLabel: 'Estado de Cuenta',
          title: 'Historial Contable',
          drawerIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="finance"
        options={{
          drawerLabel: 'Reportes Financieros',
          title: 'Metas y Finanzas',
          drawerIcon: ({ color }) => <BarChart3 size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}
