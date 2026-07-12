import axios from 'axios';
import { message } from 'antd';

const service = axios.create({
  baseURL: '/api', // 后端接口的基础路径
  timeout: 15000, // 请求超时时间
  withCredentials: true   // ← 加上这句，自动带 cookie
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
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('token');
        window.location.href = '/login';
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
