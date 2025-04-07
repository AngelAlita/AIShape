import React, { useState, ComponentProps, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


// 导入健康计算相关API
import { calculateBMI, getBMIStatus, calculateIdealWeightRange, calculateBMR, calculateTDEE, estimateBodyFat } from '../api/healthCalculator';
import { updateWeightGoal, fetchCurrentUser,updateUser } from '../api/user';
import { LineChart, BarChart } from 'react-native-chart-kit';

// 注意：这里需要安装图表库
// npm install react-native-chart-kit
// npm install react-native-svg



const screenWidth = Dimensions.get('window').width;

// 定义图标名称类型
type IconProps = ComponentProps<typeof MaterialCommunityIcons>;
type IconName = IconProps['name'];

// 添加用户数据类型定义
interface UserHealthData {
  currentWeight: number;
  initialWeight: number;
  weightChange: number;
  weightGoal: number;
  bmi: number;
  bmiStatus: string;
  bodyFatPercentage: number;
  waterPercentage: number;
  muscleMass: number;
  lastWorkout: string;
  workoutsThisWeek: number;
  caloriesBurnedToday: number;
  caloriesBurnedWeek: number;
  dailyStepsAverage: number;
  activeMinutesWeek: number;
  sleepAverage: number;
  restingHeartRate: number;
  tdee: number;
  bmr: number;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('week'); // 'week', 'month', 'year'
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight', 'calories', 'steps', 'workout'
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  
  // 添加状态变量来控制目标体重修改模态框

  const [showWeightGoalModal, setShowWeightGoalModal] = useState(false);
  const [newInitialWeight, setNewInitialWeight] = useState('');
  const [newWeightGoal, setNewWeightGoal] = useState('');
  
  // 使用useState初始化用户健康数据
  const [userData, setUserData] = useState<UserHealthData>({
    currentWeight: 0,
    initialWeight: 0,
    weightChange: 0,
    weightGoal: 0,
    bmi: 0,
    bmiStatus: '',
    bodyFatPercentage: 0,
    waterPercentage: 0,
    muscleMass: 0,
    lastWorkout: '--',
    workoutsThisWeek: 0,
    caloriesBurnedToday: 0,
    caloriesBurnedWeek: 0,
    dailyStepsAverage: 0,
    activeMinutesWeek: 0,
    sleepAverage: 0,
    restingHeartRate: 0,
    tdee: 0,
    bmr: 0
  });
  // 加载用户ID
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userIdString = await AsyncStorage.getItem('user_id');
        if (userIdString) {
          const parsedId = parseInt(userIdString);
          console.log('加载到用户ID:', parsedId);
          setUserId(parsedId);
        } else {
          console.log('AsyncStorage中没有找到user_id');
          // 尝试从user_info中获取用户ID
          const userInfoString = await AsyncStorage.getItem('user_info');
          if (userInfoString) {
            const userInfo = JSON.parse(userInfoString);
            if (userInfo.id) {
              console.log('从user_info中获取到用户ID:', userInfo.id);
              setUserId(userInfo.id);
              // 保存id到user_id键中以便未来使用
              await AsyncStorage.setItem('user_id', userInfo.id.toString());
            }
          }
        }
      } catch (error) {
        console.error('获取用户ID失败:', error);
      }
    };
    
    loadUserId();
  }, []);
  
  // 保存目标体重
  const saveWeightGoal = async () => {
    if (!userId) {
      Alert.alert('错误', '用户未登录');
      return;
    }
    
    try {
      // 验证输入
      const weightGoalValue = parseFloat(newWeightGoal);
      if (isNaN(weightGoalValue) || weightGoalValue <= 0) {
        Alert.alert('输入错误', '请输入有效的目标体重');
        return;
      }
      
    const initialWeightValue = parseFloat(newInitialWeight);
    if (isNaN(initialWeightValue) || initialWeightValue <= 0) {
      Alert.alert('输入错误', '请输入有效的初始体重');
      return;
    }

      setIsLoading(true);
      
      // 调用API更新目标体重和初始体重
      await updateUser(userId, {
        weight_goal: weightGoalValue,
        initial_weight: initialWeightValue
      });
      
      // 更新本地用户数据
      setUserData(prevData => ({
      ...prevData,
      weightGoal: weightGoalValue,
      initialWeight: initialWeightValue,
      weightChange: prevData.currentWeight - initialWeightValue
    }));
    
    // 更新AsyncStorage中的用户信息
    const userInfoString = await AsyncStorage.getItem('user_info');
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      userInfo.weight_goal = weightGoalValue;
      userInfo.initial_weight = initialWeightValue;
      await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
    }
      
      // 关闭模态框
      setShowWeightGoalModal(false);
      Alert.alert('成功', '目标体重和初始体重已更新');
      
    } catch (error) {
      console.error('保存目标体重失败:', error);
      Alert.alert('错误', '无法更新目标体重，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  // 加载用户数据和计算健康指标
  useEffect(() => {
    const loadUserHealthData = async () => {
      try {
        setIsLoading(true);
        
        // 从AsyncStorage获取用户信息
        const userInfoString = await AsyncStorage.getItem('user_info');
        if (!userInfoString) {
          console.log('用户数据不存在');
          setIsLoading(false);
          return;
        }
        
        const userInfo = JSON.parse(userInfoString);
        console.log('获取到的用户信息:', userInfo);
        
        // 获取必要参数
        const height = userInfo.height || 170;  // 厘米
        const currentWeight = userInfo.current_weight || 70;  // 公斤
        const initialWeight = userInfo.initial_weight || currentWeight + 3;  // 如果没有初始重量，假设比当前重量多3kg
        const weightGoal = userInfo.weight_goal || currentWeight - 5;  // 如果没有目标重量，假设比当前重量少5kg
        
        // 计算年龄
        let age = 18;  // 默认年龄
        if (userInfo.birthday) {
          const birthDate = new Date(userInfo.birthday);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          
          // 调整年龄，考虑生日是否已过
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        // 性别
        const gender = userInfo.gender || 'male';
        
        // 使用健康计算API
        const bmi = calculateBMI(height, currentWeight);
        const bmiStatus = getBMIStatus(bmi);
        const idealWeightRange = calculateIdealWeightRange(height);
        const bmr = calculateBMR(height, currentWeight, age, gender);
        const tdee = calculateTDEE(bmr, 1.4); // 假设轻度活动水平
        const bodyFatPercentage = estimateBodyFat(height, currentWeight, null, gender);
        
        // 估算肌肉量 (简单估算，实际应有更准确的公式)
        const muscleMass = currentWeight * (gender === 'male' ? 0.4 : 0.35);
        
        // 设置用户健康数据
        setUserData({
          currentWeight,
          initialWeight,
          weightChange: currentWeight - initialWeight,
          weightGoal,
          bmi,
          bmiStatus,
          bodyFatPercentage,
          waterPercentage: gender === 'male' ? 60 : 55,  // 估算值
          muscleMass: parseFloat(muscleMass.toFixed(1)),
          lastWorkout: '今天', // 这个数据需要从训练记录获取
          workoutsThisWeek: 4,  // 这个数据需要从训练记录获取
          caloriesBurnedToday: Math.round(tdee / 3),  // 估算值
          caloriesBurnedWeek: Math.round(tdee * 5),  // 估算值
          dailyStepsAverage: Math.round(tdee / 40),  // 估算值
          activeMinutesWeek: 360,  // 默认值
          sleepAverage: 7.2,  // 默认值
          restingHeartRate: 65,  // 默认值
          tdee,
          bmr
        });
      } catch (error) {
        console.error('加载健康数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserHealthData();
  }, []);

  // 模拟图表数据 - 实际使用时请替换为图表组件
  const weightChartData = {
    labels: ["3/17", "3/18", "3/19", "3/20", "3/21", "3/22", "今天"],
    datasets: [
      {
        data: [70.2, 69.9, 69.5, 69.3, 69.0, 68.8, 68.5]
      }
    ]
  };
  
  const caloriesChartData = {
    labels: ["3/17", "3/18", "3/19", "3/20", "3/21", "3/22", "今天"],
    datasets: [
      {
        data: [320, 450, 380, 520, 0, 410, 485]
      }
    ]
  };
  
  const stepsChartData = {
    labels: ["3/17", "3/18", "3/19", "3/20", "3/21", "3/22", "今天"],
    datasets: [
      {
        data: [7500, 9200, 8100, 10300, 6200, 8700, 8400]
      }
    ]
  };
  
  const workoutChartData = {
    labels: ["3/17", "3/18", "3/19", "3/20", "3/21", "3/22", "今天"],
    datasets: [
      {
        data: [45, 60, 0, 75, 0, 55, 70]
      }
    ]
  };
  
  // 根据选中的指标返回相应的图表数据
  const getChartData = () => {
    switch(selectedMetric) {
      case 'weight':
        return weightChartData;
      case 'calories':
        return caloriesChartData;
      case 'steps':
        return stepsChartData;
      case 'workout':
        return workoutChartData;
      default:
        return weightChartData;
    }
  };
  
  // 返回图表Y轴标签
  const getYAxisSuffix = () => {
    switch(selectedMetric) {
      case 'weight':
        return ' kg';
      case 'calories':
        return ' kcal';
      case 'steps':
        return ' 步';
      case 'workout':
        return ' 分钟';
      default:
        return '';
    }
  };
  
  // 模拟成就数据
  const achievements = [
    { 
      id: 1, 
      title: '连续训练一周', 
      description: '连续7天完成训练',
      date: '2025年3月18日',
      icon: 'trophy' as IconName, 
      color: '#FFD700',
      completed: true
    },
    { 
      id: 2, 
      title: '减重4公斤', 
      description: '达成4公斤减重目标',
      date: '2025年3月20日',
      icon: 'weight' as IconName, 
      color: '#2A86FF',
      completed: true
    },
    { 
      id: 3, 
      title: '每周5次训练', 
      description: '一周内完成5次训练',
      date: '进行中',
      icon: 'dumbbell' as IconName, 
      color: '#4CD97B',
      completed: false
    },
    { 
      id: 4, 
      title: '10万步挑战', 
      description: '一周内累计行走10万步',
      date: '进行中',
      icon: 'shoe-print' as IconName, 
      color: '#FF6B6B',
      completed: false
    },
  ];
  
if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2A86FF" />
        <Text style={{marginTop: 16, color: '#666'}}>加载健康数据中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2A86FF', '#3F99FF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, { paddingTop: 20 }]}
      >
        <Text style={styles.headerTitle}>健康数据</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 关键指标概览 */}
        <View style={styles.summaryCard}>
        <View style={styles.weightContainer}>
              <View>
                <View style={styles.weightValueContainer}>
                  <Text style={styles.weightValue}>{userData.currentWeight}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                <Text style={styles.initialWeightText}>
                  初始体重: <Text style={styles.initialWeightValue}>{userData.initialWeight} kg</Text>
                </Text>
              </View>
              
              <View style={styles.weightChange}>
                <Ionicons 
                  name={userData.weightChange < 0 ? "arrow-down" : "arrow-up"} 
                  size={14} 
                  color={userData.weightChange <= 0 ? "#4CD97B" : "#FF6B6B"} 
                />
                <Text 
                  style={[
                    styles.weightChangeText, 
                    {color: userData.weightChange <= 0 ? "#4CD97B" : "#FF6B6B"}
                  ]}
                >
                  {Math.abs(userData.weightChange).toFixed(1)} kg
                </Text>
              </View>
            </View>
          
          <View style={styles.weightGoalContainer}>
            <View style={styles.weightGoalHeader}>
              <Text style={styles.weightGoalText}>
                距离目标体重还有 <Text style={styles.weightGoalValue}>{Math.abs(userData.currentWeight - userData.weightGoal).toFixed(1)}</Text> kg
              </Text>
              <TouchableOpacity 
                style={styles.editWeightGoalButton}
                onPress={() => {
                  setNewWeightGoal(userData.weightGoal.toString());
                  setNewInitialWeight(userData.initialWeight.toString());
                  setShowWeightGoalModal(true);
                }}
              >
                <Ionicons name="pencil" size={16} color="#2A86FF" />
              </TouchableOpacity>
            </View>
            <View style={styles.weightProgressContainer}>
              <View style={styles.weightProgressBg}>
                <View 
                  style={[
                    styles.weightProgress,
                    { 
                      width: `${Math.min(100, Math.max(0, ((userData.initialWeight - userData.currentWeight) / (userData.initialWeight - userData.weightGoal)) * 100))}%` 
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* 身体成分卡片 */}
        <View style={styles.bodyCompositionCard}>
          <Text style={styles.sectionTitle}>身体成分</Text>
          <View style={styles.bodyCompositionGrid}>
            <View style={styles.bodyCompositionItem}>
              <Text style={styles.bodyCompositionValue}>{userData.bmi}</Text>
              <Text style={styles.bodyCompositionLabel}>BMI</Text>
            </View>
            <View style={styles.bodyCompositionItem}>
              <Text style={styles.bodyCompositionValue}>{userData.bodyFatPercentage}%</Text>
              <Text style={styles.bodyCompositionLabel}>体脂率</Text>
            </View>
            <View style={styles.bodyCompositionItem}>
              <Text style={styles.bodyCompositionValue}>{userData.muscleMass} kg</Text>
              <Text style={styles.bodyCompositionLabel}>肌肉量</Text>
            </View>
            <View style={styles.bodyCompositionItem}>
              <Text style={styles.bodyCompositionValue}>{userData.waterPercentage}%</Text>
              <Text style={styles.bodyCompositionLabel}>体水分</Text>
            </View>
          </View>
        </View>
        
        {/* 活动概览卡片 */}
        <View style={styles.activityCard}>
          <Text style={styles.sectionTitle}>活动概览</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: 'rgba(42, 134, 255, 0.1)' }]}>
                <MaterialCommunityIcons name={"calendar-check" as IconName} size={20} color="#2A86FF" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityValue}>{userData.lastWorkout}</Text>
                <Text style={styles.activityLabel}>上次训练</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: 'rgba(76, 217, 123, 0.1)' }]}>
                <MaterialCommunityIcons name={"dumbbell" as IconName} size={20} color="#4CD97B" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityValue}>{userData.workoutsThisWeek}</Text>
                <Text style={styles.activityLabel}>本周训练</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                <MaterialCommunityIcons name={"fire" as IconName} size={20} color="#FF6B6B" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityValue}>{userData.caloriesBurnedToday}</Text>
                <Text style={styles.activityLabel}>今日消耗 (kcal)</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIconContainer, { backgroundColor: 'rgba(255, 209, 102, 0.1)' }]}>
                <MaterialCommunityIcons name={"shoe-print" as IconName} size={20} color="#FFD166" />
              </View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityValue}>{userData.dailyStepsAverage}</Text>
                <Text style={styles.activityLabel}>平均每日步数</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* 趋势图表 */}
        <View style={styles.chartsCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>趋势分析</Text>
            
            <View style={styles.chartControls}>
              <View style={styles.chartTabsContainer}>
                <TouchableOpacity 
                  style={[styles.chartTab, activeTab === 'week' && styles.activeChartTab]}
                  onPress={() => setActiveTab('week')}
                >
                  <Text style={[styles.chartTabText, activeTab === 'week' && styles.activeChartTabText]}>
                    周
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chartTab, activeTab === 'month' && styles.activeChartTab]}
                  onPress={() => setActiveTab('month')}
                >
                  <Text style={[styles.chartTabText, activeTab === 'month' && styles.activeChartTabText]}>
                    月
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chartTab, activeTab === 'year' && styles.activeChartTab]}
                  onPress={() => setActiveTab('year')}
                >
                  <Text style={[styles.chartTabText, activeTab === 'year' && styles.activeChartTabText]}>
                    年
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.metricsSelector}>
            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'weight' && styles.selectedMetricButton]}
              onPress={() => setSelectedMetric('weight')}
            >
              <MaterialCommunityIcons 
                name={"weight" as IconName} 
                size={20} 
                color={selectedMetric === 'weight' ? "white" : "#333"} 
              />
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === 'weight' && styles.selectedMetricButtonText
                ]}
              >
                体重
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'calories' && styles.selectedMetricButton]}
              onPress={() => setSelectedMetric('calories')}
            >
              <MaterialCommunityIcons 
                name={"fire" as IconName} 
                size={20} 
                color={selectedMetric === 'calories' ? "white" : "#333"} 
              />
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === 'calories' && styles.selectedMetricButtonText
                ]}
              >
                热量
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'steps' && styles.selectedMetricButton]}
              onPress={() => setSelectedMetric('steps')}
            >
              <MaterialCommunityIcons 
                name={"shoe-print" as IconName} 
                size={20} 
                color={selectedMetric === 'steps' ? "white" : "#333"} 
              />
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === 'steps' && styles.selectedMetricButtonText
                ]}
              >
                步数
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'workout' && styles.selectedMetricButton]}
              onPress={() => setSelectedMetric('workout')}
            >
              <MaterialCommunityIcons 
                name={"dumbbell" as IconName} 
                size={20} 
                color={selectedMetric === 'workout' ? "white" : "#333"} 
              />
              <Text 
                style={[
                  styles.metricButtonText, 
                  selectedMetric === 'workout' && styles.selectedMetricButtonText
                ]}
              >
                训练
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartContainer}>
            {/* 这里应该放图表组件，下面是图表占位区 */}
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>
                {selectedMetric === 'weight' && '体重趋势图'}
                {selectedMetric === 'calories' && '热量消耗图'}
                {selectedMetric === 'steps' && '步数统计图'}
                {selectedMetric === 'workout' && '训练时长图'}
              </Text>
              <Text style={styles.chartPlaceholderSubtext}>
                需要安装图表库如react-native-chart-kit
              </Text>
              
              {/* 模拟图表的横纵坐标 */}
              <View style={styles.mockChartContainer}>
                <View style={styles.mockYAxis}>
                  {[4, 3, 2, 1].map(i => (
                    <Text key={i} style={styles.mockYAxisLabel}>
                      {selectedMetric === 'weight' ? 70 - i : i * 20}
                    </Text>
                  ))}
                </View>
                <View style={styles.mockChart}>
                  <View style={styles.mockXAxis}>
                    {weightChartData.labels.map((label, i) => (
                      <Text key={i} style={styles.mockXAxisLabel}>{label}</Text>
                    ))}
                  </View>
                  
                  {/* 模拟的折线 */}
                  <View style={[styles.mockLine, {
                    transform: [
                      {rotate: selectedMetric === 'weight' ? '-10deg' : '10deg'}
                    ]
                  }]} />
                  
                  {/* 模拟的点 */}
                  {[0.1, 0.25, 0.4, 0.6, 0.75, 0.85, 0.95].map((pos, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.mockPoint, 
                        {
                          left: `${pos * 100}%`,
                          top: selectedMetric === 'weight' 
                            ? `${60 - i * 8}%` 
                            : `${40 + (i % 3) * 15}%`
                        }
                      ]} 
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* 成就列表 */}
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>成就与里程碑</Text>
          
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View 
                style={[
                  styles.achievementIconContainer, 
                  { backgroundColor: achievement.completed ? achievement.color : '#E0E0E0' }
                ]}
              >
                <MaterialCommunityIcons name={achievement.icon} size={18} color="white" />
              </View>
              
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>
                  {achievement.completed ? '完成于 ' : ''}{achievement.date}
                </Text>
              </View>
              
              {achievement.completed && (
                <View style={styles.achievementCompletedBadge}>
                  <MaterialCommunityIcons name={"check" as IconName} size={14} color="white" />
                </View>
              )}
            </View>
          ))}
        </View>
        
        {/* 额外健康指标 */}
        <View style={styles.healthMetricsCard}>
          <Text style={styles.sectionTitle}>健康指标</Text>
          
          <View style={styles.healthMetricItem}>
            <View style={styles.healthMetricHeader}>
              <View style={styles.healthMetricIconContainer}>
                <MaterialCommunityIcons name={"sleep" as IconName} size={18} color="#7F57F1" />
              </View>
              <Text style={styles.healthMetricTitle}>平均睡眠时间</Text>
            </View>
            <Text style={styles.healthMetricValue}>{userData.sleepAverage} 小时/天</Text>
          </View>
          
          <View style={styles.healthMetricItem}>
            <View style={styles.healthMetricHeader}>
              <View style={[styles.healthMetricIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                <MaterialCommunityIcons name={"heart-pulse" as IconName} size={18} color="#FF6B6B" />
              </View>
              <Text style={styles.healthMetricTitle}>静息心率</Text>
            </View>
            <Text style={styles.healthMetricValue}>{userData.restingHeartRate} BPM</Text>
          </View>
          
          <View style={styles.healthMetricItem}>
            <View style={styles.healthMetricHeader}>
              <View style={[styles.healthMetricIconContainer, { backgroundColor: 'rgba(76, 217, 123, 0.1)' }]}>
                <MaterialCommunityIcons name={"clock-time-four" as IconName} size={18} color="#4CD97B" />
              </View>
              <Text style={styles.healthMetricTitle}>本周活动时间</Text>
            </View>
            <Text style={styles.healthMetricValue}>{userData.activeMinutesWeek} 分钟</Text>
          </View>
        </View>
        
        {/* 底部间隙 */}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={showWeightGoalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWeightGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>设置目标与初始体重</Text>
            
            {/* 初始体重输入框 */}
            <Text style={styles.inputLabel}>初始体重</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={newInitialWeight}
                onChangeText={setNewInitialWeight}
                placeholder="请输入初始体重 (kg)"
                placeholderTextColor="#999"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
            
            {/* 目标体重输入框 */}
            <Text style={styles.inputLabel}>目标体重</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={newWeightGoal}
                onChangeText={setNewWeightGoal}
                placeholder="请输入目标体重 (kg)"
                placeholderTextColor="#999"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
            
            <Text style={styles.modalInfo}>
              初始体重记录您开始减重时的体重，用于计算减重进展。
              {'\n\n'}
              设置合理的目标体重是实现健康减重的重要步骤，建议按照每周减重0.5-1kg的健康节奏设定目标。
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWeightGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveWeightGoal}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  content: {
    flex: 1,
    padding: 16,
  },
  // 体重概览卡片
  summaryCard: {
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
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  weightUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 123, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weightChangeText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
  weightGoalContainer: {
    marginTop: 8,
  },
  weightGoalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  weightGoalValue: {
    fontWeight: 'bold',
    color: '#2A86FF',
  },
  weightProgressContainer: {
    marginTop: 4,
  },
  weightProgressBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  weightProgress: {
    height: '100%',
    backgroundColor: '#2A86FF',
    borderRadius: 4,
  },
  // 身体成分卡片
  bodyCompositionCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bodyCompositionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bodyCompositionItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  bodyCompositionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bodyCompositionLabel: {
    fontSize: 13,
    color: '#666',
  },
  // 活动概览卡片
  activityCard: {
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
  },
  // 图表卡片
  chartsCard: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeChartTab: {
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  chartTabText: {
    fontSize: 13,
    color: '#666',
  },
  activeChartTabText: {
    fontWeight: '600',
    color: '#333',
  },
  metricsSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  selectedMetricButton: {
    backgroundColor: '#2A86FF',
  },
  metricButtonText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  selectedMetricButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 10,
  },
  chartPlaceholder: {
    height: 220,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    position: 'absolute',
    zIndex: 10,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#888',
    position: 'absolute',
    top: '55%',
    zIndex: 10,
  },
  mockChartContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  mockYAxis: {
    width: 30,
    height: '100%',
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockYAxisLabel: {
    fontSize: 10,
    color: '#999',
  },
  mockChart: {
    flex: 1,
    paddingTop: 20,
    position: 'relative',
  },
  mockXAxis: {
    height: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  mockXAxisLabel: {
    fontSize: 10,
    color: '#999',
  },
  mockLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2A86FF',
    opacity: 0.7,
  },
  mockPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A86FF',
    borderWidth: 1,
    borderColor: 'white',
  },
  // 成就卡片
  achievementsCard: {
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  achievementIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 11,
    color: '#888',
  },
  achievementCompletedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CD97B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 健康指标卡片
  healthMetricsCard: {
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
  healthMetricItem: {
    marginBottom: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
  },
  healthMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthMetricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(127, 87, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  healthMetricTitle: {
    fontSize: 14,
    color: '#666',
  },
  healthMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // 在样式表中添加
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bmiStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // 权重目标相关样式
  weightGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editWeightGoalButton: {
    padding: 4,
  },
  
  // 模态框相关样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  weightInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
  },
  modalInfo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: '#2A86FF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

  initialWeightText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  initialWeightValue: {
    fontWeight: '500',
    color: '#555',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
});