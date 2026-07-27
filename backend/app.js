var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const session = require('express-session');
const RedisStore = require('connect-redis')(session); // v6 工厂调用：返回 constructor
// const { createClient } = require('redis');
// redis@3 用顶层 createClient，不要解构
const redis = require('redis');

var app = express();

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', err => {
  // 不监听会让进程崩溃，这就是你刚才看到的 throw
  console.error('[redis] error:', err.message);
});
redisClient.on('connect', () => console.log('[redis] connected'));
redisClient.on('reconnecting', () => console.warn('[redis] reconnecting...'));

// 1. 起 redis 客户端（redis@3 自动连接，不需要 .connect()，那是 redis@4 的方法）
// const redisClient = createClient({
//   // url: `redis://:${process.env.REDIS_PASSWORD}@redis:6379`   // docker 内用服务名
//   url: 'redis://127.0.0.1:6379' //本地直连:
// });

// 2. 装 session 中间件
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
    secret: process.env.JWT_SECRET || 'dev-secret-change-me', // 复用你已有的密钥
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // 防 XSS 偷
      secure: false, // 生产 https 时改 true
      sameSite: 'lax', // 防 CSRF 的轻量方案
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 天
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
