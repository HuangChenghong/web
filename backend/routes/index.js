const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { dbquery } = require('../db');

// 简单密码加密（项目用，生产请用 bcrypt）
const md5 = (str = '') => crypto.createHash('md5').update(str).digest('hex');

/* =========================================================
 * 用户：注册 / 登录
 * ========================================================= */

// 注册：先确保 users 表存在
router.post('/user/register11', async (req, res, next) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  }
  try {
    // 建表（不存在才建）
    await dbquery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 重名检查
    const exists = await dbquery('SELECT id FROM users WHERE username = ?', [
      username
    ]);
    if (exists.length > 0) {
      return res.json({ code: 409, msg: '该用户名已被注册' });
    }

    // 写入
    const result = await dbquery(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, md5(password)]
    );

    res.json({
      code: 200,
      msg: '注册成功',
      data: { id: result.insertId, username }
    });
  } catch (err) {
    next(err);
  }
});

// 登录：核对用户名密码，返回简易 token
router.post('/user/login111', async (req, res, next) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.json({ code: 400, msg: '用户名和密码不能为空' });
  }
  try {
    const rows = await dbquery(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.json({ code: 404, msg: '用户不存在，请先注册' });
    }
    const user = rows[0];
    if (user.password !== md5(password)) {
      return res.json({ code: 401, msg: '密码错误' });
    }
    // 简易 token：base64(username + 时间戳)，够学习用
    const token = Buffer.from(
      `${user.id}:${user.username}:${Date.now()}`
    ).toString('base64');

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        userId: user.id,
        username: user.username
      }
    });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
 * 文章 CRUD
 * ========================================================= */

/* GET home page. */
router.get('/blogs/blog', async (req, res, next) => {
  const { page, pageSize, title, status } = req.query;
  const searchVal = `%${title}%`;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;
  // 一，这种不行，没有返回发布者的名字，文章列表只保存了用户的id，需要多表查询
  // const sql = `select * from articles limit ? offset ?`;

  // 二，这种也不行，这种把用户表里面的密码也返回出去了，而且密码没有加密，非常危险
  // const sql = `select * from articles left join user on articles.user_id = user.id limit ? offset ? `

  // -- ⚠️ 必须用 articles. 前缀，否则 MySQL 会优先用 user.createAt 排序（坑！）
  const sql = `
    select 
      articles.*,
      user.username,
      user.cname,
      user.avater
      from articles left 
      join user on articles.user_id = user.id   
      where 1=1
      ${title ? 'and articles.title LIKE ?' : ''}
      and articles.status = ?
      order by createdAt desc, id desc
      limit ? offset ?
  `;
  const params = [status, pageSizeNum, pageSizeNum * (pageNum - 1)];
  let totalSql = `select count(*) as total from articles where 1=1 and articles.status = ?`;
  // status:1 已发布，2草稿
  try {
    if (title) params.unshift(searchVal);
    const results = await dbquery(sql, params);

    if (title) totalSql += ` and title LIKE ?`;
    const totalParams = title ? [1, searchVal] : [1];
    const totalResults = await dbquery(totalSql, totalParams);
    res.json({
      code: 200,
      msg: 'success',
      data: results,
      total: totalResults[0].total
    });
  } catch (err) {
    next(err);
  }
});

// 获取单个文章
router.get(`/blogs/blog/:id`, async (req, res, next) => {
  const { id } = req.params;
  const sql = `SELECT * FROM articles WHERE id = ?`;
  try {
    const results = await dbquery(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ code: 404, msg: '文章未找到' });
    }
    res.json({ code: 200, msg: 'success', data: results[0] });
  } catch (err) {
    next(err);
  }
});

// 创建一个文章
router.post(`/blogs/blog/create`, async (req, res, next) => {
  const { title, content, user_id, status } = req.body;
  const sql = `INSERT INTO articles (title, content, user_id, status) VALUES (?, ?, ?,?)`;
  try {
    const results = await dbquery(sql, [title, content, user_id, status]);
    console.log(results, '创建一个文章');
    res.json({
      code: 200,
      msg: '文章创建成功',
      data: { id: results.insertId }
    });
  } catch (err) {
    next(err);
  }
});

/* 修改文章  TODO: 要判断作者才能删除自己的文章*/
router.post(`/blogs/blog/update`, async (req, res, next) => {
  const { title, content, user_id, status } = req.body;
  console.log(title, content, user_id, '用户数据');
  const sql = `UPDATE articles SET title = ?, content = ?, status = ? WHERE id = ?`;
  try {
    const results = await dbquery(sql, [title, content, status, user_id]);
    console.log(results);
    res.json({ code: 200, msg: 'success', data: results });
  } catch (err) {
    next(err);
  }
});

/* 删除文章  TODO: 要判断坐着才能删除自己的文章*/
router.post(`/blogs/blog/delete`, async (req, res, next) => {
  const { id } = req.body;
  console.log(
    'id/*/*/*/*/*:',
    id,
    'req.body:',
    req.body,
    'req.query:',
    req.query
  );
  const sql = `DELETE FROM articles WHERE id = ?`;
  try {
    const results = await dbquery(sql, [id]);
    console.log(results);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
