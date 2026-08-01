const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { dbquery } = require('../db');
const svgCaptcha = require('svg-captcha'); //验证码

const redisClient = require('../redis');

const requireAuth = require('../middleware/auth');

// 接口限流，防止被攻击
const { loginLimiter, captchaLimiter } = require('../middleware/limit');

// 图片上传相关方法（从 utils.js 引入）
const { upload, buildImageUrl, safeDeleteFile } = require('./utils');

// 加密
const hashPwd = async pwd => {
  return await bcrypt.hash(pwd, 10);
};

// 解密
const verifyPwd = async (raw, hash) => {
  return await bcrypt.compare(raw, hash);
};

// 登录图形获取验证码
// 1. 获取图形验证码接口 GET /captcha
// 返回svg图片 + 唯一验证码ID，前端携带id登录
router.get('/captcha', captchaLimiter, async (req, res) => {
  // 生成验证码：4位字符，配置干扰线、噪点
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    fontSize: 50, // 字体大小
    width: 100, // 图片宽度
    height: 40, // 图片高度
    noise: 3, // 噪点数量
    color: true, // 是否需要背景颜色
    background: '#cc9966',
    ignoreChars: '0o1il' //剔除容易混淆字符
  });
  // 唯一标识，用来redis存取
  const captchaId = Date.now() + '' + Math.random().toString(36).slice(2);
  // 将验证码保存到redis中，并设置过期时间
  await redisClient.set(captchaId, captcha.text, { EX: 60 * 2 });
  //   // 响应头返回id，body返回svg图片,这种不行，前端拿不到captchaId，可以通过cookie拿到
  // res.set({
  //   'Content-Type': 'image/svg+xml', //设置响应头
  //   'X-Captcha-Id': captchaId // 返回给前端的标识
  // });
  // res.send(captcha.data);
  // ------------------------------------------------------
  res.json({
    code: 200,
    data: {
      captchaId,
      captchaImg: captcha.data
    }
  });
});

/**
 * 登录
 * md5和crypto和base64 ，cookie和session和 JWT  TODO:
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  const { username, password, code, captchaId } = req.body;
  // 基础判空
  if (!username || !password || !code || !captchaId) {
    return res.json({ code: 400, msg: '账号、密码、验证码不能为空' });
  }

  // 从redis中获取验证码（set 时用的 key 就是 captchaId，不要再加前缀）
  const realCode = await redisClient.get(captchaId);
  // 用完立刻删除，防止重复使用验证码（key 必须和 set 时一致！）
  await redisClient.del(captchaId);
  if (!realCode) {
    return res.json({ code: 400, msg: '验证码过期，请刷新重试' });
  }

  // 统一小写对比，忽略大小写
  if (String(realCode).toLowerCase() !== String(code).toLowerCase()) {
    return res.json({ code: 400, msg: '验证码错误' });
  }

  const findUserSql = `select * from user where username = ?`;
  try {
    const result = await dbquery(findUserSql, [username]);
    console.log('获取的用户', result.length, result.length === 0);
    if (result.length === 0) {
      return res.json({ code: 400, msg: '用户名不存在', data: {} });
    }
    const user = result[0];
    const isCorrect = await verifyPwd(password, user.password);
    if (!isCorrect) {
      return res.json({ code: 400, msg: '账号或者密码错误~', data: {} });
    }

    // ③ 永远别把 password 字段返回给前端
    delete user.password;
    // 将生成的sessionid返回给前端 里面自动给我们执行了res.setCookie = 'username'
    req.session.user = {
      id: user.id, // ✅ 顺手存 id（之前只存了 username，下游用不上）
      username
    };
    // ✅ 记录登录时间，用于强制重新登录（绝对上限）
    req.session.loginAt = Date.now();
    res.json({ code: 200, msg: '登录成功', data: user });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ code: 500, msg: '登录失败', data: {} });
  }
});

/* 
  注册用户
  md5和crypto和base64 ，cookie和session和 JWT  TODO:
*/
router.post('/register', loginLimiter, async (req, res, next) => {
  const { username, password } = req.body;
  const findUserSql = `select * from user where username = ?`;
  try {
    const result = await dbquery(findUserSql, [username]);
    if (result.length > 0) {
      return res.json({ code: 400, msg: '用户已存在', data: [] });
    }
    // bcrypt密码加密不需要密钥，他的初衷就是不可逆 只做密码比对校验，不解密
    const pwd = await hashPwd(password);
    const addUserSql = `insert into user (username, password) values (?, ?)`;
    const addResult = await dbquery(addUserSql, [username, pwd]);
    if (addResult.affectedRows > 0) {
      return res.json({ code: 200, msg: '注册成功', data: {} });
    }
    return res.json({ code: 500, msg: '注册失败', data: {} });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ code: 500, msg: '注册失败', data: {} });
  }
});

