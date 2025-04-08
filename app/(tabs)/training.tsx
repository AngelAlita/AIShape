import React, { useState, useEffect, useRef, useCallback} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AddWorkoutModal from '../components/training/AddWorkoutModal';
import WorkoutSession from '../components/training/WorkoutSession';

import { fetchTodayWorkouts, fetchWorkouts, createWorkout, updateWorkout, deleteWorkout, convertToFrontendWorkout, convertToApiWorkout,fetchTrainingHistory } from '../api/workouts';


interface Exercise {
  id?: number;
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface Workout {
  id: number;
  name: string;
  time: string;
  date?: string; // 添加日期字段
  duration: number;
  calories: number;
  exercises: Exercise[];
  completed: boolean;
}

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', 'plans'
  const [modalVisible, setModalVisible] = useState(false);
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 添加历史记录相关状态
  const [historyRecords, setHistoryRecords] = useState<{ date: string; workouts: Workout[] }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);


  // 添加新状态跟踪当前正在执行的训练
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sessionVisible, setSessionVisible] = useState(false);

    // 添加日期相关状态
    const [isManualDateChange, setIsManualDateChange] = useState(false);
    const [isDateLoading, setIsDateLoading] = useState(false);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
      const today = new Date();
      // 获取本周的起始日期（周日）
      const day = today.getDay(); // 0是周日，6是周六
      const diff = today.getDate() - day;
      return new Date(today.setDate(diff));
    });
  
  // 日期选择器的滚动引用
  const dateScrollRef = useRef<ScrollView>(null);

  // 模拟训练数据 - 后续会从API获取
    const [trainingStats, setTrainingStats] = useState({
      weeklyWorkouts: 0,
      weeklyCalories: 0,
      weeklyDuration: 0, // 分钟
      monthlyWorkouts: 0,
      streak: 0 // 连续训练天数
    });

    // 加载指定日期的数据
  const loadDataForDate = async (date: Date) => {
    try {
      setIsDateLoading(true);
      
      // 格式化日期为YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      console.log(`加载 ${formattedDate} 的训练数据`);
      
      // 对所有日期都从服务器获取数据
      await loadWorkoutsByDate(date);
      
    } catch (error) {
      console.error('加载日期数据失败:', error);
      Alert.alert('错误', '加载数据失败，请重试');
    } finally {
      setIsDateLoading(false);
    }
  };
  // 原有的 useEffect 保持不变
  useEffect(() => {
    loadTodayWorkouts();
  }, []);

  // 修改原有的 useEffect 以使用 loadDataForDate
  useEffect(() => {
    if (activeTab === 'today') {
      loadDataForDate(selectedDate);
    }
  }, [selectedDate, activeTab]);
  
     // 加载今日训练数据
  const loadTodayWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTodayWorkouts();
      if (response.error) {
        setError(response.error);
      } else {
        const frontendWorkouts = response.map(convertToFrontendWorkout);
        setTodayWorkouts(frontendWorkouts);
        // 更新统计数据
        updateTrainingStats(frontendWorkouts);
      }
    } catch (err) {
      setError('获取训练数据失败');
      console.error('获取训练数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 根据日期获取训练数据，添加 isDateLoading 状态
  const loadWorkoutsByDate = async (date: Date) => {
    setLoading(true);
    setIsDateLoading(true);
    setError(null);
    try {
      const dateString = date.toISOString().split('T')[0];
      console.log(`加载 ${dateString} 的训练数据`);
      
      const response = await fetchWorkouts({
        start_date: dateString,
        end_date: dateString
      });
      
      if (response.error) {
        setError(response.error);
      } else {
        const frontendWorkouts = response.map(convertToFrontendWorkout);
        setTodayWorkouts(frontendWorkouts);
        // 更新统计数据
        updateTrainingStats(frontendWorkouts);
      }
    } catch (err) {
      setError('获取训练数据失败');
      console.error('获取训练数据失败:', err);
    } finally {
      setLoading(false);
      setIsDateLoading(false);
    }
  };


    // 监听页面获取焦点事件，刷新训练数据
    useFocusEffect(
      useCallback(() => {
        // 当页面获取焦点(屏幕变为活跃)时，刷新训练数据
        console.log('训练页面获取焦点，自动刷新数据');
        
        // 如果选中的是当天，刷新当天的训练数据
        const today = new Date();
        if (selectedDate.toDateString() === today.toDateString()) {
          loadWorkoutsByDate(selectedDate);
        }
        
        return () => {
          // 清理函数，当组件失去焦点时调用
          console.log('训练页面失去焦点');
        };
      }, [])  // 空依赖数组表示只在焦点变化时执行
    );

    // 当选中日期变化时加载对应数据
    useEffect(() => {
      if (!isManualDateChange) {
        // 只有当不是手动改变日期时才加载
        loadDataForDate(selectedDate);
      } else {
        // 重置标记
        setIsManualDateChange(false);
      }
    }, [selectedDate]);

  
    // 修改统计数据更新函数，避免重复累加
    const updateTrainingStats = (workouts: Workout[]) => {
      // 重置统计数据，而不是累加
      const completedWorkouts = workouts.filter(w => w.completed);
      const totalCalories = completedWorkouts.reduce((sum, w) => sum + w.calories, 0);
      const totalDuration = completedWorkouts.reduce((sum, w) => sum + w.duration, 0);
      
      // 获取本周的所有训练数据
      fetchWeeklyStats().then(weeklyData => {
        setTrainingStats({
          weeklyWorkouts: weeklyData.workouts || 0,
          weeklyCalories: weeklyData.calories || 0,
          weeklyDuration: weeklyData.duration || 0,
          monthlyWorkouts: weeklyData.monthlyWorkouts || 0,
          streak: weeklyData.streak || 0
        });
      }).catch(err => {
        console.error('获取周统计数据失败:', err);
        // 如果API调用失败，至少显示当天的数据
        setTrainingStats({
          weeklyWorkouts: completedWorkouts.length,
          weeklyCalories: totalCalories,
          weeklyDuration: totalDuration,
          monthlyWorkouts: 0,
          streak: 0
        });
      });
    };
  // 新增获取本周训练统计的函数
  const fetchWeeklyStats = async () => {
    try {
      // 获取本周的开始日期和结束日期
      const today = new Date();
      
      // 修复日期计算逻辑：根据当前选择的日期来确定周范围
      // 中国习惯以周一为一周开始，周日为一周结束
      const currentDate = new Date(selectedDate);
      const day = currentDate.getDay(); // 0是周日，1是周一，...6是周六
      
      // 计算本周的周一（如果今天是周日，则取前一周的周一）
      const startDay = new Date(currentDate);
      startDay.setDate(currentDate.getDate() - (day === 0 ? 6 : day - 1));
      
      // 计算本周的周日
      const endDay = new Date(startDay);
      endDay.setDate(startDay.getDate() + 6);
      
      // 设置时间为一天的开始和结束，以确保包含整天
      startDay.setHours(0, 0, 0, 0);
      endDay.setHours(23, 59, 59, 999);
      
      // 格式化日期为YYYY-MM-DD
      const startDate = startDay.toISOString().split('T')[0];
      const endDate = endDay.toISOString().split('T')[0];
      
      console.log(`获取周统计数据：${startDate} 至 ${endDate}`);
      
      // 获取一周的所有训练数据
      const response = await fetchWorkouts({
        start_date: startDate,
        end_date: endDate,
        completed: true // 只获取已完成的训练
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // 转换为前端格式并计算统计数据
      const workouts = response.map(convertToFrontendWorkout);
      const totalWorkouts = workouts.length;
      const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
      const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
      
      // 计算连续训练天数
      // 这部分可能需要专门的API，这里只是简单示例
      const streak = calculateStreak(workouts);
      
      // 获取本月训练数据量
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date || '');
        return workoutDate >= firstDayOfMonth;
      }).length;
      
      return {
        workouts: totalWorkouts,
        calories: totalCalories,
        duration: totalDuration,
        monthlyWorkouts,
        streak
      };
    } catch (err) {
      console.error('获取周统计数据失败:', err);
      throw err;
    }
  };

// 计算连续训练天数
const calculateStreak = (workouts: Workout[]) => {
  // 按日期分组训练
  const workoutsByDate = new Map<string, boolean>();
  
  // 标记每天是否有训练
  workouts.forEach(workout => {
    if (workout.completed) {
      // 假设每个训练记录都有日期字段，如果没有，需要在API中添加
      const dateStr = workout.date || new Date().toISOString().split('T')[0];
      workoutsByDate.set(dateStr, true);
    }
  });
  
  // 计算连续天数
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 100; i++) { // 最多检查100天，避免无限循环
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (workoutsByDate.has(checkDateStr)) {
      streak++;
    } else if (i > 0) { // 如果不是今天，一旦中断就停止计数
      break;
    }
  }
  
  return streak;
};

  // 开始训练的处理函数
  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setSessionVisible(true);
  };
  
  const handleCompleteWorkout = async (workoutId: number) => {
    try {
      // 更新训练状态为已完成
      const workoutToUpdate = todayWorkouts.find(w => w.id === workoutId);
      if (!workoutToUpdate) return;
      
      const updatedWorkout = { ...workoutToUpdate, completed: true };
      
      // 调用 API 更新训练状态
      await updateWorkout(workoutId, convertToApiWorkout(updatedWorkout));
      
      // 更新本地状态
      const updatedWorkouts = todayWorkouts.map(workout => 
        workout.id === workoutId ? updatedWorkout : workout
      );
      setTodayWorkouts(updatedWorkouts);
      
      // 关闭训练会话
      setSessionVisible(false);
      setActiveWorkout(null);
      
      // 立即刷新本周统计数据
      fetchWeeklyStats().then(weeklyData => {
        setTrainingStats({
          weeklyWorkouts: weeklyData.workouts || 0,
          weeklyCalories: weeklyData.calories || 0,
          weeklyDuration: weeklyData.duration || 0,
          monthlyWorkouts: weeklyData.monthlyWorkouts || 0,
          streak: weeklyData.streak || 0
        });
      });
    } catch (err) {
      console.error('完成训练失败:', err);
      Alert.alert('错误', '完成训练失败，请重试');
    }
  };

  // 添加训练的处理函数
  const handleAddWorkout = async (newWorkout: Workout) => {
    try {
      // 调用 API 创建新训练
      const apiWorkout = convertToApiWorkout(newWorkout);
      const response = await createWorkout(apiWorkout);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // 将返回的训练数据转换为前端格式并添加到列表中
      const createdWorkout = convertToFrontendWorkout(response.workout);
      setTodayWorkouts([...todayWorkouts, createdWorkout]);
    } catch (err) {
      console.error('添加训练失败:', err);
      Alert.alert('错误', '添加训练失败，请重试');
    }
  };

  // 获取当前时间范围的辅助函数
  const getCurrentTimeRange = () => {
    const now = new Date();
    const start = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // 假设训练持续时间为workout的duration
    const end = new Date(now.getTime() + 60 * 60 * 1000).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${start} - ${end}`;
  };

  // 再次训练的处理函数
  const handleRestartWorkout = async (workout: Workout) => {
    try {
      // 创建训练的副本，重置完成状态
      const restartedWorkout: Workout = {
        ...workout,
        id: 0, // 新记录由后端分配ID
        completed: false,
        time: getCurrentTimeRange(), // 更新时间范围
      };
    
      // 调用 API 创建新训练
      const apiWorkout = convertToApiWorkout(restartedWorkout);
      const response = await createWorkout(apiWorkout);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // 将返回的训练数据转换为前端格式并添加到列表中
      const createdWorkout = convertToFrontendWorkout(response.workout);
      setTodayWorkouts([...todayWorkouts, createdWorkout]);
      
      // 开始训练
      setActiveWorkout(createdWorkout);
      setSessionVisible(true);
    } catch (err) {
      console.error('再次训练失败:', err);
      Alert.alert('错误', '再次训练失败，请重试');
    }
  };

  // 删除训练的处理函数
  const handleDeleteWorkout = async (workoutId: number) => {
    Alert.alert(
      "删除训练",
      "确定要删除这个训练吗？此操作无法撤销。",
      [
        {
          text: "取消",
          style: "cancel"
        },
        { 
          text: "删除", 
          onPress: async () => {
            try {
              // 调用 API 删除训练
              await deleteWorkout(workoutId);
              
              // 从训练列表中移除指定 ID 的训练
              const updatedWorkouts = todayWorkouts.filter(workout => workout.id !== workoutId);
              setTodayWorkouts(updatedWorkouts);
              
              // 立即刷新本周统计数据
              fetchWeeklyStats().then(weeklyData => {
                setTrainingStats({
                  weeklyWorkouts: weeklyData.workouts || 0,
                  weeklyCalories: weeklyData.calories || 0,
                  weeklyDuration: weeklyData.duration || 0,
                  monthlyWorkouts: weeklyData.monthlyWorkouts || 0,
                  streak: weeklyData.streak || 0
                });
              });
            } catch (err) {
              console.error('删除训练失败:', err);
              Alert.alert('错误', '删除训练失败，请重试');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleWebDelete = (workoutId: number) => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("确定要删除这个训练吗？此操作无法撤销。");
      
      if (confirmDelete) {
        deleteWorkout(workoutId)
          .then(() => {
            const updatedWorkouts = todayWorkouts.filter(workout => workout.id !== workoutId);
            setTodayWorkouts(updatedWorkouts);
            
            // 立即刷新本周统计数据
            return fetchWeeklyStats();
          })
          .then(weeklyData => {
            if (weeklyData) {
              setTrainingStats({
                weeklyWorkouts: weeklyData.workouts || 0,
                weeklyCalories: weeklyData.calories || 0,
                weeklyDuration: weeklyData.duration || 0,
                monthlyWorkouts: weeklyData.monthlyWorkouts || 0,
                streak: weeklyData.streak || 0
              });
            }
          })
          .catch(err => {
            console.error('删除训练失败:', err);
            alert('删除训练失败，请重试');
          });
        return;
      }
    }
    
    // 原生平台使用Alert确认
    handleDeleteWorkout(workoutId);
  };


// 获取日期数组用于日历显示 - 修改为一周视图
const getDates = () => {
  const dates = [];
  const startDate = new Date(currentWeekStart);
  
  // 一周7天
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

// 切换到上一周或下一周
const changeWeek = (direction: 'prev' | 'next') => {
  const newStart = new Date(currentWeekStart);
  newStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
  
  setCurrentWeekStart(newStart);
  
  // 选中新周的第一天
  const newDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(newStart);
    date.setDate(newStart.getDate() + i);
    newDates.push(date);
  }
  
  // 自动选中当天日期，如果当天在新周内
  const today = new Date();
  const todayStr = today.toDateString();
  const dateInNewWeek = newDates.find(date => date.toDateString() === todayStr);
  
  if (dateInNewWeek) {
    setSelectedDate(dateInNewWeek);
  } else {
    // 否则选择新周的第一天
    setSelectedDate(newDates[0]);
  }
  
  // 滚动到开头
  if (dateScrollRef.current) {
    dateScrollRef.current.scrollTo({ x: 0, animated: true });
  }
};

  // 格式化完整日期显示
  const formatFullDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}`;
  };
    
  // 格式化日期为星期几
  const formatDayName = (date:Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

// 加载历史记录
const loadHistoryRecords = async () => {
  if (activeTab !== 'history') return;
  
  setHistoryLoading(true);
  setHistoryError(null);
  
  try {
    // 直接获取所有历史记录
    const history = await fetchTrainingHistory();
    setHistoryRecords(history);
  } catch (err) {
    console.error('获取历史记录失败:', err);
    setHistoryError('获取历史记录失败');
  } finally {
    setHistoryLoading(false);
  }
};

// 当切换到历史标签时加载历史记录
useEffect(() => {
  if (activeTab === 'history') {
    loadHistoryRecords();
  }
}, [activeTab]);

// 监听页面焦点以刷新历史记录
useFocusEffect(
  useCallback(() => {
    if (activeTab === 'history') {
      // 当页面获取焦点且当前标签是历史记录时，刷新历史记录
      loadHistoryRecords();
    }
    
    return () => {
      // 清理函数
    };
  }, [activeTab])
);

// 日期格式化函数
const formatHistoryDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}`;
};

  // 模拟历史训练记录
  const trainingHistory = [
    {
      date: '3月22日',
      workouts: [
        { name: '下肢力量训练', duration: 55, calories: 370 },
        { name: '核心训练', duration: 25, calories: 180 }
      ]
    },
    {
      date: '3月21日',
      workouts: [
        { name: '上肢力量训练', duration: 60, calories: 320 },
        { name: '有氧训练', duration: 30, calories: 250 }
      ]
    },
    {
      date: '3月20日',
      workouts: [
        { name: '全身HIIT', duration: 40, calories: 420 }
      ]
    },
    {
      date: '3月19日',
      workouts: [
        { name: '瑜伽', duration: 45, calories: 180 }
      ]
    }
  ];

  // 模拟训练计划
  const trainingPlans = [
    {
      id: 1,
      name: '初学者增肌计划',
      duration: '8周',
      level: '初级',
      workoutsPerWeek: 3,
      focus: '全身肌肉增长',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    },
    {
      id: 2,
      name: '减脂训练计划',
      duration: '6周',
      level: '中级',
      workoutsPerWeek: 5,
      focus: '脂肪燃烧与代谢提升',
      image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-1.2.1&auto=format&fit=crop&w=1353&q=80'
    },
    {
      id: 3,
      name: '力量与耐力训练',
      duration: '12周',
      level: '高级',
      workoutsPerWeek: 4,
      focus: '力量提升与肌肉塑造',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    }
  ];

   // 渲染今日训练内容
   const renderTodayTraining = () => (
    <>
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>本周训练统计</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#2A86FF" />
            </View>
            <Text style={styles.statValue}>{trainingStats.weeklyWorkouts}</Text>
            <Text style={styles.statLabel}>训练次数</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>{trainingStats.weeklyCalories}</Text>
            <Text style={styles.statLabel}>卡路里</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#FFD166" />
            </View>
            <Text style={styles.statValue}>{trainingStats.weeklyDuration}分钟</Text>
            <Text style={styles.statLabel}>训练时长</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="medal-outline" size={20} color="#4CD97B" />
            </View>
            <Text style={styles.statValue}>{trainingStats.streak}天</Text>
            <Text style={styles.statLabel}>连续训练</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>今日训练</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A86FF" />
          <Text style={styles.loadingText}>加载训练数据中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTodayWorkouts}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : todayWorkouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={40} color="#CCCCCC" />
          <Text style={styles.emptyText}>今日暂无训练计划</Text>
          <Text style={styles.emptySubText}>点击下方按钮添加训练</Text>
        </View>
      ) : (
        todayWorkouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutTitleContainer}>
                <View style={[
                  styles.workoutStatusIcon, 
                  workout.completed ? styles.workoutCompleted : {}
                ]}>
                  {workout.completed ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Ionicons name="time-outline" size={16} color="#2A86FF" />
                  )}
                </View>
                <View>
                  <Text style={styles.workoutTitle}>{workout.name}</Text>
                  <Text style={styles.workoutTime}>{workout.time}</Text>
                </View>
              </View>
              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <Text style={styles.workoutStatText}>{workout.duration}分钟</Text>
                </View>
                <View style={styles.workoutStat}>
                  <MaterialCommunityIcons name="fire" size={14} color="#666" />
                  <Text style={styles.workoutStatText}>{workout.calories}千卡</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.workoutExercises}>
              {workout.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {exercise.sets} 组 × {exercise.reps} {exercise.weight && `(${exercise.weight})`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.workoutActions}>
              {workout.completed ? (
                <TouchableOpacity style={styles.workoutButton}
                  onPress={() => handleRestartWorkout(workout)}
                >
                  <Ionicons name="refresh" size={16} color="#2A86FF" />
                  <Text style={styles.workoutButtonText}>再次训练</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.workoutStartButton}
                  onPress={() => handleStartWorkout(workout)}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.workoutStartButtonText}>开始训练</Text>
                </TouchableOpacity>
              )}
              
              {/* 添加删除按钮 */}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleWebDelete(workout.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      
      <TouchableOpacity style={styles.addWorkoutButton} onPress={() => setModalVisible(true)}>
        <LinearGradient
          colors={['#2A86FF', '#3F99FF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.addWorkoutGradient}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addWorkoutText}>添加训练</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );


// 修改原有的 renderTrainingHistory 函数，使用从服务器获取的数据
const renderTrainingHistory = () => {
  return (
    <>
      {historyLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A86FF" />
          <Text style={styles.loadingText}>加载历史记录中...</Text>
        </View>
      ) : historyError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadHistoryRecords}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : historyRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={40} color="#CCCCCC" />
          <Text style={styles.emptyText}>暂无训练历史</Text>
          <Text style={styles.emptySubText}>完成训练后会在这里显示</Text>
        </View>
      ) : (
        <>
          {historyRecords.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <Text style={styles.historyDate}>{formatHistoryDate(item.date)}</Text>
              <View style={styles.historyWorkouts}>
                {item.workouts.map((workout, idx) => (
                  <View key={idx} style={styles.historyWorkout}>
                    <View style={styles.historyWorkoutDot} />
                    <View style={styles.historyWorkoutLeft}>
                      <Text style={styles.historyWorkoutName}>{workout.name}</Text>
                    </View>
                    <View style={styles.historyWorkoutRight}>
                      <Text style={styles.historyWorkoutTime}>{workout.time}</Text>
                      <Text style={styles.historyWorkoutCal}>{workout.calories}千卡</Text>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* 添加操作按钮 */}
              <View style={styles.historyCardActions}>
                <TouchableOpacity 
                  style={styles.historyCardButton}
                  onPress={() => {
                    // 选择这一天的日期并切换到今日训练标签
                    const selectedDay = new Date(item.date);
                    setSelectedDate(selectedDay);
                    setActiveTab('today');
                  }}
                >
                  <Text style={styles.historyCardButtonText}>查看详情</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {/* 添加下拉刷新功能 */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadHistoryRecords}
          >
            <Ionicons name="refresh" size={16} color="#2A86FF" />
            <Text style={styles.refreshButtonText}>刷新历史记录</Text>
          </TouchableOpacity>
        </>
      )}
    </>
  );
};

  // 渲染训练计划
  const renderTrainingPlans = () => (
    <>
      <Text style={styles.sectionTitle}>推荐训练计划</Text>
      
      {trainingPlans.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Image source={{ uri: plan.image }} style={styles.planImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.planGradient}
          />
          <View style={styles.planContent}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.planTags}>
              <View style={styles.planTag}>
                <MaterialCommunityIcons name="calendar-range" size={12} color="white" />
                <Text style={styles.planTagText}>{plan.duration}</Text>
              </View>
              <View style={styles.planTag}>
                <MaterialCommunityIcons name="medal" size={12} color="white" />
                <Text style={styles.planTagText}>{plan.level}</Text>
              </View>
              <View style={styles.planTag}>
                <MaterialCommunityIcons name="dumbbell" size={12} color="white" />
                <Text style={styles.planTagText}>每周{plan.workoutsPerWeek}次</Text>
              </View>
            </View>
            <Text style={styles.planFocus}>{plan.focus}</Text>
            <TouchableOpacity style={styles.planButton}>
              <Text style={styles.planButtonText}>查看计划</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
       <LinearGradient
        colors={['#2A86FF', '#3F99FF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, { paddingTop:  16 }]}
      >
        {/* 添加完整日期显示 */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>训练管理</Text>
          <Text style={styles.headerDate}>{formatFullDate(selectedDate)}</Text>
        </View>
        
        {/* 修改日期选择器 - 添加上下周切换 */}
        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity 
            style={styles.weekNavigationButton}
            onPress={() => changeWeek('prev')}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          
          <ScrollView 
            ref={dateScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {getDates().map((date, index) => {
              const isToday = date.getDate() === new Date().getDate() &&
                             date.getMonth() === new Date().getMonth() &&
                             date.getFullYear() === new Date().getFullYear();
              const isSelected = date.getDate() === selectedDate.getDate() &&
                                date.getMonth() === selectedDate.getMonth() &&
                                date.getFullYear() === selectedDate.getFullYear();
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.dateItem,
                    isSelected && styles.selectedDateItem
                  ]}
                  onPress={() => {
                    setIsManualDateChange(true); // 设置标记
                    setSelectedDate(date);
                    
                    // 直接调用 loadWorkoutsByDate 从服务器获取最新数据
                    loadWorkoutsByDate(date);
                  }}
                >
                  <Text style={[
                    styles.dateDay,
                    isSelected && styles.selectedDateText
                  ]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[
                    styles.dateWeekday,
                    isSelected && styles.selectedDateText
                  ]}>
                    {formatDayName(date)}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.weekNavigationButton}
            onPress={() => changeWeek('next')}
          >
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 标签切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            今日训练
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            训练记录
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
          onPress={() => setActiveTab('plans')}
        >
          <Text style={[styles.tabText, activeTab === 'plans' && styles.activeTabText]}>
            训练计划
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 添加日期加载状态显示 */}
        {isDateLoading ? (
          <View style={styles.dateLoadingContainer}>
            <ActivityIndicator size="large" color="#2A86FF" />
            <Text style={styles.loadingText}>加载数据中...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'today' && renderTodayTraining()}
            {activeTab === 'history' && renderTrainingHistory()}
            {activeTab === 'plans' && renderTrainingPlans()}
          </>
        )}
      </ScrollView>

      {/* 添加模态窗口组件 */}
      <AddWorkoutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddWorkout={handleAddWorkout}
        existingWorkouts={todayWorkouts}
      />

      {/* 训练执行会话模态窗口 */}
      {activeWorkout && (
        <WorkoutSession
          visible={sessionVisible}
          workout={activeWorkout}
          onClose={() => setSessionVisible(false)}
          onComplete={handleCompleteWorkout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  dateScrollContainer: {
    paddingVertical: 8,
  },
  dateItem: {
    width: 45,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDateItem: {
    backgroundColor: 'white',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  dateWeekday: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  selectedDateText: {
    color: '#2A86FF',
  },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  // 标签栏样式
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2A86FF',
  },
  tabText: {
    fontSize: 14,
    color: '#777',
  },
  activeTabText: {
    color: '#2A86FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // 统计卡片样式
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  // 训练部分样式
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    marginLeft: 4,
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  workoutHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workoutCompleted: {
    backgroundColor: '#4CD97B',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutTime: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  workoutStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  workoutExercises: {
    padding: 16,
    paddingTop: 8,
  },
  exerciseItem: {
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#888',
  },
  workoutActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  workoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A86FF',
  },
  workoutButtonText: {
    fontSize: 14,
    color: '#2A86FF',
    marginLeft: 6,
  },
  workoutStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A86FF',
  },
  workoutStartButtonText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 6,
  },
  addWorkoutButton: {
    marginBottom: 24,
  },
  addWorkoutGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
  },
  addWorkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  // 历史记录样式
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  historyDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  historyWorkouts: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    marginLeft: 8,
  },
  historyWorkout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    marginBottom: 14,
    position: 'relative',
  },
  historyWorkoutDot: {
    position: 'absolute',
    left: -4,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A86FF',
  },
  historyWorkoutLeft: {
    flex: 1,
  },
  historyWorkoutName: {
    fontSize: 14,
    color: '#333',
  },
  historyWorkoutRight: {
    flexDirection: 'row',
  },
  historyWorkoutTime: {
    fontSize: 12,
    color: '#888',
    marginRight: 10,
  },
  historyWorkoutCal: {
    fontSize: 12,
    color: '#888',
  },
  // 训练计划样式
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    height: 180,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  planImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  planGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  planContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  planTags: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  planTagText: {
    fontSize: 11,
    color: 'white',
    marginLeft: 4,
  },
  planFocus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  planButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  planButtonText: {
    color: '#2A86FF',
    fontSize: 13,
    fontWeight: '600',
  },
  // 在 styles 对象中添加以下样式
  workoutActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#2A86FF',
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  headerDate: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  weekNavigationButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLoadingContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  historyCardButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
  },
  historyCardButtonText: {
    color: '#2A86FF',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#2A86FF',
    fontWeight: '500',
    marginLeft: 8,
  }
});

