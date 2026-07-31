const express = require('express');
const router = express.Router();
const { dbquery } = require('../db');
const requireAuth = require('../middleware/auth');
// const { upload, storage, buildImageUrl, safeDeleteFile } = require('./utils');

/* =========================================================
 * 初始化数据库表结构（幂等执行）
 * - article_comment 增加 reply_to_user_id 字段（二级回复目标用户）
 * - 创建 notification 消息通知表
 * ========================================================= */
const ensureSchema = async () => {
  try {
    try {
      await dbquery(`ALTER TABLE article_comment ADD COLUMN reply_to_user_id INT NULL`);
      console.log('[schema] article_comment.reply_to_user_id 已添加');
    } catch (e) {
      // 字段已存在，忽略
    }
    await dbquery(`
      CREATE TABLE IF NOT EXISTS notification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '接收者用户id',
        from_user_id INT COMMENT '发送者用户id',
        article_id INT COMMENT '关联文章id',
        type VARCHAR(20) NOT NULL COMMENT 'like/collect/comment',
        content VARCHAR(255) COMMENT '通知内容',
        is_read TINYINT(1) DEFAULT 0 COMMENT '0未读 1已读',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_read (user_id, is_read),
        INDEX idx_user_created (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表'
    `);
    console.log('[schema] notification 表已就绪');
  } catch (e) {
    console.error('[schema] 初始化失败:', e.message);
  }
};
ensureSchema();

/* =========================================================
 * 文章 CRUD
 * ========================================================= */

