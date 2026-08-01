import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';

/**
 * 路由守卫：未登录直接踢到 /login，并记住原路径，登录后可跳回
 *
 * 用法（在 App.js 的 Routes 里）：
 *   <Route element={<RequireAuth />}>
 *     <Route path='profile' element={<Profile />} />
 *     <Route path='drafts' element={<Drafts />} />
 *     ...
 *   </Route>
 *
 * ⚠️ 必须用 <Outlet /> 而不是 children，因为这是路由包装用法，
 *    子路由是通过 Outlet 占位渲染的，children prop 在这种情况下是 undefined。
 *
 * 原理：zustand 在 store 创建时会从 localStorage 读 userInfo 初始化，
 *       用户登录后 user 一定有值；清掉 localStorage 后 user=null。
 *       如果仅 cookie 过期但 localStorage 还有 user（少见），仍会放行，
 *       真正需要鉴权的 API 调用会被 request.js 拦截器兜底处理。
 */
const RequireAuth = () => {
  const user = useUserStore(state => state.user);
  const location = useLocation();

  if (!user) {
    // replace 不会留历史记录，避免按返回又回到被拦截页
    console.log('location.pathname---------', location.pathname);
    return <Navigate to='/login' state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
