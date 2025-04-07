import React, { ReactNode, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';

// 用户数据接口
interface UserData {
  name: string;
  level: string;
  joinDays: number;
  completedWorkouts: number;
  achievements: number;
  height: string;
  weight: string;
  bmi: string;
  birthday?: string; // 可选字段
  gender?: string;  // 可选字段
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 用户数据状态
  const [userData, setUserData] = useState<UserData>({
    name: "用户",
    level: "健身新手",
    joinDays: 0,
    completedWorkouts: 0,
    achievements: 0,
    height: '--',
    weight: '--',
    bmi: '--'
  });
  
   // 编辑相关状态
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    height: '',
    weight: '',
    birthday: '',
    gender: ''
  });
  const [updating, setUpdating] = useState(false);
  
  // 添加类型定义
  interface MenuItemProps {
    icon: ReactNode;
    title: string;
    rightText?: string;
    color?: string;
    onPress?: () => void;
  }
// 加载用户数据
const loadUserData = async () => {
  try {
    setIsLoading(true);
    
    const userInfoString = await AsyncStorage.getItem('user_info');
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      
      // 计算 BMI
      let bmiValue = '--';
      if (userInfo.height && userInfo.current_weight) {
        const heightInMeters = userInfo.height / 100;
        const bmi = userInfo.current_weight / (heightInMeters * heightInMeters);
        bmiValue = bmi.toFixed(1);
      }
      // 计算加入天数
      let joinDays = 0;
      if (userInfo.created_at) {
        const createdDate = new Date(userInfo.created_at);
        const currentDate = new Date();
        
        // 计算日期差
        const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
        joinDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      /// 更新用户数据
      setUserData({
        name: userInfo.name || userInfo.username || "用户",
        level: userInfo.level || "健身新手",
        joinDays: joinDays || 0, // 使用计算出的真实加入天数
        completedWorkouts: userInfo.completedWorkouts || 0,
        achievements: userInfo.achievements || 0,
        height: userInfo.height ? String(userInfo.height) : '--',
        weight: userInfo.current_weight ? String(userInfo.current_weight) : '--',
        bmi: bmiValue
      });
    } else {
      // 没有用户数据时保留默认数据
      console.log('未找到用户数据');
    }
  } catch (error) {
    console.error('加载用户数据失败:', error);
  } finally {
    setIsLoading(false);
  }
};

// 初始加载
useEffect(() => {
  loadUserData();
}, []);

// 刷新数据
const onRefresh = async () => {
  setRefreshing(true);
  await loadUserData();
  setRefreshing(false);
};

// 打开编辑模式
const handleEdit = () => {
  // 从 AsyncStorage 获取最新的用户信息
  AsyncStorage.getItem('user_info').then(userInfoString => {
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      
      setEditData({
        name: userInfo.name || '',
        height: userInfo.height ? String(userInfo.height) : '',
        weight: userInfo.current_weight ? String(userInfo.current_weight) : '',
        birthday: userInfo.birthday || '',
        gender: userInfo.gender || ''
      });
    }
    
    setIsEditing(true);
  }).catch(error => {
    console.error('获取用户信息失败:', error);
    setIsEditing(true); // 即使失败也打开编辑窗口，但不预填数据
  });
};

