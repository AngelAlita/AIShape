import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://1.94.60.194:5000';

/**
 * 创建API请求的辅助函数
 * @param endpoint API端点
 * @param options 请求选项
 * @returns Promise
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const authToken = await AsyncStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...options.headers,
    };
    
    const config: RequestInit = {
      ...options,
      headers,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // 处理未授权情况，可能需要刷新令牌或重定向到登录页
    if (response.status === 401) {
      // 可以在这里增加处理逻辑，如刷新令牌
      console.warn('授权失败，可能需要重新登录');
    }
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `服务器错误 (${response.status})`;
      } catch (e) {
        errorMessage = `服务器错误 (${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    // 一些端点可能不返回JSON数据
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}