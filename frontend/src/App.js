import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Detail from './pages/Detail';
import BlogList from './pages/BlogList';
import User from './pages/User';
import ArticleEditor from './pages/ArticleEditor';
import Profile from './pages/Profile';
import Drafts from './pages/Drafts';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 父路由：全局布局Home，包含Header/Footer/Content插槽Outlet */}
        <Route path='/' element={<Home />}>
          {/* index 默认页：访问 / 时渲染博客列表 */}
          <Route index element={<BlogList />} />
          {/* 子路由1：/detail/:id 详情页 */}
          <Route path='detail/:id' element={<Detail />} />
          {/* 子路由2：/用户登录页 */}
          <Route path='/register' element={<User />} />
          <Route path='/login' element={<User />} />
          {/* 子路由3：/publish 发布文章 */}
          <Route path='/publish' element={<ArticleEditor />} />
          <Route path='/publishEdit/:id' element={<ArticleEditor />} />
          <Route path='profile' element={<Profile />} />
          <Route path='drafts' element={<Drafts />} />
          <Route path='*' element={<NotFound />} />
        </Route>

        {/*【重点】* 匹配任意路径，放Routes最后，兜底404,这个包含在里面 */}
        {/* <Route path='*' element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
