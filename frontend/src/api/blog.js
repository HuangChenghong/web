import request from './request';

// 获取博客列表 GET
export function getBlogList(params) {
  return request.get('/blogs', params);
}

// 获取博客详情（动态id）
export function getBlogDetail(id) {
  return request.get(`/blogs/${id}`);
}

// 新增博客 POST
export function addBlog(data) {
  return request.post('/blogs/create', data);
}

// 修改博客
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
