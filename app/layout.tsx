import { Slot, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    AsyncStorage.getItem('auth_token')
      .then(token => {
        setIsAuthenticated(!!token);
        setIsLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  // 加载状态
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2A86FF" />
      </View>
    ); 
  }

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  // 已登录用户显示正常的应用界面
  return <Slot />;
}