/* GET home page. */
router.get('/', async (req, res, next) => {
  const { page, pageSize, title, status = '1', category_id, user_id } = req.query;
  const searchVal = title ? `%${title}%` : null;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;
  // 一，这种不行，没有返回发布者的名字，文章列表只保存了用户的id，需要多表查询
  // const sql = `select * from articles limit ? offset ?`;

  // 二，这种也不行，这种把用户表里面的密码也返回出去了，而且密码没有加密，非常危险
  // const sql = `select * from articles left join user on articles.user_id = user.id limit ? offset ? `

  // -- ⚠️ 必须用 articles. 前缀，否则 MySQL 会优先用 user.createAt 排序（坑！）
  // 第一个left，根据文章的user_id查询用户表，返回用户的名字
  // 第二个left，根据文章的category_id查询分类表，返回分类的名字
  // where是根据自己article表自己的查询条件查数据
  const sql = `
    select 
      articles.*,
      user.username,
      user.cname,
      user.avater,
      category.name as categoryName,
      (SELECT COUNT(*) FROM article_like WHERE article_id = articles.id) AS likeCount
      from articles 
      left join user on articles.user_id = user.id    
      left join category on articles.category_id = category.id
      where 1=1
      ${user_id ? 'and articles.user_id = ?' : ''}
      ${title ? 'and articles.title LIKE ?' : ''}
      ${category_id ? 'and articles.category_id = ?' : ''}
      and articles.status = ?
      order by createdAt desc, views desc
      limit ? offset ?
  `;
  const params = [status, pageSizeNum, pageSizeNum * (pageNum - 1)];
  let totalSql = `select count(*) as total from articles where 1=1 and articles.status = ?`;
  // status:1 已发布，2草稿
  try {
    if (title) params.unshift(searchVal);
    if (category_id) params.unshift(category_id);
    if (user_id) params.unshift(user_id); // 根据用户id查询文章，我的文章
    const results = await dbquery(sql, params);

    // 查询总数的的参数
    const totalParams = [status];
    if (title) {
      totalSql += ` and title LIKE ?`;
      totalParams.push(searchVal);
    }
    if (category_id) {
      totalSql += ` and category_id = ?`;
      totalParams.push(category_id);
    }
    if (user_id) {
      totalSql += ` and articles.user_id = ?`;
      totalParams.push(user_id); // 根据用户id查询文章，我的文章
    }

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

// 创建一个文章
router.post(`/create`, requireAuth, async (req, res, next) => {
  const { title, content, user_id, status, category_id, thumb, desc } = req.body;
  // 判断只能当前登录用户才能创建文章,
  if (Number(user_id) !== req.session.user.id) {
    return res.status(403).json({ code: 403, msg: '您没有权限创建文章!!3' });
  }
  const sql = `INSERT INTO articles (title, content, user_id, status, category_id, thumb, description) VALUES (?, ?, ?, ?, ?, ?,?)`;
  try {
    const results = await dbquery(sql, [title, content, user_id, status, category_id, thumb, desc]);
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
  const { title, content, id, status, category_id, thumb, desc } = req.body;
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
    // 构建更新 SQL 语句
    const sql = `UPDATE articles SET title = ?, content = ?, status = ?, category_id = ?, thumb = ?, description = ? WHERE id = ?`;
    const results = await dbquery(sql, [title, content, status, category_id, thumb, desc, id]);
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
    return res.json({ code: 404, msg: '文章未找到' });
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

// 收藏文章
router.post(`/collect`, requireAuth, async (req, res, next) => {
  const { id, userId } = req.body;
  // 检查用户是否已收藏该文章
  const collectSql = `SELECT * FROM article_collection WHERE article_id = ? AND user_id = ?`;
  const collect = await dbquery(collectSql, [id, userId]);
  if (collect.length > 0) {
    return res.status(400).json({ code: 400, msg: '您已收藏该文章' });
  }

  const sql = `INSERT INTO article_collection (article_id, user_id) VALUES (?, ?)`;
  try {
    await dbquery(sql, [id, userId]);
    // 通知文章作者（自己收藏自己的文章不发通知）
    try {
      const articleRes = await dbquery('SELECT user_id, title FROM articles WHERE id = ?', [id]);
      if (articleRes.length > 0) {
        const authorId = articleRes[0].user_id;
        if (Number(authorId) !== Number(userId)) {
          const fromUser = await dbquery('SELECT username FROM user WHERE id = ?', [userId]);
          const fromName = fromUser[0]?.username || '有人';
          await dbquery(
            `INSERT INTO notification (user_id, from_user_id, article_id, type, content) VALUES (?, ?, ?, 'collect', ?)`,
            [authorId, userId, id, `${fromName} 收藏了你的文章《${articleRes[0].title}》`]
          );
        }
      }
    } catch (e) {
      console.error('[collect] 发送通知失败:', e.message);
    }
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 取消收藏文章
router.post(`/cancelCollect`, requireAuth, async (req, res, next) => {
  const { id, userId } = req.body;
  // 检查用户是否已收藏该文章
  const collectSql = `SELECT * FROM article_collection WHERE article_id = ? AND user_id = ?`;
  const collect = await dbquery(collectSql, [id, userId]);
  if (collect.length === 0) {
    return res.status(400).json({ code: 400, msg: '您未收藏该文章' });
  }
  const sql = `DELETE FROM article_collection WHERE article_id = ? AND user_id = ?`;
  try {
    await dbquery(sql, [id, userId]);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 点赞/喜欢文章
router.post(`/like`, requireAuth, async (req, res, next) => {
  const { id, userId } = req.body;
  // 检查用户是否已点赞/喜欢该文章
  const likeSql = `SELECT * FROM article_like WHERE article_id = ? AND user_id = ?`;
  const like = await dbquery(likeSql, [id, userId]);
  if (like.length > 0) {
    return res.status(400).json({ code: 400, msg: '您已点赞/喜欢该文章' });
  }

  const sql = `INSERT INTO article_like (article_id, user_id) VALUES (?, ?)`;
  try {
    await dbquery(sql, [id, userId]);
    // 通知文章作者（自己点赞自己的文章不发通知）
    try {
      const articleRes = await dbquery('SELECT user_id, title FROM articles WHERE id = ?', [id]);
      if (articleRes.length > 0) {
        const authorId = articleRes[0].user_id;
        if (Number(authorId) !== Number(userId)) {
          const fromUser = await dbquery('SELECT username FROM user WHERE id = ?', [userId]);
          const fromName = fromUser[0]?.username || '有人';
          await dbquery(
            `INSERT INTO notification (user_id, from_user_id, article_id, type, content) VALUES (?, ?, ?, 'like', ?)`,
            [authorId, userId, id, `${fromName} 赞了你的文章《${articleRes[0].title}》`]
          );
        }
      }
    } catch (e) {
      console.error('[like] 发送通知失败:', e.message);
    }
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 取消点赞/喜欢文章
router.post(`/cancelLike`, requireAuth, async (req, res, next) => {
  const { id, userId } = req.body;
  // 检查用户是否已点赞/喜欢该文章
  const likeSql = `SELECT * FROM article_like WHERE article_id = ? AND user_id = ?`;
  const like = await dbquery(likeSql, [id, userId]);
  if (like.length === 0) {
    return res.status(400).json({ code: 400, msg: '您未点赞/喜欢该文章' });
  }
  const sql = `DELETE FROM article_like WHERE article_id = ? AND user_id = ?`;
  try {
    await dbquery(sql, [id, userId]);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 删除浏览记录
router.post(`/deleteViewRecord`, requireAuth, async (req, res, next) => {
  const { id, userId } = req.body;
  if (!id || !userId) {
    return res.status(400).json({ code: 400, msg: '参数缺失' });
  }
  const sql = `DELETE FROM user_view_record WHERE article_id = ? AND user_id = ?`;
  try {
    await dbquery(sql, [id, userId]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    next(err);
  }
});

// 获取所有分类
router.get(`/categories`, async (req, res, next) => {
  const sql = `SELECT * FROM category`;
  try {
    const results = await dbquery(sql);
    res.json({ code: 200, data: results });
  } catch (err) {
    next(err);
  }
});

// 统计浏览量 两个功能
// 1：单纯统计文章浏览量，不管有没有登录，不管是不是同一个用户，都增加浏览量
// 2：如果用户登录时，统计该用户是否已浏览过该文章，保存到用户浏览记录表
router.get(`/view`, async (req, res, next) => {
  const { id } = req.query;
  const userId = req.session?.user?.id;
  try {
    const sql = `UPDATE articles SET views = views + 1 WHERE id = ?`;
    if (userId) {
      // 检查用户是否已浏览过该文章
      const viewSql = `SELECT * FROM user_view_record WHERE article_id = ? AND user_id = ?`;
      const view = await dbquery(viewSql, [id, userId]);
      let sql = '';
      if (view.length === 0) {
        // 没有浏览过，插入记录
        sql = `INSERT INTO user_view_record (article_id, user_id, view_count) VALUES (?, ?, 1)`;
      } else {
        // 已浏览过，更新浏览时间
        sql = `UPDATE user_view_record SET view_count = view_count + 1 WHERE article_id = ? AND user_id = ?`;
      }
      await dbquery(sql, [id, userId]);
    }
    await dbquery(sql, [id]);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 统计用户数和浏览量
router.get(`/count`, async (req, res, next) => {
  try {
    const dsql = `SELECT COUNT(*) as userCount FROM user`;
    const viewSql = `SELECT SUM(views) as viewCount FROM articles`;
    const [dresults, vresults] = await Promise.all([dbquery(dsql), dbquery(viewSql)]);
    res.json({
      code: 200,
      data: {
        userCount: dresults[0].userCount,
        viewCount: vresults[0].viewCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// 获取相似文章列表
router.get(`/similar`, async (req, res, next) => {
  const { id, category_id } = req.query;
  try {
    const sql = `
    SELECT 
      articles.*, category.name as categoryName,
      (SELECT COUNT(*) FROM article_like WHERE article_id = articles.id) AS likeCount
      FROM articles
      left join category on articles.category_id = category.id
    WHERE articles.id != ? AND articles.status = ? AND articles.category_id = ? ORDER BY articles.views DESC LIMIT 5`;
    const results = await dbquery(sql, [id, 1, category_id]);
    if (results.length === 0) {
      return res.json({ code: 200, msg: '没有相似文章' });
    }
    const resultData = results.length > 4 ? results.slice(0, 4) : results;
    res.json({ code: 200, data: resultData });
  } catch (err) {
    next(err);
  }
});

router.get(`/myCollectArticle`, requireAuth, async (req, res, next) => {
  const { page, pageSize } = req.query;
  const userId = req.session?.user?.id;
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  // 要先查文章表，然后根据文章表的分类id去查分类表，不然没有分类的id，顺序不能反
  const sql = `
    select 
      article_collection.*,
      user.username,
      articles.title,
      articles.views,
      articles.description,
      articles.thumb,
      articles.content,
      category.name as categoryName
      from article_collection 
      left join user on article_collection.user_id = user.id
      left join articles on article_collection.article_id = articles.id
      left join category on articles.category_id = category.id
      where articles.status = 1 and article_collection.user_id = ? limit ? offset ?
  `;

  const totalSql = `
    select count(*) as total from article_collection where article_collection.user_id = ?
  `;
  try {
    const totalRes = await dbquery(totalSql, [userId]);
    const results = await dbquery(sql, [userId, pageSizeNum, (pageNum - 1) * pageSizeNum]);
    if (results.length === 0) {
      return res.json({ code: 404, msg: '用户未收藏文章' });
    }
    res.json({ code: 200, msg: 'success', data: results, total: totalRes[0].total });
  } catch (err) {
    next(err);
  }
});

// 统计我的浏览记录
router.get(`/myViewArticle`, requireAuth, async (req, res, next) => {
  const { page, pageSize } = req.query;
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const userId = req.session?.user?.id;
  // 要先查文章表，然后根据文章表的分类id去查分类表，不然没有分类的id，顺序不能反
  const sql = `
    select 
      user_view_record.*,
      user.username,
      articles.title,
      articles.views,
      articles.description,
      articles.thumb,
      articles.content,
      category.name as categoryName
      from user_view_record 
      left join user on user_view_record.user_id = user.id
      left join articles on user_view_record.article_id = articles.id
      left join category on articles.category_id = category.id
      where articles.status = 1 and user_view_record.user_id = ?
      limit ? offset ?
  `;
  const totalSql = `select count(*) as total from user_view_record where user_view_record.user_id = ?`;
  try {
    const totalRes = await dbquery(totalSql, [userId]);
    console.log(totalRes);
    const results = await dbquery(sql, [userId, pageSizeNum, (pageNum - 1) * pageSizeNum]);
    // console.log(results, '获取用户浏览文章');
    if (results.length === 0) {
      return res.json({ code: 200, msg: '用户未浏览文章' });
    }
    res.json({ code: 200, msg: 'success', data: results, total: totalRes[0].total });
  } catch (err) {
    next(err);
  }
});

// 创建评论
router.post(`/createComment`, requireAuth, async (req, res, next) => {
  const { article_id, content, parent_id, reply_to_user_id, user_id } = req.body;
  if (!article_id || !content) {
    return res.status(400).json({ code: 400, msg: '文章id和内容不能为空', data: {} });
  }
  const sql = `
    insert into article_comment (article_id, content, parent_id, reply_to_user_id, user_id)
    values (?, ?, ?, ?, ?)
  `;
  try {
    const res1 = await dbquery(sql, [article_id, content, parent_id || null, reply_to_user_id || null, user_id]);
    console.log(res1, '创建评论');
    res.json({ code: 200, msg: 'success', data: {} });
  } catch (err) {
    next(err);
  }
});

// 获取文章评论列表
router.get(`/:id/comment`, async (req, res, next) => {
  const { id } = req.params;
  const userId = req.session?.user?.id;
  const { page, pageSize } = req.query;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;
  if (!id) {
    return res.status(400).json({ code: 400, msg: '文章id不能为空', data: {} });
  }
  // 查询一级评论（parent_id IS NULL）
  const sql = `
    select
      article_comment.*,
      user.username,
      user.avater,
      (select COUNT(*) from comment_like where comment_like.comment_id = article_comment.id) as likeCount,
      (select COUNT(*) from comment_like where comment_like.comment_id = article_comment.id and comment_like.user_id = ?) as isLike
      from article_comment
      left join user on article_comment.user_id = user.id
      where article_comment.article_id = ? and article_comment.parent_id IS NULL
      order by article_comment.id desc
      limit ? offset ?
  `;
  try {
    // 一级评论总数
    const totalSql = `
      select count(*) as total
      from article_comment
      where article_comment.article_id = ? and article_comment.parent_id IS NULL
    `;
    const totalResult = await dbquery(totalSql, [id]);
    const total = totalResult[0].total || 0;
    const topComments = await dbquery(sql, [userId, id, pageSizeNum, (pageNum - 1) * pageSizeNum]);
    if (topComments.length === 0) {
      return res.json({ code: 200, data: [], total: 0 });
    }
    // 查询这些一级评论下的所有子评论（parent_id 指向一级评论 id）
    const parentIds = topComments.map(c => c.id);
    const childSql = `
      select
        article_comment.*,
        user.username,
        user.avater,
        reply_user.username as reply_to_username,
        (select COUNT(*) from comment_like where comment_like.comment_id = article_comment.id) as likeCount,
        (select COUNT(*) from comment_like where comment_like.comment_id = article_comment.id and comment_like.user_id = ?) as isLike
        from article_comment
        left join user on article_comment.user_id = user.id
        left join user as reply_user on article_comment.reply_to_user_id = reply_user.id
        where article_comment.parent_id IN (?)
        order by article_comment.id asc
    `;
    const childComments = await dbquery(childSql, [userId, parentIds]);
    // 按 parent_id 分组挂到一级评论下
    const childMap = {};
    childComments.forEach(c => {
      const pid = c.parent_id;
      if (!childMap[pid]) childMap[pid] = [];
      childMap[pid].push(c);
    });
    const result = topComments.map(c => ({
      ...c,
      children: childMap[c.id] || []
    }));
    res.json({ code: 200, data: result, total });
  } catch (err) {
    next(err);
  }
});

// 给评论点赞/取消点赞
router.post(`/likeComment`, requireAuth, async (req, res, next) => {
  const { comment_id, user_id } = req.body;
  if (!comment_id) {
    return res.status(400).json({ code: 400, msg: '评论id不能为空' });
  }
  // 后端主动去判断，不能相信前端传的数据, 实际上user_id也应该从session中获取
  const hasLike = await dbquery('SELECT * FROM comment_like WHERE comment_id = ? AND user_id = ?', [
    comment_id,
    user_id
  ]);

  if (hasLike && hasLike.length > 0) {
    const sql = `
      delete from comment_like where comment_id = ? and user_id = ?
    `;
    try {
      await dbquery(sql, [comment_id, user_id]);
      res.json({ code: 200, msg: '取消点赞' });
    } catch (err) {
      next(err);
    }
    return;
  }

  const sql = `
    insert into comment_like (comment_id, user_id)
    values (?, ?)
  `;
  try {
    await dbquery(sql, [comment_id, user_id]);
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

/* =========================================================
 * 消息通知
 * ========================================================= */

// 获取通知列表
router.get(`/notifications`, requireAuth, async (req, res, next) => {
  const userId = req.session?.user?.id;
  const { page, pageSize } = req.query;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = parseInt(pageSize) || 10;
  const sql = `
    select
      notification.*,
      u.username as from_username,
      u.avater as from_avater
      from notification
      left join user u on notification.from_user_id = u.id
      where notification.user_id = ?
      order by notification.created_at desc
      limit ? offset ?
  `;
  const totalSql = `select count(*) as total from notification where user_id = ?`;
  try {
    const totalRes = await dbquery(totalSql, [userId]);
    const results = await dbquery(sql, [userId, pageSizeNum, (pageNum - 1) * pageSizeNum]);
    res.json({ code: 200, msg: 'success', data: results, total: totalRes[0].total });
  } catch (err) {
    next(err);
  }
});

// 获取未读通知数量
router.get(`/notifications/unreadCount`, requireAuth, async (req, res, next) => {
  const userId = req.session?.user?.id;
  try {
    const result = await dbquery(`SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = 0`, [
      userId
    ]);
    res.json({ code: 200, msg: 'success', data: { count: result[0].count } });
  } catch (err) {
    next(err);
  }
});

// 标记通知为已读（传 id 标记单条，不传标记全部）
router.post(`/notifications/read`, requireAuth, async (req, res, next) => {
  const userId = req.session?.user?.id;
  const { id } = req.body;
  try {
    if (id) {
      await dbquery(`UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
    } else {
      await dbquery(`UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
    }
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    next(err);
  }
});

// 获取文章详情
router.get(`/:id`, async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.query;
  // ⚠️ /:id 会贪心匹配所有子路径（/categories /list 等），先校验 id 是不是正整数
  // 不是就走 next()，让 Express 继续匹配后面注册的精确路由（categories 等）
  if (!/^\d+$/.test(id)) return next();
  const userId = req.session?.user?.id;
  const sql = `
    select distinct
      articles.*,
      article_collection.user_id as collectUserId,
      article_like.user_id as likeUserId,
      category.name as categoryName
      from articles 
      left join category 
        on articles.category_id = category.id
      left join article_collection 
        on articles.id = article_collection.article_id
        and article_collection.user_id = ?   
      left join article_like 
        on articles.id = article_like.article_id
        and article_like.user_id = ?  
      where articles.id = ? and articles.status = ?
  `;
  try {
    const results = await dbquery(sql, [userId, userId, id, status]);
    console.log(results, '获取单个文章');
    if (results.length === 0) {
      return res.status(404).json({ code: 404, msg: '文章未找到' });
    }
    res.json({ code: 200, msg: 'success', data: results[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
