import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform ,Alert} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';

import AddWorkoutModal from '../components/training/AddWorkoutModal';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
}

interface Workout {
  id: number;
  name: string;
  time: string;
  duration: number;
  calories: number;
  exercises: Exercise[];
  completed: boolean;
}

export default function TrainingScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', 'plans'
  // 添加状态控制模态窗口显示
  const [modalVisible, setModalVisible] = useState(false);
  // 修改为useState以允许添加新训练
  const [todayWorkouts, setTodayWorkouts] = useState([
    {
      id: 1,
      name: '上肢力量训练',
      time: '09:30 - 10:30',
      duration: 60,
      calories: 320,
      exercises: [
        { name: '哑铃推举', sets: 3, reps: '12', weight: '15kg' },
        { name: '坐姿划船', sets: 3, reps: '10', weight: '40kg' },
        { name: '二头肌弯举', sets: 3, reps: '12', weight: '10kg' },
        { name: '三头肌下拉', sets: 3, reps: '15', weight: '25kg' }
      ],
      completed: true
    },
    {
      id: 2,
      name: '有氧训练',
      time: '17:30 - 18:15',
      duration: 45,
      calories: 380,
      exercises: [
        { name: '跑步机', sets: 1, reps: '25分钟', weight: '6.5km/h' },
        { name: '椭圆机', sets: 1, reps: '15分钟', weight: '中等强度' }
      ],
      completed: false
    }
  ]);
  // 添加训练的处理函数
  const handleAddWorkout = (newWorkout:Workout) => {
    setTodayWorkouts([...todayWorkouts, newWorkout]);
  };

  // 在 handleAddWorkout 函数后添加此函数
  const handleDeleteWorkout = (workoutId: number) => {
  // 显示确认对话框
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
          onPress: () => {
            // 从训练列表中移除指定 ID 的训练
            const updatedWorkouts = todayWorkouts.filter(workout => workout.id !== workoutId);
            setTodayWorkouts(updatedWorkouts);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleWebDelete = (workoutId: number) => {
    // Web平台使用浏览器原生confirm确认
    if (Platform.OS === 'web') {
      console.log("Web平台删除尝试:", workoutId);
      
      // 使用浏览器原生confirm提示
      const confirmDelete = window.confirm("确定要删除这个训练吗？此操作无法撤销。");
      
      if (confirmDelete) {
        console.log("Web平台确认删除:", workoutId);
        const updatedWorkouts = todayWorkouts.filter(workout => workout.id !== workoutId);
        setTodayWorkouts(updatedWorkouts);
      } else {
        console.log("Web平台取消删除");
      }
      return;
    }
    
    // 原生平台使用Alert确认
    handleDeleteWorkout(workoutId);
  };


  // 获取日期数组用于日历显示
  const getDates = () => {
    const dates = [];
    const today = new Date();
    
    // 前3天和后3天
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // 格式化日期为星期几
  const formatDayName = (date:Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

  // 模拟训练数据
  const trainingStats = {
    weeklyWorkouts: 5,
    weeklyCalories: 1850,
    weeklyDuration: 210, // 分钟
    monthlyWorkouts: 18,
    streak: 3 // 连续训练天数
  };

  // 模拟今日训练计划
  const todayTraining = [
    {
      id: 1,
      name: '上肢力量训练',
      time: '09:30 - 10:30',
      duration: 60,
      calories: 320,
      exercises: [
        { name: '哑铃推举', sets: 3, reps: '12', weight: '15kg' },
        { name: '坐姿划船', sets: 3, reps: '10', weight: '40kg' },
        { name: '二头肌弯举', sets: 3, reps: '12', weight: '10kg' },
        { name: '三头肌下拉', sets: 3, reps: '15', weight: '25kg' }
      ],
      completed: true
    },
    {
      id: 2,
      name: '有氧训练',
      time: '17:30 - 18:15',
      duration: 45,
      calories: 380,
      exercises: [
        { name: '跑步机', sets: 1, reps: '25分钟', weight: '6.5km/h' },
        { name: '椭圆机', sets: 1, reps: '15分钟', weight: '中等强度' }
      ],
      completed: false
    }
  ];

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
      
      {todayWorkouts.map((workout) => (
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
              <TouchableOpacity style={styles.workoutButton}>
                <Ionicons name="refresh" size={16} color="#2A86FF" />
                <Text style={styles.workoutButtonText}>再次训练</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.workoutStartButton}>
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
      ))}
      
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

  // 渲染历史记录
  const renderTrainingHistory = () => (
    <>
      <Text style={styles.sectionTitle}>历史训练记录</Text>
      
      {trainingHistory.map((day, index) => (
        <View key={index} style={styles.historyCard}>
          <Text style={styles.historyDate}>{day.date}</Text>
          
          <View style={styles.historyWorkouts}>
            {day.workouts.map((workout, wIndex) => (
              <View key={wIndex} style={styles.historyWorkout}>
                <View style={styles.historyWorkoutLeft}>
                  <View style={styles.historyWorkoutDot} />
                  <Text style={styles.historyWorkoutName}>{workout.name}</Text>
                </View>
                <View style={styles.historyWorkoutRight}>
                  <Text style={styles.historyWorkoutTime}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#888" /> 
                    {workout.duration}分钟
                  </Text>
                  <Text style={styles.historyWorkoutCal}>
                    <MaterialCommunityIcons name="fire" size={12} color="#888" /> 
                    {workout.calories}千卡
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );

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
        <Text style={styles.headerTitle}>训练管理</Text>
        
        {/* 日期选择器 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContainer}
        >
          {getDates().map((date, index) => {
            const isToday = date.getDate() === new Date().getDate();
            const isSelected = date.getDate() === selectedDate.getDate();
            
            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.dateItem,
                  isSelected && styles.selectedDateItem
                ]}
                onPress={() => setSelectedDate(date)}
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
        {activeTab === 'today' && renderTodayTraining()}
        {activeTab === 'history' && renderTrainingHistory()}
        {activeTab === 'plans' && renderTrainingPlans()}
      </ScrollView>

      {/* 添加模态窗口组件 */}
      <AddWorkoutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddWorkout={handleAddWorkout}
        existingWorkouts={todayWorkouts}
      />
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
});

