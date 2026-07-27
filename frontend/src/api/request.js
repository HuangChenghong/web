import axios from 'axios';
import { message } from 'antd';

const service = axios.create({
  baseURL: '/api', // 后端接口的基础路径 ← 所有请求自动加 /api 前缀,本项目不能省略
  timeout: 15000, // 请求超时时间
  withCredentials: true // ← 加上这句，自动带 cookie
});

service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  response => {
    // 直接剥离一层data，业务页面少写一层
    const res = response.data;
    console.log('res=', res);
    if (res.code === 200) {
      return res;
    }
    message.error(res.msg || '请求失败');
    return Promise.reject(new Error(res.msg || '请求失败'));
  },
  error => {
    const status = error.response?.status;
    const msg = error.response?.data?.msg || error.message;
    if (!status) {
      message.error('服务器连接失败，请检查网络');
      return Promise.reject(error);
    }

    switch (status) {
      case 401:
        // ⚠️ 注意：路由守卫已经挡住了大多数 401（未登录根本进不来页面）
        // 走到这里通常意味着：cookie 过期但 localStorage 还在，或守卫漏掉了的请求
        // 所以静默清理 + 跳登录页，不弹错误（避免一闪而过的红字）
        localStorage.removeItem('token');
        // 用 hash 跳转，避免硬刷新（保留 SPA 状态）
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        break;
      case 403:
        message.error('没有权限');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      default:
        message.error(msg || '网络异常');
    }
    return Promise.reject(error);
  }
);

const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config });
  },

  post(url, data, config = {}) {
    return service.post(url, data, config);
  }
};

export default request;
