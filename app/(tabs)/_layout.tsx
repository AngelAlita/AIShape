import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          borderTopWidth: 0,
          elevation: 8,
          backgroundColor: 'white',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: '训练',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="dumbbell" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: '饮食',
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '数据',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}