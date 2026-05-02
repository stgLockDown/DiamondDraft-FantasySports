import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
      }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="leagues" options={{
        title: 'Leagues',
        tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="scores" options={{
        title: 'Scores',
        tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="players" options={{
        title: 'Players',
        tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}