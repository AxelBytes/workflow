import { Tabs } from 'expo-router';
import { Home, Gift, Award, ShoppingBag, User } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

// Colores del tema Eclipse
const COLORS = {
  orange: '#F97316',
  black: '#1a1a1a',
  gray: '#9CA3AF',
  white: '#FFFFFF',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promociones',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Gift size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="raffles"
        options={{
          title: 'Sorteos',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Award size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <ShoppingBag size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
      {/* Ocultar las pantallas que no están en la navegación principal */}
      <Tabs.Screen
        name="points"
        options={{
          href: null, // Ocultar de la barra de tabs
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.orange,
    paddingBottom: 4,
  },
});
