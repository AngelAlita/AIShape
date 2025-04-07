import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import React, { ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 获取当前日期并格式化
  const today = new Date();
  const currentDate = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
  
  // 用户名状态
  const [userName, setUserName] = useState("用户");
  
  // 在组件加载时获取用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('user_info');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          // 优先使用 name，如果没有则使用 username
          setUserName(userInfo.name || userInfo.username || "用户");
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    };
    
    loadUserInfo();
  }, []);
  // 添加跳转到个人页面的函数
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  // 饮食记录按钮处理函数
  const handleDietRecord = () => {
    Alert.alert(
      "记录膳食",
      "请选择要记录的餐点",
      [
        {
          text: "早餐",
          onPress: () => navigateToDiet(1)
        },
        {
          text: "午餐",
          onPress: () => navigateToDiet(2)
        },
        {
          text: "晚餐",
          onPress: () => navigateToDiet(3)
        },
        {
          text: "取消",
          style: "cancel"
        }
      ]
    );
  };

  // 导航到饮食页面并设置要记录的餐点
  const navigateToDiet = (mealId: number) => {
    router.push({
      pathname: "/diet",
      params: { mealId: mealId.toString(), openCamera: "true" }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2A86FF', '#3F99FF']}
        style={styles.headerGradient}>
        <View style={[styles.header, { marginTop: 20  }]}>
          <View>
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.date}>{currentDate}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={navigateToProfile} // 添加点击事件处理函数
          >
            <Ionicons name="person-circle-outline" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* 进度概览 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>今日概览</Text>
          <View style={styles.progressGrid}>
            <View style={styles.progressItem}>
              <FontAwesome5 name="walking" size={24} color="#2A86FF" />
              <Text style={styles.progressValue}>8,246</Text>
              <Text style={styles.progressLabel}>步数</Text>
            </View>
            <View style={styles.progressItem}>
              <FontAwesome5 name="fire" size={24} color="#FF6B6B" />
              <Text style={styles.progressValue}>486</Text>
              <Text style={styles.progressLabel}>千卡</Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons name="time-outline" size={24} color="#FFD166" />
              <Text style={styles.progressValue}>45</Text>
              <Text style={styles.progressLabel}>分钟</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBar, { width: '70%' }]} />
            </View>
            <Text style={styles.progressBarText}>70% 健康目标已完成</Text>
          </View>
        </View>
        
        {/* 功能快捷按钮 */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickAccessButton}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#2A86FF' }]}>
              <FontAwesome5 name="dumbbell" size={20} color="white" />
            </View>
            <Text style={styles.quickAccessText}>开始训练</Text>
          </TouchableOpacity>
          
          {/* 饮食记录按钮 - 增加点击处理 */}
          <TouchableOpacity 
            style={styles.quickAccessButton}
            onPress={handleDietRecord}
          >
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#FFD166' }]}>
              <Ionicons name="restaurant" size={22} color="white" />
            </View>
            <Text style={styles.quickAccessText}>饮食记录</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAccessButton}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="body" size={22} color="white" />
            </View>
            <Text style={styles.quickAccessText}>身体数据</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAccessButton}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#4CD97B' }]}>
              <MaterialCommunityIcons name="robot" size={22} color="white" />
            </View>
            <Text style={styles.quickAccessText}>AI 教练</Text>
          </TouchableOpacity>
        </View>
        
        {/* 今日计划 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>今日计划</Text>
          
          <View style={styles.planItem}>
            <View style={styles.planItemLeft}>
              <View style={styles.planIconContainer}>
                <FontAwesome5 name="dumbbell" size={16} color="white" />
              </View>
              <View>
                <Text style={styles.planTitle}>上肢训练</Text>
                <Text style={styles.planSubtitle}>30分钟</Text>
              </View>
            </View>
            <View style={styles.planProgress}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBar, { width: '40%' }]} />
              </View>
            </View>
          </View>
          
          <View style={styles.planItem}>
            <View style={styles.planItemLeft}>
              <View style={[styles.planIconContainer, { backgroundColor: '#FFD166' }]}>
                <Ionicons name="restaurant-outline" size={16} color="white" />
              </View>
              <View>
                <Text style={styles.planTitle}>午餐推荐</Text>
                <Text style={styles.planSubtitle}>12:30 | 450千卡</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>查看</Text>
            </TouchableOpacity>
          </View>
        </View>


        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90, // 保留底部空间给导航栏
  },
  // 快捷按钮样式
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickAccessButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  progressLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A86FF',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  planSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  planProgress: {
    width: 100,
  },
  viewButton: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewButtonText: {
    color: '#2A86FF',
    fontSize: 12,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A86FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityAvatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activityHighlight: {
    color: '#2A86FF',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
});