import { apiRequest } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 获取当前登录用户信息
 * @returns Promise 返回用户信息
 */
export async function fetchCurrentUser() {
  // 从AsyncStorage获取当前用户ID
  const userIdString = await AsyncStorage.getItem('user_id');
  if (!userIdString) {
    throw new Error('未找到用户ID');
  }
  
  const userId = parseInt(userIdString);
  return await fetchUserById(userId);
}

/**
 * 根据ID获取用户信息
 * @param userId 用户ID
 * @returns Promise 返回用户信息
 */
export async function fetchUserById(userId: number) {
  return await apiRequest(`/api/users/${userId}`);
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param userData 更新的用户数据
 * @returns Promise 返回更新后的用户信息
 */
export async function updateUser(userId: number, userData: {
  name?: string;
  email?: string;
  height?: number;
  current_weight?: number;
  initial_weight?: number;
  weight_goal?: number;
  gender?: string;
  birthday?: string;
  profile_image?: string;
}) {
  return await apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
}

/**
 * 更新用户目标体重
 * @param userId 用户ID
 * @param weightGoal 目标体重(kg)
 * @returns Promise
 */
export async function updateWeightGoal(userId: number, weightGoal: number) {
  return await updateUser(userId, { weight_goal: weightGoal });
}

/**
 * 更新用户当前体重
 * @param userId 用户ID
 * @param currentWeight 当前体重(kg)
 * @returns Promise
 */
export async function updateCurrentWeight(userId: number, currentWeight: number) {
  return await updateUser(userId, { current_weight: currentWeight });
}

/**
 * 更改用户密码
 * @param userId 用户ID
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns Promise
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  return await apiRequest(`/api/users/${userId}/change_password`, {
    method: 'PUT',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword
    })
  });
}

/**
 * 注册新用户
 * @param userData 用户注册数据
 * @returns Promise 返回注册结果
 */
export async function registerUser(userData: {
  username: string;
  password: string;
  name: string;
  email: string;
  height?: number;
  current_weight?: number;
  initial_weight?: number;
  weight_goal?: number;
  gender?: string;
  birthday?: string;
  profile_image?: string;
}) {
  return await apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

/**
 * 获取用户体重历史
 * @param userId 用户ID
 * @returns Promise 返回体重历史记录
 */
export async function fetchWeightHistory(userId: number) {
  return await apiRequest(`/api/users/${userId}/weight-history`);
}

/**
 * 记录新的体重数据
 * @param userId 用户ID
 * @param weight 体重(kg)
 * @param date 记录日期, 默认为今天
 * @returns Promise
 */
export async function recordWeight(userId: number, weight: number, date?: string) {
  const recordDate = date || new Date().toISOString().split('T')[0];
  return await apiRequest(`/api/users/${userId}/weight-records`, {
    method: 'POST',
    body: JSON.stringify({
      weight,
      date: recordDate
    })
  });
}

/**
 * 获取用户健康统计数据
 * @param userId 用户ID
 * @returns Promise 返回健康数据统计
 */
export async function fetchHealthStats(userId: number) {
  return await apiRequest(`/api/users/${userId}/health-stats`);
}

/**
 * 删除用户账号
 * @param userId 用户ID
 * @returns Promise
 */
export async function deleteUser(userId: number) {
  return await apiRequest(`/api/users/${userId}`, {
    method: 'DELETE'
  });
}
