const express = require('express');
const router = express.Router();
const { dbquery } = require('../db');
const { requireAuth } = require('../middleware/auth');

/* =========================================================
 * 文章 CRUD
 * ========================================================= */

/* GET home page. */
router.get('/', async (req, res, next) => {
  const { page, pageSize, title, status = '1' } = req.query;
  const searchVal = title ? `%${title}%` : null;
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
router.get(`/:id`, async (req, res, next) => {
  const { id } = req.params;
  const sql = `SELECT * FROM articles WHERE id = ? AND status=1`;
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
router.post(`/create`, requireAuth, async (req, res, next) => {
  const { title, content, user_id, status } = req.body;
  // 判断只能当前登录用户才能创建文章
  if (user_id !== req.user.id) {
    return res.status(403).json({ code: 403, msg: '您没有权限创建文章' });
  }
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

/* 修改文章  TODO: 要判断作者才能修改自己的文章*/
router.post(`/update`, requireAuth, async (req, res, next) => {
  const { title, content, id, status } = req.body;
  try {
    // 检查文章是否存在
    const searchSql = `SELECT * FROM articles WHERE id = ?`;
    const article = await dbquery(searchSql, [id]);
    if (article.length === 0) {
      return res.status(404).json({ code: 404, msg: '文章未找到' });
    }
    // 检查作者是否匹配
    if (article[0].user_id !== req.user.id) {
      return res.status(403).json({ code: 403, msg: '您没有权限修改该文章' });
    }
    const sql = `UPDATE articles SET title = ?, content = ?, status = ? WHERE id = ?`;
    const results = await dbquery(sql, [title, content, status, id]);
    console.log(results);
    res.json({ code: 200, msg: 'success', data: results });
  } catch (err) {
    next(err);
  }
});

/* 删除文章  TODO: 要判断作者才能删除自己的文章*/
router.post(`/delete`, requireAuth, async (req, res, next) => {
  const { id } = req.body;
  // 检查文章是否存在
  const searchSql = `SELECT * FROM articles WHERE id = ?`;
  const article = await dbquery(searchSql, [id]);
  if (article.length === 0) {
    return res.status(404).json({ code: 404, msg: '文章未找到' });
  }
  // 检查作者是否匹配
  if (article[0].user_id !== req.user.id) {
    return res.status(403).json({ code: 403, msg: '您没有权限删除该文章' });
  }
  const sql = `DELETE FROM articles WHERE id = ?`;
  try {
    await dbquery(sql, [id]);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
