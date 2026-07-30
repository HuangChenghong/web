import { create } from 'zustand';

// 从 localStorage 读取用户信息
const loadUser = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    if (userInfo) {
      return {
        ...JSON.parse(userInfo),
        userId,
        username
      };
    }
  } catch (e) {
    console.warn('读取用户信息失败:', e);
  }
  return null;
};

export const useUserStore = create(set => ({
  user: loadUser(),

  // 登录时设置用户信息
  login: userData => {
    const user = {
      ...userData,
      userId: userData.id,
      username: userData.username
    };
    // 同步到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userData));
    if (userData.id) localStorage.setItem('userId', String(userData.id));
    if (userData.username) localStorage.setItem('username', userData.username);
    set({ user });
  },

  // 更新用户信息
  update: userData => {
    set(state => {
      const newUser = { ...state.user, ...userData };
      // 同步到 localStorage
      localStorage.setItem('userInfo', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  // 退出登录
  logout: () => {
    localStorage.clear();
    set({ user: null });
  }
}));
