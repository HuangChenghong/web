/**
 * 鉴权中间件
 *
 * 用法：
 *   const requireAuth = require('../middleware/auth');
 *   router.post('/xxx', requireAuth, handler);
 *
 * 双重过期策略（平衡安全与体验）：
 *   1. 滑动续期（touch）—— 活跃用户不被踢下线（受 cookie.maxAge 限制，见 app.js）
 *   2. 绝对上限（ABSOLUTE_MAX_AGE）—— 即使一直活跃，30 天后也强制重新登录
 *
 * 同时还导出了一个 optionalAuth：已登录挂 req.user，未登录也放行
 * 用于"登录态显示额外信息"的场景（如 /blogs 列表里能看自己是否点赞过）
 */

// 绝对最长登录时间：30 天。超过这个时间，无论活跃与否都必须重新登录
const ABSOLUTE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

// 强制鉴权：未登录直接 401
const requireAuth = (req, res, next) => {
  try {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({
        code: 401,
        msg: '未登录或登录已过期',
        data: null
      });
    }

    // ✅ 绝对上限校验：超过 30 天强制重新登录
    // 不光是"滑动续期"——这样即使 cookie 一直被续，session 太老了也得清
    const loginAt = req.session.loginAt || 0;
    if (Date.now() - loginAt > ABSOLUTE_MAX_AGE) {
      // 销毁 session，让前端跳登录
      return req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(401).json({
          code: 401,
          msg: '登录时间过长，请重新登录',
          data: null
        });
      });
    }

    // ✅ 关键改进 1：把用户信息挂到 req.user
    // 之前每个路由都得写 req.session.user?.username，容易拼错且冗余
    req.user = user;

    // ✅ 关键改进 2：滑动续期
    // 不调用的话，session 在 maxAge 后会硬过期；活跃用户会被突然踢下线
    // touch() 刷新的是 Redis 侧 TTL（cookie 过期由 app.js 的 cookie.maxAge 控制）
    if (typeof req.session.touch === 'function') {
      req.session.touch();
    }

    next();
  } catch (err) {
    next(err);
  }
};

// 可选鉴权：已登录挂 req.user，没登录也放行（绝不报错）
const optionalAuth = (req, res, next) => {
  try {
    if (req.session?.user) {
      req.user = req.session.user;
    }
    next();
  } catch (err) {
    next(err);
  }
};

// 默认导出函数本体，保持现有 `const requireAuth = require('../middleware/auth')` 兼容
module.exports = requireAuth;
// 同时支持解构：`const { requireAuth, optionalAuth } = require('../middleware/auth')`
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;
