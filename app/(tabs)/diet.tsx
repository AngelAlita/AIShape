import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import ResultModal, { ResultModalProps } from './ResultModal';
const nutritionData = {
  calories: {
    current: 1450,
    goal: 2200
  },
  protein: {
    current: 76,
    goal: 120
  },
  carbs: {
    current: 156,
    goal: 220
  },
  fats: {
    current: 48,
    goal: 73
  }
};
const initialMeals = [
  {
    id: 1,
    type: '早餐',
    time: '08:30',
    calories: 420,
    completed: true,
    foods: [
      { name: '全麦面包', amount: '2片', calories: 180 },
      { name: '鸡蛋', amount: '2个', calories: 160 },
      { name: '牛奶', amount: '250ml', calories: 80 }
    ]
  },
  {
    id: 2,
    type: '午餐',
    time: '12:30',
    calories: 680,
    completed: true,
    foods: [
      { name: '糙米饭', amount: '1碗', calories: 220 },
      { name: '鸡胸肉', amount: '100g', calories: 165 },
      { name: '西兰花', amount: '100g', calories: 55 },
      { name: '胡萝卜', amount: '50g', calories: 25 },
      { name: '橙子', amount: '1个', calories: 65 }
    ]
  },
  {
    id: 3,
    type: '晚餐',
    time: '18:30',
    calories: 580,
    completed: false,
    foods: [
      { name: '全麦面条', amount: '100g', calories: 190 },
      { name: '鲑鱼', amount: '150g', calories: 240 },
      { name: '混合蔬菜', amount: '150g', calories: 80 },
      { name: '橄榄油', amount: '1勺', calories: 40 },
      { name: '苹果', amount: '1个', calories: 80 }
    ]
  }
];
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token?client_id=RfDGbYIhxqmPZrRkW4UFHMDk&client_secret=RWgORkellxRcCKs0aBWSmszuxhoSxQiR&grant_type=client_credentials';
export default function DietScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [token, setToken] = useState(null);
  const cameraRef = useRef<any>(null);
  const [resultData, setResultData] = useState<ResultModalProps['result']>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMealId, setCurrentMealId] = useState<number | null>(null);
  
  const [meals, setMeals] = useState(initialMeals);
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(BAIDU_TOKEN_URL);
        const data = await res.json();
        setToken(data.access_token);
      } catch (err) {
        console.warn('获取百度 token 失败:', err);
      }
    };
    fetchToken();
  }, []);
  // 显示摄像头
  function toggleCameraVisibility() {
    setIsCameraVisible(!isCameraVisible);
  }
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  const detectFood = async () => {
    if (!token) {
      console.warn('⚠️ 缺少百度 token');
      return;
    }

    try {
      // ✅ 真正拍照，不再使用 captureRef
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        base64: true,
        qualityPrioritization: 'quality',
        skipMetadata: false,
      });

      const base64 = photo.base64;
      const uri = photo.uri;

      console.log('📸 拍照成功:', uri);

      // ✅ 保存 base64 图片到本地临时文件
      const fileUri = FileSystem.documentDirectory + `food_${Date.now()}.jpg`;
      if (!base64) {
        console.warn('⚠️ 拍照失败：base64 不存在');
        return;
      }
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // ✅ 上传给百度识别
      const res = await fetch(
        `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `image=${encodeURIComponent(base64)}`,
        }
      );

      const result = await res.json();
      console.log('🍜 百度食物识别结果:', result);
      setResultData(result.result);
      setModalVisible(true);

    } catch (error) {
      console.error('❌ 拍照或识别失败:', error);
    }
  };


  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }
  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.addFoodText}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
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
  const formatDayName = (date: Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };
  // 计算营养进度百分比
  const calculatePercentage = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };
  return (
    <View style={styles.container}>
      {/* 摄像头显示控制 */}
      {isCameraVisible && (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            {/* 切换镜头 */}
            <TouchableOpacity style={styles.closeButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={40} color="white" />
            </TouchableOpacity>

            {/* 返回 */}
            <TouchableOpacity style={styles.backButton} onPress={toggleCameraVisibility}>
              <Ionicons name="arrow-back" size={40} color="white" />
            </TouchableOpacity>
          </CameraView>
          <TouchableOpacity style={styles.recognizeFood} onPress={detectFood}>
            <LinearGradient
              colors={['#2A86FF', '#3F99FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addFoodGradient}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addFoodText}>识别食物</Text>
            </LinearGradient>
          </TouchableOpacity>
          <ResultModal
            visible={modalVisible}
            result={resultData}
            onClose={() => setModalVisible(false)}
            onConfirm={({ name, weight, energy }) => {
              console.log('📥 用户确认记录:', name, weight, energy);
              setModalVisible(false);
              setIsCameraVisible(false); // ✅ 关闭相机
            
              if (currentMealId !== null) {
                const newFood = {
                  name,
                  amount: `${weight}g`,
                  calories: Math.round(energy),
                };
            
                // ✅ 更新 meals 数组
                setMeals(prev =>
                  prev.map(meal =>
                    meal.id === currentMealId
                      ? {
                          ...meal,
                          completed: true,
                          calories: meal.calories + newFood.calories,
                          foods: [...meal.foods, newFood],
                        }
                      : meal
                  )
                );
            
                setCurrentMealId(null); // 清除状态
              }
            }}
          />
        </View>
      )}

      <LinearGradient
        colors={['#2A86FF', '#3F99FF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, { paddingTop:  16 }]}
      >
        <Text style={styles.headerTitle}>饮食管理</Text>
        
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
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 营养摄入概览 */}
        <View style={styles.nutritionCard}>
          <Text style={styles.cardTitle}>今日营养摄入</Text>
          
          <View style={styles.caloriesSummary}>
            <View style={styles.caloriesTextContainer}>
              <Text style={styles.caloriesConsumed}>{nutritionData.calories.current}</Text>
              <Text style={styles.caloriesGoal}>/ {nutritionData.calories.goal}</Text>
            </View>
            <Text style={styles.caloriesLabel}>千卡</Text>
            
            <View style={styles.caloriesProgressContainer}>
              <View style={styles.caloriesProgressBg}>
                <View 
                  style={[
                    styles.caloriesProgress, 
                    { width: `${calculatePercentage(nutritionData.calories.current, nutritionData.calories.goal)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.caloriesProgressText}>
                还可摄入 {nutritionData.calories.goal - nutritionData.calories.current} 千卡
              </Text>
            </View>
          </View>
          
          <View style={styles.nutrientGrid}>
            <View style={styles.nutrientItem}>
              <View style={styles.nutrientHeader}>
                <Text style={styles.nutrientLabel}>蛋白质</Text>
                <Text style={styles.nutrientAmount}>
                  {nutritionData.protein.current}/{nutritionData.protein.goal}g
                </Text>
              </View>
              <View style={styles.nutrientProgressBg}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { width: `${calculatePercentage(nutritionData.protein.current, nutritionData.protein.goal)}%`,
                      backgroundColor: '#4CD97B' 
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.nutrientItem}>
              <View style={styles.nutrientHeader}>
                <Text style={styles.nutrientLabel}>碳水化合物</Text>
                <Text style={styles.nutrientAmount}>
                  {nutritionData.carbs.current}/{nutritionData.carbs.goal}g
                </Text>
              </View>
              <View style={styles.nutrientProgressBg}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { width: `${calculatePercentage(nutritionData.carbs.current, nutritionData.carbs.goal)}%`,
                      backgroundColor: '#FFD166'
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.nutrientItem}>
              <View style={styles.nutrientHeader}>
                <Text style={styles.nutrientLabel}>脂肪</Text>
                <Text style={styles.nutrientAmount}>
                  {nutritionData.fats.current}/{nutritionData.fats.goal}g
                </Text>
              </View>
              <View style={styles.nutrientProgressBg}>
                <View 
                  style={[
                    styles.nutrientProgress, 
                    { width: `${calculatePercentage(nutritionData.fats.current, nutritionData.fats.goal)}%`,
                      backgroundColor: '#FF6B6B' 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* 膳食列表 */}
        <View style={styles.mealListContainer}>
          <Text style={styles.sectionTitle}>今日膳食</Text>
          
          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTypeContainer}>
                  <View style={[
                    styles.mealTypeIcon, 
                    meal.completed ? styles.mealCompleted : {}
                  ]}>
                    {meal.completed ? (
                      <Ionicons name="checkmark" size={16} color="white" />
                    ) : (
                      <Ionicons name="time-outline" size={16} color="#2A86FF" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.mealType}>{meal.type}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                </View>
                <View style={styles.mealCalories}>
                  <Text style={styles.mealCaloriesText}>{meal.calories} 千卡</Text>
                </View>
              </View>
              
              <View style={styles.mealFoods}>
                {meal.foods.map((food, index) => (
                  <View key={index} style={styles.foodItem}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodAmount}>{food.amount}</Text>
                    </View>
                    <Text style={styles.foodCalories}>{food.calories} 千卡</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.mealActions}>
                <TouchableOpacity
                    style={styles.mealAddButton}
                    onPress={() => {
                      setCurrentMealId(meal.id);   // ✅ 记录当前餐
                      setIsCameraVisible(true);    // ✅ 打开摄像头
                    }}
                  >
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={styles.mealAddButtonText}>记录此餐</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        

      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  recognizeFood:{
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
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
  cameraContainer: {
    position: 'absolute', // 将摄像头放置在页面最上层
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // 确保其他内容在摄像头之上
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
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
  content: {
    flex: 1,
    padding: 16,
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      default: {
        elevation: 2,
      }
    }),
  },
  backButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  caloriesSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesConsumed: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A86FF',
  },
  caloriesGoal: {
    fontSize: 18,
    color: '#888',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  caloriesProgressContainer: {
    width: '100%',
    marginTop: 16,
  },
  caloriesProgressBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  caloriesProgress: {
    height: '100%',
    backgroundColor: '#2A86FF',
    borderRadius: 4,
  },
  caloriesProgressText: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  nutrientGrid: {
    marginTop: 8,
  },
  nutrientItem: {
    marginBottom: 12,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#333',
  },
  nutrientAmount: {
    fontSize: 14,
    color: '#888',
  },
  nutrientProgressBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  nutrientProgress: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    marginLeft: 4,
  },
  mealListContainer: {
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      default: {
        elevation: 2,
      }
    }),
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mealCompleted: {
    backgroundColor: '#4CD97B',
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  mealCalories: {
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealCaloriesText: {
    fontSize: 13,
    color: '#2A86FF',
    fontWeight: '500',
  },
  mealFoods: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    color: '#333',
  },
  foodAmount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  foodCalories: {
    fontSize: 14,
    color: '#888',
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A86FF',
  },
  mealButtonText: {
    fontSize: 14,
    color: '#2A86FF',
    marginLeft: 4,
  },
  mealAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#2A86FF',
  },
  mealAddButtonText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 4,
  },
  addFoodButton: {
    marginBottom: 24,
  },
  addFoodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
  },
  addFoodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});