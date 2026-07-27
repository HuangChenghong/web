const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { dbquery } = require('../db');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const requireAuth = require('../middleware/auth');

// 配置图片存储规则
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const dayDir = date.toLocaleDateString().replace(/[\\/]/g, '-');
    const fullPath = path.join('./uploads', dayDir);
    console.log('fullPath=', fullPath);
    // 不存在目录就递归创建,recursive: true：哪怕没有uploads文件夹，也会自动创建
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath); // 保存目录
  },
  filename: (req, file, cb) => {
    // 时间戳+后缀，避免重名覆盖图片
    const suffix = path.extname(file.originalname); //截取文件后缀
    const fileName = Date.now() + '-' + Math.random().toString(36) + suffix;
    cb(null, fileName);
  }
});

// 限制：仅图片、最大5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // 在 multer 配置里加 `fileFilter` 过滤非法文件，只允许上传图片格式
    const allowImg = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowImg.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持jpg/png/webp图片'), false);
  }
});

// 加密
const hashPwd = async pwd => {
  return await bcrypt.hash(pwd, 10);
};

// 解密
const verifyPwd = async (raw, hash) => {
  return await bcrypt.compare(raw, hash);
};

/**
 * 登录
 * md5和crypto和base64 ，cookie和session和 JWT  TODO:
 */
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;
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
router.post('/register', async (req, res, next) => {
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

// 修改用户的信息，添加头像，增加昵称，或者邮箱
router.post('/update', requireAuth, upload.any(), async (req, res, next) => {
  console.log('upadteeeee');
  try {
    const file = (req.files || []).find(f =>
      ['avatar', 'avater', 'img'].includes(f.fieldname)
    );
    // const imgPath = file ? path.join('./uploads', file.filename) : null;
    // console.log('imgPath=', imgPath, file.filename);
    // const imgUrl = imgPath;
    let imgUrl = null;
    if (file) {
      // 和 multer 配置中一样计算日期目录
      const date = new Date();
      const dayDir = date.toLocaleDateString().replace(/[\\/]/g, '-');
      // 使用 /uploads 开头的 URL 格式，前端才能正确加载
      imgUrl = `/uploads/${dayDir}/${file.filename}`;
    }
    console.log('imgUrl=', imgUrl);
    const { username, cname, email } = req.body;

    // 更新头像的时候，要删除旧的头像，以免头像堆积的越来越多： 以后研究下使用oss阿里云上传头像的方法TODO:
    let oldAvater = null;
    if (imgUrl && username) {
      const old = await dbquery(`select avater from user where username = ?`, [
        username
      ]);
      oldAvater = old[0]?.avater;
    }

    if (!username) {
      return res
        .status(400)
        .json({ code: 400, msg: '用户名不能为空', data: {} });
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
      const user = await dbquery(`select * from user where username = ?`, [
        username
      ]);
      const userInfo = user[0];
      delete userInfo.password;
      res.json({ code: 200, msg: '更新成功', data: userInfo });

      // 更新成功后删除旧的头像
      // TODO:保存时，我希望能够按照日期建文件夹；尝试下使用oss；解决报错；前端个人中心代码报错； fastapi写下管理的后端
      console.log('imgUrl=', imgUrl);
      console.log('oldAvater=', oldAvater);

      if (imgUrl && oldAvater && oldAvater !== imgUrl) {
        // oldAvater 格式: /uploads/2026-07-27/xxx.png
        // split('/').slice(1) → ['uploads', '2026-07-27', 'xxx.png']
        // 当前目录是（__dirname）routes，需要离开routes目录(cd ..)，上一级目录uploads/2026-07-27/xxx.png
        const oldFilePath = path.join(
          __dirname,
          '..',
          ...oldAvater.split('/').slice(1)
        );
        console.log('oldFilePath=', oldFilePath);
        // 安全检查：必须在 uploads/ 目录下
        const uploadsDir = path.join(__dirname, '..', 'uploads') + path.sep;
        console.log('uploadsDir=', uploadsDir);
        // 安全检查：必须在 uploads/ 目录下（防路径遍历攻击）
        // 注意： uploadsDir 的安全检查逻辑也错了——它应该检查是否在根 uploads/ 目录下，而不是在某个日期子目录下
        if (oldFilePath.startsWith(uploadsDir)) {
          fs.unlink(oldFilePath, err => {
            if (err) {
              console.warn('[avatar] 旧头像删除失败:', oldAvater, err.message);
            }
          });
        }
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
    const [user] = await dbquery('SELECT avater FROM user WHERE username = ?', [
      username
    ]);
    if (user?.avater) {
      const filePath = path.join(__dirname, '..', user.avater);
      const uploadsDir = path.join(__dirname, '..', 'uploads') + path.sep;
      if (filePath.startsWith(uploadsDir)) {
        await fs.unlink(filePath).catch(() => {});
      }
    }
    await dbquery('DELETE FROM user WHERE username = ?', [username]);
    res.json({ code: 200, msg: '用户已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, msg: '删除失败' });
  }
});
module.exports = router;
