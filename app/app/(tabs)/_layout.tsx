import React from 'react';
import { Tabs } from 'expo-router';
import { 
  ShoppingCart, 
  Package, 
  MapPin, 
  Users, 
  BarChart3,
  BookOpen
} from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FA8072', // Brand Salmon
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Caja',
          tabBarLabel: 'Caja',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarLabel: 'Stock',
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          tabBarLabel: 'Rutas',
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Deudas',
          tabBarLabel: 'Deudas',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarLabel: 'VIP',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finanzas',
          tabBarLabel: 'Metas',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
