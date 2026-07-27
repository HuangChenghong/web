import './home.css';
import { imgUrl } from '@/utils/imgUrl';
import { logoOut } from '@/api/blog';
import { useUserStore } from '@/store/useUserStore';
import {
  FacebookOutlined,
  LogoutOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
const { Content } = Layout;

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const { username, cname, avater } = user || {};

  const [messageApi, contextHolder] = message.useMessage();

  const handleLogout = async () => {
    await logoOut(); // 真的告诉后端销毁 session
    logout(); // 清空 store 和 localStorage
    navigate('/');
    messageApi.success('退出登录！');
  };

  return (
    <Layout className='app-layout'>
      {contextHolder}
      <header>
        <h1 onClick={() => navigate('/')}>
          <FacebookOutlined />
          <span className='blog-title'>我的博客</span>
        </h1>

        <div className='nav'>
          {!username ? (
            <>
              <span className='nav-item' onClick={() => navigate('/login')}>
                登录
              </span>
              <span className='nav-item' onClick={() => navigate('/register')}>
                注册
              </span>
            </>
          ) : (
            <Dropdown
              trigger={['click']}
              placement='bottomRight'
              overlay={
                <Menu
                  onClick={({ key }) => {
                    if (key === 'profile') navigate('/profile');
                    if (key === 'drafts') navigate('/drafts');
                    if (key === 'logout') handleLogout();
                  }}
                  items={[
                    {
                      key: 'profile',
                      icon: <UserOutlined />,
                      label: '个人中心'
                    },
                    {
                      key: 'drafts',
                      icon: <FileTextOutlined />,
                      label: '我的草稿'
                    },
                    { type: 'divider' },
                    {
                      key: 'logout',
                      danger: true,
                      icon: <LogoutOutlined />,
                      label: '退出登录'
                    }
                  ]}
                />
              }
            >
              <span className='nav-item nav-item--user nav-item--user-dropdown'>
                <span>{cname ? cname : username}</span>
                {avater ? (
                  <Avatar size='small' src={imgUrl(avater)} />
                ) : (
                  <Avatar size='small' style={{ backgroundColor: '#8b5cf6' }}>
                    {username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                )}
              </span>
            </Dropdown>
          )}
        </div>
      </header>

      <Content style={{ padding: '0px 68px' }} className='app-content'>
        <div className='site-layout-content'>
          <Outlet />
        </div>
      </Content>

      <footer className='app-footer'>
        <span>© {new Date().getFullYear()} 我的博客 · Powered by React</span>
      </footer>
    </Layout>
  );
};

export default Home;
