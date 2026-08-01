require('dotenv').config(); // 第一行，别的都别放它前面
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// 滑块验证码：替换 svg-captcha 为aj-captcha-node，实现滑动拼图
// const svgCaptcha = require('svg-captcha'); //验证码
const session = require('express-session');
const RedisStore = require('connect-redis').default; // v7 直接导出 class
const redisClient = require('./redis');

// 限制同一个 IP 在指定时间内的请求次数，防刷接口、暴力破解登录、高频请求打垮服务，常用于登录、验证码、注册等高危接口
// const rateLimit = require('express-rate-limit');

const app = express();

// 2. 装 session 中间件, 所有请求来都会经过这个中间件
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: 'sess:' }), //session 存在 Redis，sessionId 只是索引
    secret: process.env.SESSION_SECRET_SECRET, // 复用你已有的密钥
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // 防 XSS 偷
      secure: false, // 生产 https 时改 true
      sameSite: 'lax', // 防 CSRF 的轻量方案
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 天
      // maxAge: 1000 * 5 // 测试用，5 秒测试用
    }
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ← 新增

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/blogs', indexRouter);
app.use('/api/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// 启动时清理一次（异步执行，不阻塞启动）
// require('./scripts/clean-orphans');

// error handler
app.use(function (err, req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      code: err.status || 500,
      msg: err.message || '服务器错误'
    });
  }
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500).render('error');
});

module.exports = app;
