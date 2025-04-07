import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Button,Alert ,ActivityIndicator} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import ResultModal, { ResultModalProps } from '../components/ResultModal';
import { useLocalSearchParams } from 'expo-router';
import { fetchMealsByDate,createMeal,deleteMeal,addFoodToMeal,updateMeal,deleteFood } from '../api/meals';

interface Food {
  id?: number; // 可选属性，表示食物的唯一标识符
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

  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isManualDateChange, setIsManualDateChange] = useState(false);

  // 当选中日期变化时加载对应数据
  useEffect(() => {
    if (!isManualDateChange) {
      // 只有当不是手动改变日期时才加载
      loadDataForDate(selectedDate);
    }
    // 重置标记
    setIsManualDateChange(false);
  }, [selectedDate]);

  // 添加日期范围相关状态
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    // 获取本周的起始日期（周日）
    const day = today.getDay(); // 0是周日，6是周六
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });
  // 添加日期数据加载状态
  const [isDateLoading, setIsDateLoading] = useState(false);
  
  // 日期选择器的滚动引用
  const dateScrollRef = useRef<ScrollView>(null);
  
    const fetchMeals = async (date: Date) => {
      try {
        setIsLoading(true);
        const mealsData = await fetchMealsByDate(date);
  
        // 添加数据字段映射，确保服务器返回的 total_calories 字段被正确映射到 calories 字段
        const formattedMeals = mealsData?.map(meal => ({
          id: meal.id,
          type: meal.type,
          time: meal.time || '',
          calories: meal.total_calories || 0, // 这里进行字段映射
          completed: meal.completed || false,
          foods: meal.foods || []
        })) || [];
        
        // 使用格式化后的数据
        setMeals(formattedMeals);
        
        // 计算总营养数据
        calculateNutritionTotals(formattedMeals);
        
      } catch (error) {
        console.error('获取餐点数据失败:', error);
        Alert.alert('数据获取失败', '无法从服务器获取餐点数据，请重试');
        
        setMeals([]);
      } finally {
        setIsLoading(false);
      }
    };
  // 添加创建新餐点的函数
