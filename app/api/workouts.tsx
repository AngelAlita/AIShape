import { apiRequest } from './client';

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  completed?: boolean;
}

interface Workout {
  id?: number;
  name: string;
  date?: string;
  time?: string;
  duration?: number;
  calories_burned?: number;
  completed?: boolean;
  exercises?: Exercise[];
}

/**
 * 获取用户的训练记录列表
 * @param params 过滤参数，可包含开始日期、结束日期、完成状态等
 * @returns Promise 返回训练记录列表
 */
export async function fetchWorkouts(params?: {
  start_date?: string;
  end_date?: string;
  completed?: boolean;
}) {
  let queryParams = new URLSearchParams();
  
  if (params?.start_date) {
    queryParams.append('start_date', params.start_date);
  }
  
  if (params?.end_date) {
    queryParams.append('end_date', params.end_date);
  }
  
  if (params?.completed !== undefined) {
    queryParams.append('completed', params.completed.toString());
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/api/workouts${queryString ? '?' + queryString : ''}`;
  
  return await apiRequest(endpoint);
}

/**
 * 获取特定ID的训练记录详情
 * @param workoutId 训练记录ID
 * @returns Promise 返回训练记录详情
 */
export async function fetchWorkoutById(workoutId: number) {
  return await apiRequest(`/api/workouts/${workoutId}`);
}

/**
 * 创建新的训练记录
 * @param workout 训练记录数据
 * @returns Promise 返回创建的训练记录
 */
export async function createWorkout(workout: Workout) {
  return await apiRequest('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(workout)
  });
}

/**
 * 更新训练记录
 * @param workoutId 训练记录ID
 * @param workout 更新的训练记录数据
 * @returns Promise 返回更新后的训练记录
 */
export async function updateWorkout(workoutId: number, workout: Partial<Workout>) {
  return await apiRequest(`/api/workouts/${workoutId}`, {
    method: 'PUT',
    body: JSON.stringify(workout)
  });
}

/**
 * 删除训练记录
 * @param workoutId 训练记录ID
 * @returns Promise
 */
export async function deleteWorkout(workoutId: number) {
  return await apiRequest(`/api/workouts/${workoutId}`, {
    method: 'DELETE'
  });
}

/**
 * 向训练记录添加运动项目
 * @param workoutId 训练记录ID
 * @param exercise 运动项目数据
 * @returns Promise 返回创建的运动项目
 */
export async function addExerciseToWorkout(workoutId: number, exercise: Exercise) {
  return await apiRequest(`/api/workouts/${workoutId}/exercises`, {
    method: 'POST',
    body: JSON.stringify(exercise)
  });
}

/**
 * 更新运动项目
 * @param exerciseId 运动项目ID
 * @param exercise 更新的运动项目数据
 * @returns Promise 返回更新后的运动项目
 */
export async function updateExercise(exerciseId: number, exercise: Partial<Exercise>) {
  return await apiRequest(`/api/exercises/${exerciseId}`, {
    method: 'PUT',
    body: JSON.stringify(exercise)
  });
}

/**
 * 删除运动项目
 * @param exerciseId 运动项目ID
 * @returns Promise
 */
export async function deleteExercise(exerciseId: number) {
  return await apiRequest(`/api/exercises/${exerciseId}`, {
    method: 'DELETE'
  });
}

/**
 * 获取今日训练记录
 * @returns Promise 返回今日训练记录列表
 */
export async function fetchTodayWorkouts() {
  // 获取今天的日期格式为YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  return await fetchWorkouts({
    start_date: today,
    end_date: today
  });
}

/**
 * 将前端训练对象格式转换为API格式
 * @param frontendWorkout 前端使用的训练对象格式
 * @returns API兼容的训练对象格式
 */
export function convertToApiWorkout(frontendWorkout: {
  id?: number;
  name: string;
  time?: string;
  duration?: number;
  calories?: number;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    weight: string;
  }[];
  completed?: boolean;
}): Workout {
  return {
    id: frontendWorkout.id,
    name: frontendWorkout.name,
    time: frontendWorkout.time,
    duration: frontendWorkout.duration,
    calories_burned: frontendWorkout.calories,
    completed: frontendWorkout.completed || false,
    exercises: frontendWorkout.exercises.map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      completed: false
    }))
  };
}

/**
 * 将API训练对象格式转换为前端格式
 * @param apiWorkout API返回的训练对象格式
 * @returns 前端使用的训练对象格式
 */
export function convertToFrontendWorkout(apiWorkout: any): {
  id: number;
  name: string;
  time: string;
  date: string; // 添加日期字段
  duration: number;
  calories: number;
  exercises: {
    id: number;
    name: string;
    sets: number;
    reps: string;
    weight: string;
  }[];
  completed: boolean;
} {
  return {
    id: apiWorkout.id,
    name: apiWorkout.name,
    time: apiWorkout.time || '',
    date: apiWorkout.date || new Date().toISOString().split('T')[0],
    duration: apiWorkout.duration || 0,
    calories: apiWorkout.calories_burned || 0,
    completed: apiWorkout.completed || false,
    exercises: (apiWorkout.exercises || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      sets: e.sets || 0,
      reps: e.reps || '',
      weight: e.weight || ''
    }))
  };
}

/**
 * 获取训练历史记录（按日期分组）
 * @param params 可选的过滤参数
 * @returns Promise 返回按日期分组的训练历史
 */
export async function fetchTrainingHistory(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  // 直接调用fetchWorkouts来获取所有训练记录
  // 默认筛选出已完成的训练
  const workoutsResponse = await fetchWorkouts({
    ...params,
    completed: true
  });
  
  if (workoutsResponse.error) {
    throw new Error(workoutsResponse.error);
  }
  
  // 将训练记录按日期分组
  const workouts = workoutsResponse.map(convertToFrontendWorkout);
  
  // 使用日期作为键进行分组
  const groupedByDate: Record<string, any[]> = {};
  
  workouts.forEach(workout => {
    const date = workout.date || '';
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(workout);
  });
  
  // 将分组结果转换为数组格式，并按日期排序（最新的在前）
  return Object.entries(groupedByDate)
    .map(([date, workouts]) => ({
      date,
      workouts
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * 获取所有训练记录（不分组）
 * @returns Promise 返回所有训练记录列表
 */
export async function fetchAllWorkouts() {
  // 可以设置更大的时间范围确保获取所有记录
  // 或者不设置时间范围参数，取决于后端API的设计
  return await fetchWorkouts();
}
