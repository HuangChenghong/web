// 方法一：从环境变量读后端地址，默认本地
// const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// 方法二： craco.config.js里面使用代理，

/**
 * 把后端返回的图片路径补成完整的 URL
 * 后端存的是 /uploads/xxx.png 这种相对路径
 */
export const imgUrl = path => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // 已经是完整地址就不动
  // return `${API_BASE}${path}`; // 拼成 http://localhost:3000/uploads/xxx.png 方法一
  return path;
};

// 上线直接用nginx 配置
// # nginx.conf
// location /uploads/ {
//     alias /path/to/backend/uploads/;     # 直接读文件，零开销
//     expires 7d;                           # 浏览器缓存
//     access_log off;                       # 不记日志
// }
