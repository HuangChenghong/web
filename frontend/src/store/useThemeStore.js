import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主题配置
export const themes = {
  ocean: {
    name: '海洋蓝',
    primary: '#3b82f6',
    primaryDeep: '#2563eb',
    secondary: '#6366f1',
    background: '#f0f9ff',
    surface: '#ffffff',
    border: '#e0f2fe',
    textStrong: '#0f172a',
    textMuted: '#64748b',
    textFaint: '#94a3b8',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    like: '#ef4444',
    collect: '#f59e0b'
  },
  forest: {
    name: '森林绿',
    primary: '#10b981',
    primaryDeep: '#059669',
    secondary: '#06b6d4',
    background: '#f0fdf4',
    surface: '#ffffff',
    border: '#dcfce7',
    textStrong: '#064e3b',
    textMuted: '#374151',
    textFaint: '#6b7280',
    success: '#10b981',
    warning: '#d97706',
    danger: '#dc2626',
    like: '#dc2626',
    collect: '#d97706'
  },
  sunset: {
    name: '落日橙',
    primary: '#f97316',
    primaryDeep: '#ea580c',
    secondary: '#ec4899',
    background: '#fff7ed',
    surface: '#ffffff',
    border: '#fed7aa',
    textStrong: '#431407',
    textMuted: '#7c2d12',
    textFaint: '#9a3412',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#dc2626',
    like: '#dc2626',
    collect: '#f59e0b'
  },
  purple: {
    name: '优雅紫',
    primary: '#8b5cf6',
    primaryDeep: '#7c3aed',
    secondary: '#ec4899',
    background: '#faf5ff',
    surface: '#ffffff',
    border: '#e9d5ff',
    textStrong: '#1e1b4b',
    textMuted: '#4c1d95',
    textFaint: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    like: '#ef4444',
    collect: '#f59e0b'
  },
  dark: {
    name: '暗夜模式',
    primary: '#818cf8',
    primaryDeep: '#6366f1',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    textStrong: '#f8fafc',
    textMuted: '#cbd5e1',
    textFaint: '#64748b',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    like: '#f87171',
    collect: '#fbbf24'
  }
};

// persist:Zustand persist 持久化中间件 把 Zustand 状态自动存入 localStorage/sessionStorage，页面刷新、关闭重开数据不丢失
export const useThemeStore = create(
  persist(
    (set, get) => ({
      currentTheme: 'ocean',
      setTheme: themeName => set({ currentTheme: themeName }),
      getTheme: () => themes[get().currentTheme]
    }),
    {
      name: 'theme-storage', //localStorage 的 key 名称，必填，不能重复
      storage: {
        getItem: name => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : { currentTheme: 'ocean' };
        },
        setItem: (name, value) =>
          localStorage.setItem(name, JSON.stringify(value)),
        removeItem: name => localStorage.removeItem(name)
      }
    }
  )
);
