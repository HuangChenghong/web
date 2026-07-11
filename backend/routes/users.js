const express = require('express');
const router = express.Router();
const { dbquery } = require('../db');

const multer = require('multer');
const path = require('path');

// 配置图片存储规则
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // 保存目录
  },
  filename: (req, file, cb) => {
    // 时间戳+后缀，避免重名覆盖图片
    const suffix = path.extname(file.originalname);
    const fileName = Date.now() + '-' + Math.random().toString(36) + suffix;
    cb(null, fileName);
  }
});

// 限制：仅图片、最大5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowImg = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowImg.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持jpg/png/webp图片'), false);
  }
});

/**
 * 登录
 * md5和crypto和base64 ，cookie和session和 JWT  TODO:
 */
router.post('/user/login', async (req, res, next) => {
  const { username, password } = req.body;
  const findUserSql = `select * from user where username = ? and password = ?`;
  try {
    const result = await dbquery(findUserSql, [username, password]);
    if (result.length > 0) {
      const user = { ...result[0] };
      delete user.password;
      res.json({
        code: 200,
        msg: '登录成功',
        data: user
      });
    } else {
      res.json({
        code: 400,
        msg: '账号或者密码错误~',
        data: {}
      });
    }
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ code: 500, msg: '登录失败', data: {} });
  }
});

/* 
  注册用户
  md5和crypto和base64 ，cookie和session和 JWT  TODO:
*/
router.post('/user/register', async (req, res, next) => {
  const { username, password, cname } = req.body;
  const findUserSql = `select * from user where username = ?`;
  const result = await dbquery(findUserSql, [username]);
  if (result.length > 0) {
    return res.json({
      code: 400,
      msg: '用户已存在',
      data: []
    });
  }
  const addUserSql = `insert into user (username, password) values (?, ?)`;
  const addResult = await dbquery(addUserSql, [username, password]);
  console.log('addresult=', addResult);
  if (addResult.affectedRows > 0) {
    res.json({
      code: 200,
      msg: '注册成功',
      data: {}
    });
  }
});

// 修改用户的信息，添加头像，增加昵称，或者邮箱
router.post('/user/update', upload.any(), async (req, res, next) => {
  try {
    const file = (req.files || []).find(f =>
      ['avatar', 'avater', 'img'].includes(f.fieldname)
    );
    const imgUrl = file ? `/uploads/${file.filename}` : null;
    const { username, cname, email } = req.body;

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
      res.json({ code: 200, msg: '更新成功', data: { avatar: imgUrl } });
    } else {
      res.json({ code: 400, msg: '用户不存在或更新失败', data: {} });
    }
  } catch (err) {
    console.error('update user error', err);
    res.status(500).json({ code: 500, msg: '更新失败', data: {} });
  }
});
module.exports = router;