// 保存编辑数据
const handleSaveEdit = async () => {
  try {
    setUpdating(true);
    
    // 解析输入值
    const height = editData.height ? parseFloat(editData.height) : null;
    const weight = editData.weight ? parseFloat(editData.weight) : null;
    
    // 验证输入
    if (editData.height && isNaN(height!)) {
      throw new Error('身高必须是有效的数字');
    }
    
    if (editData.weight && isNaN(weight!)) {
      throw new Error('体重必须是有效的数字');
    }
    
    // 验证生日格式
    if (editData.birthday) {
      const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!birthdayRegex.test(editData.birthday)) {
        throw new Error('生日格式必须为 YYYY-MM-DD');
      }
      
      // 额外检查日期是否有效
      const birthdayDate = new Date(editData.birthday);
      if (isNaN(birthdayDate.getTime())) {
        throw new Error('请输入有效的日期');
      }
    }
    
    // 获取当前用户信息
    const userInfoString = await AsyncStorage.getItem('user_info');
    const authToken = await AsyncStorage.getItem('auth_token');
    
    if (!userInfoString || !authToken) {
      throw new Error('找不到用户信息或认证令牌');
    }
    
    const userInfo = JSON.parse(userInfoString);
    
    // 准备要发送到服务器的数据
    const updateData = {
      name: editData.name || userInfo.name,
      height: height || userInfo.height,
      current_weight: weight || userInfo.current_weight,
      birthday: editData.birthday || userInfo.birthday,
      gender: editData.gender || userInfo.gender
    };
    
    // 调用服务器API更新用户信息
    console.log('准备更新用户数据:', updateData);
    
    const response = await fetch(`http://1.94.60.194:5000/api/users/${userInfo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    // 检查响应状态
    console.log('服务器响应状态:', response.status);
    
    if (!response.ok) {
      // 尝试获取错误消息
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `服务器错误 (${response.status})`;
      } catch (e) {
        errorMessage = `服务器错误 (${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    // 解析服务器响应
    const responseData = await response.json();
    console.log('服务器返回的用户数据:', responseData);
    
    // 计算 BMI
    let bmiValue = userData.bmi;
    if (height && weight) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      bmiValue = bmi.toFixed(1);
    }
    
    // 更新本地存储的用户信息
    const updatedUserInfo = {
      ...userInfo,
      ...updateData,
      // 如果服务器返回了更新后的完整用户数据，可以使用服务器数据
      ...(responseData.user || {})
    };
    
    // 保存到本地存储
    await AsyncStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
    
    // 更新 UI 显示
    setUserData({
      ...userData,
      name: editData.name || userData.name,
      height: height ? String(height) : userData.height,
      weight: weight ? String(weight) : userData.weight,
      bmi: bmiValue,
      birthday: editData.birthday || userInfo.birthday,
      gender: editData.gender || userInfo.gender
    });
    
    // 关闭编辑模式
    setIsEditing(false);
    
    // 提示成功
    if (Platform.OS === 'web') {
      window.alert('个人资料已更新');
    } else {
      Alert.alert('成功', '个人资料已更新');
    }
    
  } catch (error) {
    console.error('保存用户数据失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '更新失败，请重试';
    
    if (Platform.OS === 'web') {
      window.alert(`更新失败: ${errorMessage}`);
    } else {
      Alert.alert('错误', errorMessage);
    }
  } finally {
    setUpdating(false);
  }
};

  // 处理退出登录
  const handleLogout = async () => {
    // 显示确认对话框，使用条件检查以区分平台
    const confirmLogout = Platform.OS === 'web' 
      ? window.confirm("确定要退出登录吗？") 
      : await new Promise((resolve) => {
          Alert.alert(
            "退出登录",
            "确定要退出登录吗？",
            [
              { text: "取消", style: "cancel", onPress: () => resolve(false) },
              { text: "确定", onPress: () => resolve(true) }
            ]
          );
        });
    
    if (confirmLogout) {
      try {
        setLoggingOut(true);
        
        // 获取认证令牌
        const authToken = await AsyncStorage.getItem('auth_token');
        
        // 调用后端登出API
        if (authToken) {
          try {
            const response = await fetch('http://1.94.60.194:5000/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              }
            });
            
            // 记录API响应结果
            console.log('退出登录API响应状态:', response.status);
            
            // 即使登出API不成功，我们仍然要继续清除本地存储
            if (!response.ok) {
              console.warn('退出登录API返回非成功状态码:', response.status);
            }
          } catch (apiError) {
            // 即使API调用失败，仍然继续本地登出流程
            console.warn("调用退出登录API时出错:", apiError);
          }
        } else {
          console.log('未找到认证令牌，仅执行本地登出');
        }
        
        // 清除本地存储的令牌
        await AsyncStorage.removeItem('auth_token');
        
        // 清除可能存储的用户信息
        await AsyncStorage.removeItem('user_info');
        
        // 根据平台选择适当的导航方式
        if (Platform.OS === 'web') {
          // 在浏览器中，使用全局导航
          window.location.href = '/auth';
        } else {
          // 在移动应用中，使用 expo-router
          router.replace('/auth');
        }
      } catch (error) {
        console.error('退出登录失败:', error);
        
        if (Platform.OS === 'web') {
          window.alert("退出登录时发生错误，请重试");
        } else {
          Alert.alert("错误", "退出登录时发生错误，请重试");
        }
      } finally {
        setLoggingOut(false);
      }
    }
  };

  // 菜单项组件
  // 菜单项组件
  const MenuItem = ({ icon, title, rightText, color = "#2A86FF", onPress }: MenuItemProps) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress || (() => {})}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
        <MaterialIcons name="keyboard-arrow-right" size={22} color="#CCC" />
      </View>
    </TouchableOpacity>
  );
  // 编辑模态窗口
