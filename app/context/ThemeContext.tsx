import React, { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// 添加默认导出组件以满足Expo Router要求
export default function ThemeContextPage() {
  return (
    <ThemeProvider>
      <></>
    </ThemeProvider>
  );
}