// 修改创建新餐点的函数
const addNewMeal = async () => {
  // 弹出输入框让用户选择餐点类型
  Alert.prompt(
    '添加新餐点',
    '请输入餐点类型',
    [
      {
        text: '取消',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: '添加',
        onPress: async (mealType) => {
          if (!mealType || mealType.trim() === '') {
            Alert.alert('错误', '餐点类型不能为空');
            return;
          }
          
          try {
            setIsLoading(true);
            
            // 构建新餐点数据
            const newMeal = {
              type: mealType.trim(),
              date: selectedDate.toISOString().split('T')[0],
              time: '',
              total_calories: 0,
              completed: false,
              foods: []
            };
            
            // 调用API创建新餐点
            const createdMeal = await createMeal(newMeal);
            console.log('服务器返回的餐点数据:', createdMeal);
            
            // 更新本地状态
            if (createdMeal) {
              // 确保将字段正确映射到组件使用的格式
              setMeals(prev => [...prev, {
                id: createdMeal.id,
                type: createdMeal.type, // 确保使用正确的字段名
                time: createdMeal.time || '',
                calories: createdMeal.total_calories || 0,
                completed: createdMeal.completed || false,
                foods: createdMeal.foods || []
              }]);
              
              // 直接重新获取数据，确保数据一致
              fetchMeals(selectedDate);
              
              Alert.alert('成功', `已添加"${mealType}"餐点`);
            }
          } catch (error) {
            console.error('创建餐点失败:', error);
            Alert.alert('错误', '创建餐点失败，请重试');
          } finally {
            setIsLoading(false);
          }
        }
      }
    ],
    'plain-text'
  );
};
  // 添加计算总营养数据的函数
  const calculateNutritionTotals = (mealsData: Meal[]) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    mealsData.forEach(meal => {
      meal.foods.forEach(food => {
        totalCalories += food.calories;
        totalProtein += food.protein || 0;
        totalCarbs += food.carbs || 0;
        totalFat += food.fat || 0;
      });
    });
    
    // 更新营养数据状态
    setNutritionData({
      calories: {
        current: totalCalories,
        goal: 2200
      },
      protein: {
        current: totalProtein,
        goal: 120
      },
      carbs: {
        current: totalCarbs,
        goal: 220
      },
      fats: {
        current: totalFat,
        goal: 73
      }
    });
  };

  // 修改 loadDataForDate 函数使用新的 fetchMeals 函数
    const loadDataForDate = async (date: Date) => {
      try {
        setIsDateLoading(true);
        
        // 格式化日期为YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        console.log(`加载 ${formattedDate} 的数据`);
        
        // 对所有日期都从服务器获取数据，不再区分是否为当天
        await fetchMeals(date);
        
      } catch (error) {
        console.error('加载日期数据失败:', error);
        Alert.alert('错误', '加载数据失败，请重试');
      } finally {
        setIsDateLoading(false);
      }
    };

    // 添加删除餐点的函数
  const handleDeleteMeal = (mealId: number, mealType: string) => {
    // 显示确认对话框
    Alert.alert(
      "删除餐点",
      `确定要删除"${mealType}"餐点及其所有食物记录吗？`,
      [
        {
          text: "取消",
          style: "cancel"
        },
        { 
          text: "删除", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 调用API删除餐点
              await deleteMeal(mealId);
              
              // 从本地状态中移除该餐点
              const mealToRemove = meals.find(meal => meal.id === mealId);
              if (mealToRemove) {
                // 从总营养数据中减去将被删除餐点的营养值
                let mealCalories = 0;
                let mealProtein = 0;
                let mealCarbs = 0;
                let mealFat = 0;
                
                mealToRemove.foods.forEach(food => {
                  mealCalories += food.calories;
                  mealProtein += food.protein || 0;
                  mealCarbs += food.carbs || 0;
                  mealFat += food.fat || 0;
                });
                
                // 更新总营养数据
                setNutritionData(prev => ({
                  calories: {
                    ...prev.calories,
                    current: Math.max(0, prev.calories.current - mealCalories),
                  },
                  protein: {
                    ...prev.protein,
                    current: Math.max(0, prev.protein.current - mealProtein),
                  },
                  carbs: {
                    ...prev.carbs,
                    current: Math.max(0, prev.carbs.current - mealCarbs),
                  },
                  fats: {
                    ...prev.fats,
                    current: Math.max(0, prev.fats.current - mealFat),
                  },
                }));
                
                // 更新餐点列表
                setMeals(prev => prev.filter(meal => meal.id !== mealId));
              }
              
              Alert.alert("成功", "餐点已成功删除");
            } catch (error) {
              console.error('删除餐点失败:', error);
              Alert.alert("错误", "删除餐点失败，请重试");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };


  useEffect(() => {
    if (!isManualDateChange) {
      // 只有当不是手动改变日期时才加载
      loadDataForDate(selectedDate);
    } else {
      // 重置标记
      setIsManualDateChange(false);
    }
  }, [selectedDate]);


  // 获取日期数组用于日历显示 - 修改这个函数
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

// 监听选中日期变化，加载对应数据
useEffect(() => {
  loadDataForDate(selectedDate);
}, [selectedDate]);

// 格式化完整日期显示
const formatFullDate = (date: Date) => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}`;
};


  // 添加删除食物函数
// 修改 handleDeleteFood 函数

const handleDeleteFood = async (mealId: number, foodIndex: number) => {
  try {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) {
      Alert.alert('错误', `找不到ID为${mealId}的餐点`);
      return;
    }
    
    const food = meal.foods[foodIndex];
    if (!food) {
      Alert.alert('错误', '找不到要删除的食物');
      return;
    }
    
    if (!food.id) {
      Alert.alert('错误', '无法删除该食物，食物ID不存在');
      return;
    }
    
    setIsLoading(true);
    
    // 调用API删除食物 - 记录日志帮助调试
    console.log('删除食物:', food.id);
    await deleteFood(food.id);
    
    // 计算新的餐点卡路里
    const foodCalories = typeof food.calories === 'number' ? food.calories : 0;
    const mealCalories = typeof meal.calories === 'number' ? meal.calories : 0;
    const newCalories = Math.max(0, mealCalories - foodCalories);
    console.log('餐点卡路里:', mealCalories, '食物卡路里:', foodCalories, '删除后卡路里:', newCalories);
    
    // 更新餐点的总卡路里
    await updateMeal(mealId, {
      total_calories: newCalories,
    });
    
    // 更新本地状态
    setMeals(prev => 
      prev.map(m => {
        if (m.id === mealId) {
          const updatedMeal = {
            ...m,
            calories: newCalories,
            foods: m.foods.filter((_, index) => index !== foodIndex)
          };
          console.log('更新后的餐点数据:', updatedMeal);
          return updatedMeal;
        }
        return m;
      })
    );
    
    // 更新总营养数据
    setNutritionData(prev => ({
      calories: {
        ...prev.calories,
        current: Math.max(0, prev.calories.current - foodCalories),
      },
      protein: {
        ...prev.protein,
        current: Math.max(0, prev.protein.current - (food.protein || 0)),
      },
      carbs: {
        ...prev.carbs,
        current: Math.max(0, prev.carbs.current - (food.carbs || 0)),
      },
      fats: {
        ...prev.fats,
        current: Math.max(0, prev.fats.current - (food.fat || 0)),
      },
    }));
    
    Alert.alert('成功', '已删除该食物');
  } catch (error) {
    console.error('删除食物失败:', error);
  } finally {
    setIsLoading(false);
  }
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
        // 在 ResultModal 的 onConfirm 回调中修改

        onConfirm={async ({ name, weight, energy }) => {
          console.log('📥 用户确认记录:', name, weight, energy);
          
          try {
            if (currentMealId !== null) {
              setIsLoading(true);
              
              // 获取当前时间
              const now = new Date();
              const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
              
              // 从结果中获取营养数据
              const selectedFood = resultData[0];
              
              // 计算实际的营养值
              const calorieValue = Math.round(selectedFood.calorie);
              const proteinValue = Math.round(selectedFood.protein);
              const fatValue = Math.round(selectedFood.fat);
              const carbsValue = Math.round(selectedFood.carbs);
              
              // 构建食物数据
              const newFood = {
                name,
                amount: `${weight}g`,
                calories: calorieValue,
                protein: proteinValue,
                fat: fatValue,
                carbs: carbsValue,
              };
              
              // 找到当前餐点
              const currentMeal = meals.find(meal => meal.id === currentMealId);
              if (currentMeal) {
                try {
                  // 添加食物 - 服务器可能会自动更新餐点的总卡路里
                  console.log('添加食物到餐点:', currentMealId, newFood);
                  const addedFood = await addFoodToMeal(currentMealId, newFood);
                  console.log('服务器返回的添加食物结果:', addedFood);
                  await updateMeal(currentMealId, {
                    time: currentTime,
                    completed: true,
                    total_calories: currentMeal.calories + calorieValue
                  });
                  // 不要重新获取所有数据，而是通过本地更新确保不会重复计算
                  setMeals(prev => {
                    return prev.map(meal => {
                      if (meal.id === currentMealId) {
                        // 创建更新后的餐点对象
                        const updatedMeal = {
                          ...meal,
                          time: meal.time || currentTime,
                          completed: true,
                          calories: meal.calories + calorieValue, // 这里只加一次卡路里
                          foods: [...meal.foods, {
                            ...newFood,
                            id: addedFood.id
                          }]
                        };
                        console.log('更新后的餐点数据:', updatedMeal);
                        return updatedMeal;
                      }
                      return meal;
                    });
                  });
                  
                  // 更新总营养数据
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
                  
                  // 显示成功提示
                  Alert.alert('成功', `已将"${name}"添加到餐点中`);
                } catch (error) {
                  console.error('添加食物失败:', error);
                  throw error;
                }
              } else {
                throw new Error(`找不到ID为${currentMealId}的餐点`);
              }
            }
          } catch (error) {
            console.error('添加食物失败:', error);
          } finally {
            setIsLoading(false);
            setModalVisible(false);
            setIsCameraVisible(false);
            setResultData([]);
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>饮食管理</Text>
          <Text style={styles.headerDate}>{formatFullDate(selectedDate)}</Text>
        </View>
        
        {/* 日期选择器 - 修改部分 */}
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
                      
                      // 直接调用 fetchMeals 从服务器获取最新数据
                      
                      fetchMeals(date);
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
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isDateLoading ? (
          <View style={styles.dateLoadingContainer}>
            <ActivityIndicator size="large" color="#2A86FF" />
            <Text style={styles.loadingText}>加载数据中...</Text>
          </View>
        ) : (
          <>
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
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>今日膳食</Text>
    <TouchableOpacity 
      style={styles.addMealButton}
      onPress={addNewMeal}
    >
      <Ionicons name="add-circle" size={24} color="#2A86FF" />
      <Text style={styles.addMealText}>添加餐点</Text>
    </TouchableOpacity>
  </View>

  {/* 餐点列表 - 修复嵌套循环问题 */}
  {meals.length > 0 ? (
    meals.map((meal) => (
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
            
            <View style={styles.mealHeaderRight}>
              {/* 添加删除餐点按钮 */}
              <TouchableOpacity 
                style={styles.deleteMealButton}
                onPress={() => handleDeleteMeal(meal.id, meal.type)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
              
              <View style={styles.mealCalories}>
                <Text style={styles.mealCaloriesText}>{meal.calories} 千卡</Text>
              </View>
            </View>
          </View>
        
        <View style={styles.mealFoods}>
          {meal.foods.map((food, index) => (
            <View key={`${meal.id}-food-${index}`} style={styles.foodItem}>
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
                            onPress: () => handleDeleteFood(meal.id, index),
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
              setCurrentMealId(meal.id);
              setResultData([]);
              setIsCameraVisible(true);
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.mealAddButtonText}>记录此餐</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))
  ) : (
    <View style={styles.emptyMealsContainer}>
      <Ionicons name="restaurant-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyMealsText}>当日暂无餐点记录</Text>
      <Text style={styles.emptyMealsSubText}>点击"添加餐点"开始记录当日膳食</Text>
    </View>
  )}
</View>
        </>
        )}
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
  // 添加新的样式
  headerTitleContainer: {
    marginBottom: 8,
  },
  headerDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
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
  // 添加新样式
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 134, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addMealText: {
    fontSize: 14,
    color: '#2A86FF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyMealsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyMealsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptyMealsSubText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  // 添加新样式
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteMealButton: {
    padding: 8,
    marginRight: 8,
  },
});