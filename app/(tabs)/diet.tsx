import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Button,Alert ,ActivityIndicator} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import ResultModal, { ResultModalProps } from '../components/ResultModal';
import { useLocalSearchParams } from 'expo-router';

interface Food {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;   
  fat: number;    
}

interface Meal {
  id: number;
  type: string;
  time: string;
  calories: number;
  completed: boolean;
  foods: Food[];
}

const initialMeals: Meal[] = [
  {
    id: 1,
    type: '早餐',
    time: '',
    calories: 0,
    completed: false,
    foods: [] // 明确是 Food[] 类型的空数组
  },
  {
    id: 2,
    type: '午餐',
    time: '',
    calories: 0,
    completed: false,
    foods: []
  },
  {
    id: 3,
    type: '晚餐',
    time: '',
    calories: 0,
    completed: false,
    foods: []
  }
];

const foodDatabase = [
  {
    "食物名称": "纯牛奶",
    "重量": "250g",
    "卡路里": "170",
    "蛋白质": "8.0",
    "脂肪": "10.0",
    "碳水化合物": "12.0"
  },
  {
    "食物名称": "麻辣烫",
    "重量": "500g",
    "卡路里": "750",
    "蛋白质": "35",
    "脂肪": "40",
    "碳水化合物": "65"
  },
  {
    "食物名称": "鱼香肉丝",
    "重量": "350g",
    "卡路里": "620",
    "蛋白质": "38",
    "脂肪": "38",
    "碳水化合物": "28"
  },
];
const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token?client_id=RfDGbYIhxqmPZrRkW4UFHMDk&client_secret=RWgORkellxRcCKs0aBWSmszuxhoSxQiR&grant_type=client_credentials';
export default function DietScreen() {
  const searchParams = useLocalSearchParams();
  const mealIdParam = searchParams.mealId as string;
  const openCameraParam = searchParams.openCamera as string;

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
  const [nutritionData, setNutritionData] = useState({
    calories: {
      current: 0,
      goal: 2200
    },
    protein: {
      current: 0,
      goal: 120
    },
    carbs: {
      current: 0,
      goal: 220
    },
    fats: {
      current: 0,
      goal: 73
    }
  });
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);

  const [meals, setMeals] = useState(initialMeals);

  const deleteFood = (mealId: number, foodIndex: number) => {
    // 查找要删除的食物
    const mealToUpdate = meals.find(meal => meal.id === mealId);
    if (!mealToUpdate || foodIndex >= mealToUpdate.foods.length) return;
    
    const foodToDelete = mealToUpdate.foods[foodIndex];
    
    // 更新餐点数据，删除特定食品
    setMeals(prev => 
      prev.map(meal => {
        if (meal.id === mealId) {
          // 计算新的卡路里总量
          const newCalories = meal.calories - foodToDelete.calories;
          
          // 过滤掉要删除的食品
          const newFoods = meal.foods.filter((_, idx) => idx !== foodIndex);
          
          // 如果删除后没有食品，标记为未完成
          const isCompleted = newFoods.length > 0;
          
          return {
            ...meal,
            completed: isCompleted,
            calories: newCalories,
            foods: newFoods,
            // 如果删除后没有食物，重置时间
            time: newFoods.length > 0 ? meal.time : ''
          };
        }
        return meal;
      })
    );
    
    // 更新营养摄入数据，直接使用食物的详细营养素数据
    setNutritionData(prev => ({
      calories: {
        ...prev.calories,
        current: prev.calories.current - foodToDelete.calories,
      },
      protein: {
        ...prev.protein,
        current: prev.protein.current - foodToDelete.protein,
      },
      carbs: {
        ...prev.carbs,
        current: prev.carbs.current - foodToDelete.carbs,
      },
      fats: {
        ...prev.fats,
        current: prev.fats.current - foodToDelete.fat,
      },
    }));
  };
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

  useEffect(() => {
    if (openCameraParam === 'true' && mealIdParam) {
      const mealId = parseInt(mealIdParam, 10);
      
      // 检查相机权限并自动打开相机
      const openCamera = async () => {
        if (!permission?.granted) {
          const permissionResult = await requestPermission();
          if (!permissionResult.granted) {
            Alert.alert("需要相机权限", "请允许访问相机以便记录食物");
            return;
          }
        }
        
        // 设置当前餐点ID和打开相机
        setCurrentMealId(mealId);
        setIsCameraVisible(true);
      };
      
      openCamera();
    }
  }, [openCameraParam, mealIdParam, permission]);
  
  // 显示摄像头
  function toggleCameraVisibility() {
    if (isCameraVisible) {
      // 如果要关闭相机，也清除结果数据
      setResultData([]);
    }
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

    setIsRecognizing(true);
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
      // const res = await fetch(
      //   // `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${token}`,
      //   `http://1.94.60.194:5000/api/diet_recognition`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({  
      //       image: base64,  
      //     }),
      //   }
      // );
  
      // const result = await res.json();
  
      // 模拟网络延迟 (实际使用API时可以删除这行)
      await new Promise(resolve => setTimeout(resolve, 1500));
      // ✅ 顺序获取食物数据
      const result = foodDatabase[currentFoodIndex];
      
      // ✅ 更新索引，如果到达末尾则从头开始
      setCurrentFoodIndex((prevIndex) => (prevIndex + 1));
      
      
      console.log('🍜 食物识别结果:', result);
      const mappedResult = [{
        name: result['食物名称'],
        weight: parseFloat(result['重量']), // 确保是数字
        calorie: parseFloat(result['卡路里']), // 确保是数字
        protein: parseFloat(result['蛋白质']),
        fat: parseFloat(result['脂肪']),
        carbs: parseFloat(result['碳水化合物']),
      }];

      setResultData(mappedResult);
      setIsRecognizing(false); // 重置识别状态
      setModalVisible(true);

    } catch (error) {
      console.error('❌ 拍照或识别失败:', error);
      setIsRecognizing(false); // 重置识别状态
      setIsCameraVisible(false);
    // 显示友好的错误提示
      Alert.alert(
          "识别失败", 
          "暂时无法识别食物，请重试",
          [
            { text: "确定" }
          ]
        );
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
    
    {/* 识别中的加载动画 */}
    {isRecognizing && (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2A86FF" />
          <Text style={styles.loadingText}>正在识别食物...</Text>
        </View>
      </View>
    )}
    
    {/* 识别按钮 - 在识别中时禁用 */}
    <TouchableOpacity 
      style={[
        styles.recognizeFood,
        isRecognizing && styles.disabledButton
      ]} 
      onPress={detectFood}
      disabled={isRecognizing}
    >
      <LinearGradient
        colors={isRecognizing ? ['#BBBBBB', '#DDDDDD'] : ['#2A86FF', '#3F99FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.addFoodGradient}
      >
        {isRecognizing ? (
          <Text style={styles.addFoodText}>识别中...</Text>
        ) : (
          <>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addFoodText}>识别食物</Text>
          </>
        )}
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
            
              if (currentMealId !== null ) {
                // 获取当前时间
                const now = new Date();
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                
                // 从结果中获取营养数据
                const selectedFood = resultData[0]; // 假设只有一个结果
                
                // 计算实际的营养值（可以根据重量进行调整）
                const calorieValue = Math.round(selectedFood.calorie);
                const proteinValue = Math.round(selectedFood.protein);
                const fatValue = Math.round(selectedFood.fat);
                const carbsValue = Math.round(selectedFood.carbs);
                
                const newFood = {
                  name,
                  amount: `${weight}g`,
                  calories: calorieValue,
                  protein: proteinValue,
                  fat: fatValue,
                  carbs: carbsValue,
                };
            
                // ✅ 更新 meals 数组
                setMeals(prev =>
                  prev.map(meal =>
                    meal.id === currentMealId
                      ? {
                          ...meal,
                          time: currentTime, // ✅ 更新时间为当前时间
                          completed: true,
                          calories: meal.calories + newFood.calories,
                          foods: [...meal.foods, newFood],
                        }
                      : meal
                  )
                );
                // ✅ 更新总营养数据
                setNutritionData(prev => ({
                  calories: {
                    ...prev.calories,
                    current: prev.calories.current + calorieValue,
                  },
                  protein: {
                    ...prev.protein,
                    current: prev.protein.current + proteinValue,
                  },
                  carbs: {
                    ...prev.carbs,
                    current: prev.carbs.current + carbsValue,
                  },
                  fats: {
                    ...prev.fats,
                    current: prev.fats.current + fatValue,
                  },
                }));
                setCurrentMealId(null); // 清除状态
              }
              // ✅ 首先关闭模态框
                setModalVisible(false);
                // ✅ 然后使用 setTimeout 延时关闭相机
                setTimeout(() => {
                  setIsCameraVisible(false);
                  // ✅ 清除结果数据，防止下次打开相机时显示
                  setResultData([]);
                }, 100);
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
                        {meal.time ? (
                          <Text style={styles.mealTime}>{meal.time}</Text>
                        ) : (
                          <Text style={styles.mealTimeEmpty}>未记录时间</Text>
                        )}
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
                    <View style={styles.foodRightContainer}>
                      <Text style={styles.foodCalories}>{food.calories} 千卡</Text>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            "删除食品",
                            `确定要删除"${food.name}"吗？`,
                            [
                              {
                                text: "取消",
                                style: "cancel"
                              },
                              { 
                                text: "删除", 
                                onPress: () => deleteFood(meal.id, index),
                                style: "destructive"
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              
              <View style={styles.mealActions}>
                <TouchableOpacity
                    style={styles.mealAddButton}
                    onPress={() => {
                      setCurrentMealId(meal.id);   // ✅ 记录当前餐
                      setResultData([]); // ✅ 清除之前的结果
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
  mealTimeEmpty: {
    fontSize: 12,
    color: '#AAA', // 更浅的颜色
    fontStyle: 'italic',
    marginTop: 2,
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  loadingBox: {
    width: 200,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
  // 在 StyleSheet.create 中添加这些样式
  foodRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
});