// /api/upload/image 富文本上传图片
router.post('/upload/image', requireAuth, upload.any(), async (req, res, next) => {
  try {
    // ⚠️ upload.any() 把文件放在 req.files（复数），不是 req.file
    const file = req.files[0];
    if (!file) {
      return res.json({
        code: 400,
        msg: '请上传图片',
        data: {}
      });
    }
    // 上传成功后，返回图片 URL
    // ⚠️ multer 存储时按日期创建了子目录（如 uploads/2026-07-30/xxx.png）
    // file.path 是完整路径（如 uploads/2026-07-30/xxx.png），需要转成 URL 格式
    const url = `/${file.path.replace(/\\/g, '/')}`;
    res.json({
      code: 200,
      data: { url }
    });
  } catch (err) {
    console.error('upload/image error', err);
    res.status(500).json({ code: 500, msg: '上传图片失败', data: {} });
  }
});

// 修改用户的信息，添加头像，增加昵称，或者邮箱
router.post('/update', requireAuth, upload.any(), async (req, res, next) => {
  try {
    const file = (req.files || []).find(f => ['avatar', 'avater', 'img'].includes(f.fieldname));
    // 复用 utils 中的 buildImageUrl 计算 URL
    const imgUrl = buildImageUrl(file);
    const { username, cname, email } = req.body;

    // 更新头像的时候，要删除旧的头像，以免头像堆积的越来越多： 以后研究下使用oss阿里云上传头像的方法TODO:
    let oldAvater = null;
    if (imgUrl && username) {
      const old = await dbquery(`select avater from user where username = ?`, [username]);
      oldAvater = old[0]?.avater;
    }

    if (!username) {
      return res.status(400).json({ code: 400, msg: '用户名不能为空', data: {} });
    }

    const fields = [];
    const params = [];
    if (cname) {
      fields.push('cname = ?');
      params.push(cname);
    }
    if (email) {
      fields.push('email = ?');
      params.push(email);
    }
    if (imgUrl) {
      fields.push('avater = ?');
      params.push(imgUrl);
    }

    if (fields.length === 0) {
      return res.json({ code: 400, msg: '没有可更新的内容', data: {} });
    }

    const updateSql = `update user set ${fields.join(', ')} where username = ?`;
    params.push(username);
    const result = await dbquery(updateSql, params);

    if (result.affectedRows > 0) {
      const user = await dbquery(`select * from user where username = ?`, [username]);
      const userInfo = user[0];
      delete userInfo.password;
      res.json({ code: 200, msg: '更新成功', data: userInfo });

      // 更新成功后删除旧的头像（复用 safeDeleteFile 做安全检查）
      // TODO: 尝试下使用oss；解决报错；前端个人中心代码报错； fastapi写下管理的后端
      if (imgUrl && oldAvater && oldAvater !== imgUrl) {
        safeDeleteFile(oldAvater);
      }
    } else {
      res.json({ code: 400, msg: '用户不存在或更新失败', data: {} });
    }
  } catch (err) {
    console.error('update user error', err);
    res.status(500).json({ code: 500, msg: '更新失败', data: {} });
  }
});

// 4. 退出登录：删 redis session + 清浏览器 cookie（两边都得清）
router.post('/logout', requireAuth, (req, res) => {
  // 走到这里说明 requireAuth 已通过，req.user 一定有
  console.log(`[logout] user ${req.user.username} 退出`);

  req.session.destroy(err => {
    if (err) {
      console.error('[logout] session destroy error:', err);
      // ✅ 防御性清 cookie：即使 Redis 删失败，也把浏览器侧 cookie 清掉
      // 否则前端状态和服务端状态会不一致，下一次刷新又"复活"
      res.clearCookie('connect.sid');
      return res.status(500).json({
        code: 500,
        msg: '退出失败，请重试',
        data: null
      });
    }
    res.clearCookie('connect.sid'); // ← 关键：让浏览器删 cookie
    res.json({ code: 200, msg: '已退出', data: null });
  });
});

// 5. 获取用户信息接口
router.get('/userInfo', requireAuth, async (req, res) => {
  const { userId } = req.query;
  const userInfoSql = `select * from user where id = ?`;
  try {
    const result = await dbquery(userInfoSql, [userId]);
    if (result.length > 0) {
      delete result[0].password;
      return res.json({ code: 200, msg: '用户信息获取成功', data: result[0] });
    }
    return res.json({ code: 400, msg: '用户不存在', data: {} });
  } catch (err) {
    console.error('userInfo error', err);
    res.status(500).json({ code: 500, msg: '用户信息获取失败', data: {} });
  }
});

// 假设以后你会加这个接口：删除用户，而不是直接从navicat中删除
router.post('/delete', requireAuth, async (req, res, next) => {
  const { username } = req.body;
  try {
    const [user] = await dbquery('SELECT avater FROM user WHERE username = ?', [username]);
    if (user?.avater) {
      safeDeleteFile(user.avater);
    }
    await dbquery('DELETE FROM user WHERE username = ?', [username]);
    res.json({ code: 200, msg: '用户已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, msg: '删除失败' });
  }
});
module.exports = router;
