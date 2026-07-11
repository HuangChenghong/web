import request from './request';

// 获取博客列表 GET
export function getBlogList(params) {
  return request.get('/blogs/blog', params);
}

// 获取博客详情（动态id）
export function getBlogDetail(id) {
  return request.get(`/blogs/blog/${id}`);
}

// 新增博客 POST
export function addBlog(data) {
  return request.post('/blogs/blog/create', data);
}

// 修改博客
export function editBlog(data) {
  return request.post('/blogs/blog/update', data);
}

// 删除博客
export function delBlog(data) {
  return request.post('/blogs/blog/delete', data);
}

// 登录接口
export function loginApi(data) {
  return request.post('/users/user/login', data);
}

// 注册接口
export function registerApi(data) {
  return request.post('/users/user/register', data);
}

// 更新用户
export function updateUser(data) {
  return request.post('/users/user/update', data);
}
