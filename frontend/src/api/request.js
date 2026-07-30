import axios from 'axios';

// ★ 极简 toast：纯 DOM 操作，不依赖任何 context/hook/AppProvider，100% 能弹
//   参数：text 要显示的文字；type 'error' | 'warning' | 'info'
// ─────────────────────────────────────────────────────────────────────
// 为什么不用 Antd 自带的 message / notification？
//   Antd 5 的静态调用（如 message.error）必须配合 <App> 组件 + useApp() hook
//   才能拿到持有正确 React context 的实例。
//   但 axios 拦截器运行在模块顶层，不在组件树内，调不到 useApp()。
//   即使外层包了 <App>，axios 的异步回调（微任务）里也常丢 context，
//   结果就是「error= 打印了、message 不弹」。
//   干脆自己写一个：零依赖、纯同步 DOM appendChild、100% 能弹。
// 优点：30 行搞定，不依赖任何环境配置；颜色与 Antd 5 默认一致。
const toast = (text, type = 'error') => {
  const el = document.createElement('div');
  el.textContent = text;
  // 颜色用 Antd 5 标准色：error=#ff4d4f 红、warning=#faad14 橙、info=#1677ff 蓝
  const colors = { error: '#ff4d4f', warning: '#faad14', info: '#1677ff' };
  el.style.cssText = [
    'position:fixed',
    'top:80px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:9999',
    'padding:10px 16px',
    'border-radius:6px',
    'color:#fff',
    'font-size:14px',
    'box-shadow:0 6px 16px rgba(0,0,0,.12)',
    `background:${colors[type] || colors.error}`,
    'max-width:400px',
    'pointer-events:none',
    'transition:opacity .2s'
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2500);
};

const service = axios.create({
  baseURL: '/api', // 后端接口的基础路径 ← 所有请求自动加 /api 前缀,本项目不能省略
  timeout: 15000, // 请求超时时间
  withCredentials: true // ← 加上这句，自动带 cookie
});

// 获取请求的key
const pendingMap = new Map();
const getPendingKey = config => {
  const { url, method } = config;
  return [url, method].join('&');
};
const removePending = config => {
  const key = getPendingKey(config);
  if (pendingMap.has(key)) {
    const controller = pendingMap.get(key);
    controller.abort(); // 取消上一次相同请求
    pendingMap.delete(key);
  }
};

service.interceptors.request.use(
  config => {
    // 每次发请求前，先取消重复的同类型请求（防抖取消）
    removePending(config);
    // 创建控制器
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingMap.set(getPendingKey(config), controller);

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
    // 直接剥离一层 data，业务页面少写一层
    const res = response.data;
    console.log('响应拦截器res=', res);
    if (res.code === 200) {
      return res;
    }
    // 参数顺序：先 msg 后 type，跟拦截器其他调用保持一致
    toast(res.msg || '请求失败', 'error');
    return Promise.reject(new Error(res.msg || '请求失败'));
  },
  error => {
    console.log('error=', error);
    const status = error.response?.status; // HTTP 状态码在 .status
    const msg = error.response?.data?.msg || error.message;

    if (!status) {
      // 取消请求时，这个弹窗也会弹出
      // toast('服务器连接失败，请检查网络', 'error');
      return Promise.reject(error); // 透传给外层 try/catch，让调用方能关闭 loading 等 UI 状态
    }

    // ↓ 按 HTTP 状态码分支处理常见错误（最终动作：toast 提示 / 跳登录）
    switch (status) {
      case 401:
        // ⚠️ 注意：路由守卫已经拦住了大多数 401（未登录基本进不来页面）
        // 走到这里通常意味着：cookie 过期但 localStorage 还在，或守卫没拦住的特殊请求
        // 所以静默清 token + 跳登录页，不弹错误（避免一闪而过的红字）
        localStorage.clear();
        // 用 replace 跳转，避免硬刷新（保留 SPA 状态）
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.replace('/login');
          }, 1000);
        }
        break;
      case 403:
        toast('没有权限', 'error');
        break;
      case 404:
        toast('请求的资源不存在', 'error');
        break;
      case 429:
        // 限流警告：橙色，区别于错误（红色），提示更友好
        toast('请求太频繁，请稍后再试', 'warning');
        break;
      default:
        toast(msg || '网络异常', 'error');
    }

    return Promise.reject(error); // 透传给外层 try/catch，让调用方能关闭 loading 等 UI 状态
  }
);

const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config });
  },
  post(url, data, config = {}) {
    return service.post(url, data, config);
  },
  // formData提交数据 POST
  // 实际上，对于 multipart/form-data 类型的请求， 通常不需要手动设置 Content-Type 。因为浏览器在
  // 发送 FormData 时会自动添加正确的 Content-Type （包含 boundary 信息），手动设置反而可能导致请求格式错误。
  // 如果你遇到后端解析文件失败的问题，可以考虑去掉这行设置，让浏览器自动处理
  postFormData(url, data, config = {}) {
    // config.headers = config.headers || {};
    // config.headers['Content-Type'] = 'multipart/form-data';
    return service.post(url, data, config);
  }
};

export default request;
