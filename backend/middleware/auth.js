const requireAuth = (req, res, next) => {
  // 未登录才拦截（注意是 !）
  if (!req.session?.user) {
    return res.status(401).json({ code: 401, msg: '未登录' });
  }
  next();
};

// 直接导出函数本身，不要包成对象
module.exports = requireAuth;