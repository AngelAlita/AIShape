import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDarkMode: false,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // 加载保存的主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('无法加载主题设置:', error);
      }
    };
    
    loadTheme();
  }, []);

  // 当主题或系统主题变化时更新isDarkMode
  useEffect(() => {
    if (theme === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  // 设置主题并保存到AsyncStorage
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme_preference', newTheme);
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};