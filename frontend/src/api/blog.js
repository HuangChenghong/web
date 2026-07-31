import request from './request';

// 获取博客列表 GET
export function getBlogList(params) {
  return request.get('/blogs', params);
}

// 获取博客详情（动态id）
export function getBlogDetail(id, params) {
  return request.get(`/blogs/${id}`, params);
}

// 新增博客 POST
export function addBlog(data) {
  return request.post('/blogs/create', data);
}

// 修改博客 POST
export function editBlog(data) {
  return request.post('/blogs/update', data);
}

// 删除博客
export function delBlog(data) {
  return request.post('/blogs/delete', data);
}

// 登录接口
export function loginApi(data) {
  return request.post('/users/login', data);
}

// 注册接口
export function registerApi(data) {
  return request.post('/users/register', data);
}

// 退出登录
export function logoOut(data) {
  return request.post('/users/logout', data);
}

// 更新用户
export function updateUser(data) {
  return request.post('/users/update', data);
}

// 获取用户信息
export function getUserInfo(params) {
  return request.get('/users/userInfo', params);
}

export function collectBlog(data) {
  return request.post('/blogs/collect', data);
}

export function cancelCollect(data) {
  return request.post('/blogs/cancelCollect', data);
}
export function likeBlog(data) {
  return request.post('/blogs/like', data);
}

export function cancelLike(data) {
  return request.post('/blogs/cancelLike', data);
}

export function captcha(data) {
  return request.get('/users/captcha', data);
}

export function getCategories(params) {
  return request.get('/blogs/categories', params);
}

export function getViewNum(params) {
  return request.get('/blogs/view', params);
}

export function getCount(params) {
  return request.get('/blogs/count', params);
}

export function getSimilarBlogs(params) {
  return request.get('/blogs/similar', params);
}

export function getMyCollectArticle(params) {
  return request.get('/blogs/myCollectArticle', params);
}

export function getMyViewArticle(params) {
  return request.get('/blogs/myViewArticle', params);
}

// 删除浏览记录
export function deleteViewRecord(data) {
  return request.post('/blogs/deleteViewRecord', data);
}

// 新增评论
export function createComment(data) {
  return request.post('/blogs/createComment', data);
}

// 获取文章评论列表
export function getCommentList(id, params) {
  return request.get(`/blogs/${id}/comment`, params);
}

// 给评论点赞
export function likeComment(data) {
  return request.post('/blogs/likeComment', data);
}

// 获取通知列表
export function getNotifications(params) {
  return request.get('/blogs/notifications', params);
}

// 获取未读通知数量
export function getUnreadCount(params) {
  return request.get('/blogs/notifications/unreadCount', params);
}

// 标记通知为已读
export function markNotificationsRead(data) {
  return request.post('/blogs/notifications/read', data);
}