const renderEditModal = () => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={isEditing}
    onRequestClose={() => setIsEditing(false)}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>编辑个人资料</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>姓名</Text>
            <TextInput
              style={styles.textInput}
              value={editData.name}
              onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
              placeholder="输入您的姓名"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>生日 (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={editData.birthday}
              onChangeText={(text) => setEditData(prev => ({ ...prev, birthday: text }))}
              placeholder="例如：1990-01-01"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>性别</Text>
            <View style={styles.genderSelection}>
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  editData.gender === 'male' && styles.genderOptionSelected
                ]} 
                onPress={() => setEditData(prev => ({ ...prev, gender: 'male' }))}
              >
                <Ionicons 
                  name="male" 
                  size={20} 
                  color={editData.gender === 'male' ? "#ffffff" : "#666"} 
                />
                <Text style={[
                  styles.genderText, 
                  editData.gender === 'male' && styles.genderTextSelected
                ]}>男</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.genderOption, 
                  editData.gender === 'female' && styles.genderOptionSelected
                ]} 
                onPress={() => setEditData(prev => ({ ...prev, gender: 'female' }))}
              >
                <Ionicons 
                  name="female" 
                  size={20} 
                  color={editData.gender === 'female' ? "#ffffff" : "#666"} 
                />
                <Text style={[
                  styles.genderText, 
                  editData.gender === 'female' && styles.genderTextSelected
                ]}>女</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>身高 (cm)</Text>
            <TextInput
              style={styles.textInput}
              value={editData.height}
              onChangeText={(text) => setEditData(prev => ({ ...prev, height: text }))}
              keyboardType="numeric"
              placeholder="输入您的身高"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>体重 (kg)</Text>
            <TextInput
              style={styles.textInput}
              value={editData.weight}
              onChangeText={(text) => setEditData(prev => ({ ...prev, weight: text }))}
              keyboardType="numeric"
              placeholder="输入您的体重"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveEdit}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

  // 如果正在加载数据显示加载指示器
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2A86FF" />
        <Text style={{ marginTop: 16, color: '#666' }}>正在加载用户数据...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {renderEditModal()}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2A86FF']}
            tintColor="#2A86FF"
          />
        }
      >
        {/* 个人信息头部 */}
        <LinearGradient
          colors={['#2A86FF', '#3F99FF']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, { paddingTop: 16 }]}
        >
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userData.name.charAt(0)}</Text>
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{userData.level}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.joinDays}</Text>
              <Text style={styles.statLabel}>坚持天数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.completedWorkouts}</Text>
              <Text style={styles.statLabel}>完成训练</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.achievements}</Text>
              <Text style={styles.statLabel}>获得成就</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* 身体数据卡片 */}
        <View style={styles.bodyCard}>
          <View style={styles.bodyCardHeader}>
            <Text style={styles.cardTitle}>身体数据</Text>
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>编辑</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bodyDataRow}>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>身高</Text>
              <Text style={styles.dataValue}>
                {userData.height}<Text style={styles.dataUnit}>{userData.height !== '--' ? 'cm' : ''}</Text>
              </Text>
            </View>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>体重</Text>
              <Text style={styles.dataValue}>
                {userData.weight}<Text style={styles.dataUnit}>{userData.weight !== '--' ? 'kg' : ''}</Text>
              </Text>
            </View>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>BMI</Text>
              <Text style={styles.dataValue}>{userData.bmi}</Text>
            </View>
          </View>
        </View>
        
        
        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>个人与数据</Text>
          
          <View style={styles.menuCard}>
            <MenuItem 
              icon={<FontAwesome5 name="user-alt" size={16} color="#2A86FF" />}
              title="个人资料"
              onPress={handleEdit}
            />
            <MenuItem 
              icon={<Ionicons name="fitness" size={18} color="#FF6B6B" />}
              title="训练记录"
              color="#FF6B6B"
            />
            <MenuItem 
              icon={<Ionicons name="restaurant-outline" size={18} color="#FFD166" />}
              title="饮食记录"
              color="#FFD166"
            />
            <MenuItem 
              icon={<Ionicons name="trophy-outline" size={18} color="#4CD97B" />}
              title="我的成就"
              rightText={`${userData.achievements}项成就`}
              color="#4CD97B"
            />
          </View>
        </View>
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>应用设置</Text>
          
          <View style={styles.menuCard}>
            <MenuItem 
              icon={<Ionicons name="notifications-outline" size={18} color="#2A86FF" />}
              title="通知设置"
            />
            <MenuItem 
              icon={<MaterialIcons name="privacy-tip" size={18} color="#FF6B6B" />}
              title="隐私设置"
              color="#FF6B6B"
            />
            <MenuItem 
              icon={<Ionicons name="moon-outline" size={18} color="#FFD166" />}
              title="深色模式"
              color="#FFD166"
            />
            <MenuItem 
              icon={<Ionicons name="help-circle-outline" size={18} color="#4CD97B" />}
              title="帮助与反馈"
              color="#4CD97B"
            />
          </View>
        </View>
        
        {/* 退出登录按钮 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Text style={styles.logoutText}>退出登录</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.versionText}>AI Shape v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  bodyCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
  bodyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    color: '#2A86FF',
    fontSize: 14,
  },
  bodyDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyDataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dataUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
    color: '#555',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRightText: {
    fontSize: 13,
    color: '#888',
    marginRight: 4,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 10,
  },
  // 模态窗口样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      default: {
        elevation: 5,
      }
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2A86FF',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  // 添加性别选择相关样式
  genderSelection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 5
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 5,
    flex: 1,
    justifyContent: 'center'
  },
  genderOptionSelected: {
    backgroundColor: '#2A86FF',
    borderColor: '#2A86FF',
  },
  genderText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16
  },
  genderTextSelected: {
    color: 'white'
  },
});