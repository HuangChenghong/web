// 限制同一个 IP 在指定时间内的请求次数，防刷接口、暴力破解登录、高频请求打垮服务，常用于登录、验证码、注册等高危接口
const rateLimit = require('express-rate-limit');

// 1. 验证码专用限流：1分钟最多5次，防刷验证码
const captchaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 限流时间窗口，单位毫秒 5分钟
  max: 10, // 1 minute最多5次  窗口内最大允许请求数；支持函数动态返回次数
  message: { code: 429, msg: '验证码获取太频繁，1分钟最多5次' }, // 超限返回内容，支持字符串 / JSON
  standardHeaders: true, //
  legacyHeaders: false //
  // skip: req => {
  //   //函数，返回 true 则跳过限流（内网 IP、管理员放行）
  //   // 本地、内网放行
  //   const ip = req.ip;
  //   return ip === '127.0.0.1' || ip.startsWith('192.168.');
  // }
  // keyGenerator: (req) => {
  //   // 已登录用userId限流，未登录用IP  自定义限流依据，默认用客户端 IP
  //   return req.user?.id || req.ip
  // }
});

// 2. 登录接口限流：5分钟最多10次，防密码暴力破解
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 30,
  message: { code: 429, msg: '登录请求频繁，请5分钟后重试' }
});

// 生产环境问题：Nginx 反向代理后 IP 获取错误
// 部署时经过 Nginx，req.ip 拿到的是 nginx 内网 IP，限流全部命中同一个 IP，需要两步修复
// 1.Express 开启信任代理 放在最顶部
// app.set('trust proxy', true)
// 2.nginx 配置
// proxy_set_header X-Forwarded-For $remote_addr;

module.exports = {
  loginLimiter,
  captchaLimiter
};
