import { apiRequest } from './client';

/**
 * 获取指定日期范围的膳食数据
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns Promise 返回膳食数据
 */
export async function fetchMeals(startDate: Date, endDate: Date) {
  // 格式化日期为 YYYY-MM-DD
  const formatDateParam = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const queryParams = `?start_date=${formatDateParam(startDate)}&end_date=${formatDateParam(endDate)}`;
  return await apiRequest(`/api/meals${queryParams}`);
}

/**
 * 获取特定日期的膳食数据
 * @param date 指定日期
 * @returns Promise 返回膳食数据
 */
export async function fetchMealsByDate(date: Date) {
  // 用同一天作为开始和结束日期，获取特定日期的数据
  return await fetchMeals(date, date);
}

/**
 * 向服务器添加新的食物记录
 * @param mealId 餐点ID
 * @param foodData 食物数据
 * @returns Promise
 */
export async function addFoodToMeal(mealId: number, foodData: {
  name: string;
  amount?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}) {
  return await apiRequest(`/api/meals/${mealId}/foods`, {
    method: 'POST',
    body: JSON.stringify(foodData)
  });
}

/**
 * 创建新的餐食记录
 * @param mealData 餐食数据
 * @returns Promise
 */
export async function createMeal(mealData: {
  type: string;
  date?: string;
  time?: string;
  total_calories?: number;
  completed?: boolean;
  foods?: Array<{
    name: string;
    amount?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
}) {
  return await apiRequest('/api/meals', {
    method: 'POST',
    body: JSON.stringify(mealData)
  });
}

/**
 * 更新餐食记录
 * @param mealId 餐食ID
 * @param mealData 餐食更新数据
 * @returns Promise
 */
export async function updateMeal(mealId: number, mealData: {
  type?: string;
  date?: string;
  time?: string;
  total_calories?: number;
  completed?: boolean;
}) {
  return await apiRequest(`/api/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify(mealData)
  });
}

/**
 * 删除餐食记录
 * @param mealId 餐食ID
 * @returns Promise
 */
export async function deleteMeal(mealId: number) {
  return await apiRequest(`/api/meals/${mealId}`, {
    method: 'DELETE'
  });
}

/**
 * 从服务器删除食物记录
 * @param foodId 食物ID
 * @returns Promise
 */
export async function deleteFood(foodId: number) {
  return await apiRequest(`/api/foods/${foodId}`, {
    method: 'DELETE'
  });
}

/**
 * 更新食物记录
 * @param foodId 食物ID
 * @param foodData 食物更新数据
 * @returns Promise
 */
export async function updateFood(foodId: number, foodData: {
  name?: string;
  amount?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}) {
  return await apiRequest(`/api/foods/${foodId}`, {
    method: 'PUT',
    body: JSON.stringify(foodData)
  });
}