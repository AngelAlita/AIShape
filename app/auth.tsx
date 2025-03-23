import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 添加在import语句之后，组件之前
type LoginFormField = 'username' | 'password';
type RegisterFormField = 'username' | 'email' | 'password' | 'confirmPassword';
const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  
  // 登录表单状态
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });
  
  // 注册表单状态
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // 表单错误状态
  const [errors, setErrors] = useState({
    login: { username: '', password: '' },
    register: { username: '', email: '', password: '', confirmPassword: '' }
  });
  
  // 动画值
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityLogin = useRef(new Animated.Value(1)).current;
  const opacityRegister = useRef(new Animated.Value(0)).current;
  
  // 处理登录表单变化
  const handleLoginChange = (field:LoginFormField, value:string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors.login[field]) {
      setErrors(prev => ({
        ...prev,
        login: { ...prev.login, [field]: '' }
      }));
    }
  };
  
  // 处理注册表单变化
  const handleRegisterChange = (field:RegisterFormField, value:string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors.register[field]) {
      setErrors(prev => ({
        ...prev,
        register: { ...prev.register, [field]: '' }
      }));
    }
  };
  
  // 验证登录表单
  const validateLoginForm = () => {
    let valid = true;
    const newErrors = { username: '', password: '' };
    
    if (!loginForm.username.trim()) {
      newErrors.username = '请输入用户名或邮箱';
      valid = false;
    }
    
    if (!loginForm.password) {
      newErrors.password = '请输入密码';
      valid = false;
    } else if (loginForm.password.length < 6) {
      newErrors.password = '密码不得少于6位';
      valid = false;
    }
    
    setErrors(prev => ({
      ...prev,
      login: newErrors
    }));
    
    return valid;
  };
  
  // 验证注册表单
  const validateRegisterForm = () => {
    let valid = true;
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' };
    
    if (!registerForm.username.trim()) {
      newErrors.username = '请输入用户名';
      valid = false;
    }
    
    if (!registerForm.email.trim()) {
      newErrors.email = '请输入邮箱';
      valid = false;
    } else {
      // 简单的邮箱验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerForm.email)) {
        newErrors.email = '请输入有效的邮箱';
        valid = false;
      }
    }
    
    if (!registerForm.password) {
      newErrors.password = '请输入密码';
      valid = false;
    } else if (registerForm.password.length < 6) {
      newErrors.password = '密码不得少于6位';
      valid = false;
    }
    
    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
      valid = false;
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
      valid = false;
    }
    
    setErrors(prev => ({
      ...prev,
      register: newErrors
    }));
    
    return valid;
  };
  
  // 提交登录
  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    
    setLoading(true);
    
    // 这里应该是实际的登录API调用
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 假设服务器返回的令牌
      const authToken = "example_auth_token_12345";
        
      // 存储令牌
      await AsyncStorage.setItem('auth_token', authToken);

      // 登录成功后跳转到主页
      router.replace('/(tabs)');
    } catch (error) {
      // 处理登录错误
      setErrors(prev => ({
        ...prev,
        login: { 
          ...prev.login, 
          password: '用户名或密码错误' 
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // 提交注册
  const handleRegister = async () => {
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    
    // 这里应该是实际的注册API调用
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 注册成功后自动登录并跳转到主页
      router.replace('/(tabs)');
    } catch (error) {
      // 处理注册错误
      setErrors(prev => ({
        ...prev,
        register: { 
          ...prev.register, 
          email: '该邮箱已被注册' 
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // 切换登录/注册表单
  const toggleForm = (toLogin:boolean) => {
    if ((toLogin && isLogin) || (!toLogin && !isLogin)) return;
    
    const toValue = toLogin ? 0 : width;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityLogin, {
        toValue: toLogin ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityRegister, {
        toValue: toLogin ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    setIsLogin(toLogin);
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <LinearGradient
        colors={['#2A86FF', '#3F99FF']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/react-logo.png')} // 请确保有这个图片或替换为你的logo
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>AI Shape</Text>
          <Text style={styles.appSlogan}>智能健康管理，专属你的健身教练</Text>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.formTabs}>
            <TouchableOpacity
              style={[styles.formTab, isLogin && styles.activeFormTab]}
              onPress={() => toggleForm(true)}
            >
              <Text style={[styles.formTabText, isLogin && styles.activeFormTabText]}>
                登录
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.formTab, !isLogin && styles.activeFormTab]}
              onPress={() => toggleForm(false)}
            >
              <Text style={[styles.formTabText, !isLogin && styles.activeFormTabText]}>
                注册
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <Animated.View 
              style={[
                styles.form, 
                { 
                  transform: [{ translateX: slideAnim }],
                  opacity: opacityLogin,
                  position: 'absolute',
                  width: '100%'
                }
              ]}
            >
              <Text style={styles.formTitle}>欢迎回来</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="用户名或邮箱"
                  placeholderTextColor="#888"
                  value={loginForm.username}
                  onChangeText={(text) => handleLoginChange('username', text)}
                  autoCapitalize="none"
                />
              </View>
              {errors.login.username ? (
                <Text style={styles.errorText}>{errors.login.username}</Text>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="密码"
                  placeholderTextColor="#888"
                  secureTextEntry={securePassword}
                  value={loginForm.password}
                  onChangeText={(text) => handleLoginChange('password', text)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setSecurePassword(!securePassword)}
                >
                  <Ionicons 
                    name={securePassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
              {errors.login.password ? (
                <Text style={styles.errorText}>{errors.login.password}</Text>
              ) : null}
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>忘记密码?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>登录</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.socialLoginContainer}>
                <View style={styles.socialDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>其他登录方式</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="wechat" size={24} color="#2DC100" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="apple" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.form, 
                { 
                  transform: [{ translateX: Animated.subtract(slideAnim, width) }],
                  opacity: opacityRegister,
                  width: '100%'
                }
              ]}
            >
              <Text style={styles.formTitle}>创建账户</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="用户名"
                  placeholderTextColor="#888"
                  value={registerForm.username}
                  onChangeText={(text) => handleRegisterChange('username', text)}
                  autoCapitalize="none"
                />
              </View>
              {errors.register.username ? (
                <Text style={styles.errorText}>{errors.register.username}</Text>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="邮箱"
                  placeholderTextColor="#888"
                  value={registerForm.email}
                  onChangeText={(text) => handleRegisterChange('email', text)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.register.email ? (
                <Text style={styles.errorText}>{errors.register.email}</Text>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="密码 (至少6位)"
                  placeholderTextColor="#888"
                  secureTextEntry={securePassword}
                  value={registerForm.password}
                  onChangeText={(text) => handleRegisterChange('password', text)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setSecurePassword(!securePassword)}
                >
                  <Ionicons 
                    name={securePassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
              {errors.register.password ? (
                <Text style={styles.errorText}>{errors.register.password}</Text>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="确认密码"
                  placeholderTextColor="#888"
                  secureTextEntry={secureConfirmPassword}
                  value={registerForm.confirmPassword}
                  onChangeText={(text) => handleRegisterChange('confirmPassword', text)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                >
                  <Ionicons 
                    name={secureConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={22} 
                    color="#888" 
                  />
                </TouchableOpacity>
              </View>
              {errors.register.confirmPassword ? (
                <Text style={styles.errorText}>{errors.register.confirmPassword}</Text>
              ) : null}
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  注册即表示您同意我们的
                  <Text style={styles.termsLink}> 服务条款 </Text>
                  和
                  <Text style={styles.termsLink}> 隐私政策</Text>
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>注册</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  appSlogan: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  formTabs: {
    flexDirection: 'row',
    marginBottom: 30,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    padding: 4,
  },
  formTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeFormTab: {
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeFormTabText: {
    color: '#2A86FF',
  },
  formContainer: {
    position: 'relative',
    height: 460, // 调整这个高度适应你的内容
    overflow: 'hidden',
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2A86FF',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2A86FF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 30,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#888',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#2A86FF',
    fontWeight: '500',
  },
});