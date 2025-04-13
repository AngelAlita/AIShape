import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypoint, fetchPose } from '../api/poseDection';
import Svg, { Circle, Line } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';

export default function HomeScreen() {
  const router = useRouter();
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [userName, setUserName] = useState('用户');
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const isCameraVisibleRef = useRef(false);
  // 获取当前日期并格式化
  const today = new Date();
  const currentDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const [keypoints, setKeypoints] = useState<any[]>([]);  // 存储骨骼点数据
  const [svgWidth, setSvgWidth] = useState(0); // 用于存储SVG的宽度
  const [svgHeight, setSvgHeight] = useState(0); // 用于存储SVG的高度
  const renderKeypoints = () => {
    const lines = [
      [0, 1], [0, 4],
      [1, 2], [2, 3],
      [3, 5],
      [5, 6], [5, 10],
      [6, 8], [7, 9],
      [9, 10],
      [11, 12], [11, 13],
      [11, 23],
      [12, 14], [12, 24],
      [13, 15], [14, 16],
      [15, 17], [15, 19],
      [15, 21],
      [16, 18], [16, 20], [16, 22],
      [17, 19],
      [18, 20],
      [23, 24], [23, 25],
      [24, 26],
      [25, 27],
      [26, 28],
      [27, 29],
      [27, 31],
      [28, 30],
      [28, 32],
      [29, 31], [30, 32]
    ];
    
    
    return (
      <>
        {keypoints.map((point, index) => (
          <Circle
            key={index}
            cx={point.x * svgWidth}
            cy={point.y * svgHeight}
            r="5"
            fill="red"
          />
        ))}
        {lines.map((line, index) => {
          const point1 = keypoints[line[0]];
          const point2 = keypoints[line[1]];

          if (point1 && point2) {
            return (
              <Line
                key={index}
                x1={point1.x * svgWidth}
                y1={point1.y * svgHeight}
                x2={point2.x * svgWidth}
                y2={point2.y * svgHeight}
                stroke="blue"
                strokeWidth="2"
              />
            );
          }
          return null;
        })}
      </>
    );
  };
  // 加载用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('user_info');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          setUserName(userInfo.name || userInfo.username || '用户');
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    };

    loadUserInfo();
  }, []);
  const compressImage = async (uri: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // 设置压缩后的宽度，按比例缩小
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // 压缩到50%质量
      );
      console.log('压缩后的图片:', result);
      return result.uri; // 返回压缩后的图片 URI
    } catch (error) {
      console.error('图像压缩失败:', error);
      return uri; // 如果压缩失败，返回原始的 URI
    }
  };
  const handlePress = async () => {
    setIsCameraVisible(true);
    isCameraVisibleRef.current = true;
    if (!hasPermission) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        alert('Camera permission is required');
        return;
      }
    }
    const captureAndSend = async () => {
      console.log(isCameraVisibleRef.current);
      while (isCameraVisibleRef.current) {
        const options = { quality: 0.5, base64: true };
        try {
          // 拍摄一张照片
          const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0, // 设置图像质量，范围为0（最低质量）到1（最高质量）
            qualityPrioritization: 'speed', // 或者使用 'speed' 来更快地拍摄并减少质量
            skipMetadata: false,
            flashMode: 'off',
            shutterAnimationDisabled: true,
          });
    
          // 将拍摄的照片转换为 Base64 编码的字符串
          const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const compressedImageUri = await compressImage(photo.uri);
          const result = await fetchPose(compressedImageUri);  // 发送图片数据
          console.log('骨骼点数据:', result.message);
          if (result.status === 'success') {
            setKeypoints(result.keypoints);  // 如果骨骼点数据成功返回，更新状态
          } else {
            setKeypoints([]);
            console.log('未检测到骨骼');
          }
        } catch (error) {
          console.log('Error capturing image:', error);
        }
    
        // // 添加一个延迟，避免过于频繁地捕获图像
        // await new Promise((resolve) => setTimeout(resolve, 125));
      }
    };
  
    captureAndSend();
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  function toggleCameraVisibility() {
    isCameraVisibleRef.current = !isCameraVisibleRef.current;
    setIsCameraVisible(!isCameraVisible);
    setKeypoints([])
  }
  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setSvgWidth(width);  // 获取宽度
    setSvgHeight(height); // 获取高度
  };
  return (
    <View style={styles.container}>
      {isCameraVisible && (
      <><CameraView style={styles.camera} facing={facing} ref={cameraRef} onLayout={onLayout} >
          {/* 切换镜头 */}
          <TouchableOpacity style={styles.closeButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={40} color="white" />
          </TouchableOpacity>

          {/* 返回 */}
          <TouchableOpacity style={styles.backButton} onPress={toggleCameraVisibility}>
            <Ionicons name="arrow-back" size={40} color="white" />
          </TouchableOpacity>
          <Svg height={svgHeight} width={svgWidth} style={[styles.svgContainer]}>
            {renderKeypoints()}
          </Svg>
        </CameraView>

          </>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => router.push('/training')}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#2A86FF' }]}>
              <FontAwesome5 name="dumbbell" size={20} color="white" />
            </View>
            <Text style={styles.quickAccessText}>开始训练</Text>
          </TouchableOpacity>

          {/* 饮食记录按钮 */}
          <TouchableOpacity style={styles.quickAccessButton} onPress={() => router.push('/diet')}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#FFD166' }]}>
              <Ionicons name="restaurant" size={22} color="white" />
            </View>
            <Text style={styles.quickAccessText}>饮食记录</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessButton} onPress={() => router.push('/stats')}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="body" size={22} color="white" />
            </View>
            <Text style={styles.quickAccessText}>身体数据</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessButton} onPress={handlePress}>
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
            <View style={[styles.planIconContainer, { backgroundColor: '#FFD166' }]}>
              <Ionicons name="restaurant-outline" size={16} color="white" />
            </View>
            <View>
              <Text style={styles.planTitle}>午餐推荐</Text>
              <Text style={styles.planSubtitle}>12:30 | 450千卡</Text>
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
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
  backButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
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
  camera: {
    width: '100%',
    height: '100%',
  },
  progressBarText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
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