import React, { ReactNode, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import authApi from '../auth'; // 假设你已经创建了这个API服务

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // 模拟用户数据
  const user = {
    name: "小明",
    level: "健身新手",
    joinDays: 45,
    completedWorkouts: 23,
    achievements: 7
  };
  
    // 添加类型定义
  interface MenuItemProps {
      icon: ReactNode;
      title: string;
      rightText?: string;
      color?: string;
      onPress?: () => void;
    }
  
        // 处理退出登录
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
      
      // 如果有后端退出API，可以调用
      try {
        // 可选：调用后端登出API
        // await authApi.logout();
      } catch (apiError) {
        // 即使API调用失败，仍然继续本地登出流程
        console.warn("后端登出API调用失败", apiError);
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
  
  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{user.level}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.joinDays}</Text>
              <Text style={styles.statLabel}>坚持天数</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.completedWorkouts}</Text>
              <Text style={styles.statLabel}>完成训练</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.achievements}</Text>
              <Text style={styles.statLabel}>获得成就</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* 身体数据卡片 */}
        <View style={styles.bodyCard}>
          <View style={styles.bodyCardHeader}>
            <Text style={styles.cardTitle}>身体数据</Text>
            <TouchableOpacity>
              <Text style={styles.editButton}>编辑</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bodyDataRow}>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>身高</Text>
              <Text style={styles.dataValue}>175<Text style={styles.dataUnit}>cm</Text></Text>
            </View>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>体重</Text>
              <Text style={styles.dataValue}>68<Text style={styles.dataUnit}>kg</Text></Text>
            </View>
            <View style={styles.bodyDataItem}>
              <Text style={styles.dataLabel}>BMI</Text>
              <Text style={styles.dataValue}>22.2</Text>
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
              rightText={`${user.achievements}项成就`}
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
});