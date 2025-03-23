import React, { useState, ComponentProps } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';


// 注意：这里需要安装图表库
// npm install react-native-chart-kit
// npm install react-native-svg
// 这里只展示UI设计，实际图表需要导入图表库组件
// import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// 定义图标名称类型
type IconProps = ComponentProps<typeof MaterialCommunityIcons>;
type IconName = IconProps['name'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('week'); // 'week', 'month', 'year'
  const [selectedMetric, setSelectedMetric] = useState('weight'); // 'weight', 'calories', 'steps', 'workout'
  
  // 模拟用户健康数据
  const userData = {
    currentWeight: 68.5,
    initialWeight: 72.8,
    weightChange: -4.3,
    weightGoal: 65,
    bmi: 22.1,
    bodyFatPercentage: 18.4,
    waterPercentage: 56.2,
    muscleMass: 44.7,
    lastWorkout: '今天',
    workoutsThisWeek: 4,
    caloriesBurnedToday: 485,
    caloriesBurnedWeek: 2320,
    dailyStepsAverage: 8240,
    activeMinutesWeek: 360,
    sleepAverage: 7.2, // 小时
    restingHeartRate: 64,
  };
  
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
            <View style={styles.weightValueContainer}>
              <Text style={styles.weightValue}>{userData.currentWeight}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            <View style={styles.weightChange}>
              <Ionicons 
                name={userData.weightChange < 0 ? "arrow-down" : "arrow-up"} 
                size={14} 
                color={userData.weightChange < 0 ? "#4CD97B" : "#FF6B6B"} 
              />
              <Text 
                style={[
                  styles.weightChangeText, 
                  {color: userData.weightChange < 0 ? "#4CD97B" : "#FF6B6B"}
                ]}
              >
                {Math.abs(userData.weightChange)} kg
              </Text>
            </View>
          </View>
          
          <View style={styles.weightGoalContainer}>
            <Text style={styles.weightGoalText}>
              距离目标体重还有 <Text style={styles.weightGoalValue}>{(userData.currentWeight - userData.weightGoal).toFixed(1)}</Text> kg
            </Text>
            <View style={styles.weightProgressContainer}>
              <View style={styles.weightProgressBg}>
                <View 
                  style={[
                    styles.weightProgress,
                    { 
                      width: `${Math.min(100, ((userData.initialWeight - userData.currentWeight) / (userData.initialWeight - userData.weightGoal)) * 100)}%` 
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
});