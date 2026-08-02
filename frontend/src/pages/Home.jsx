import './home.css';
import { useEffect, useState } from 'react';
import { imgUrl } from '@/utils/imgUrl';
import { formatDate } from '@/utils/common';
import { logoOut, getNotifications, getUnreadCount, markNotificationsRead } from '@/api/blog';
import { useUserStore } from '@/store/useUserStore';
import { useThemeStore, themes } from '@/store/useThemeStore';
import {
  FacebookOutlined,
  LogoutOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  BookFilled,
  SkinOutlined,
  BellOutlined,
  HeartOutlined,
  BookOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Layout, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
const { Content } = Layout;

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const { username, cname, avater } = user || {};
  const { currentTheme, setTheme } = useThemeStore();

  const [messageApi, contextHolder] = message.useMessage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 拉取未读通知数
  const fetchUnreadCount = async () => {
    if (!username) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch (e) {
      console.error('获取未读通知数失败:', e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // 每 60 秒轮询一次未读数
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // 打开通知面板：拉取列表 + 标记已读
  const handleNotifOpenChange = async open => {
    if (!open) return;
    try {
      const res = await getNotifications({ page: 1, pageSize: 20 });
      setNotifications(res.data || []);
      if (unreadCount > 0) {
        await markNotificationsRead({});
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('获取通知列表失败:', e);
    }
  };

  // 通知类型图标
  const notifIcon = type => {
    if (type === 'like') return <HeartOutlined style={{ color: '#ef4444' }} />;
    if (type === 'collect') return <BookOutlined style={{ color: '#f59e0b' }} />;
    return <BellOutlined style={{ color: '#3b82f6' }} />;
  };

  // 通知面板
  const notifPanel = (
    <div className='notif-panel'>
      <div className='notif-panel__header'>
        <span>消息通知</span>
        {notifications.length > 0 && <span className='notif-panel__count'>{notifications.length} 条</span>}
      </div>
      <div className='notif-panel__list'>
        {notifications.length === 0 ? (
          <div className='notif-panel__empty'>暂无消息通知~</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notif-panel__item ${n.is_read ? '' : 'notif-panel__item--unread'}`}
              onClick={() => n.article_id && navigate(`/detail/${n.article_id}`)}
            >
              <div className='notif-panel__item-icon'>{notifIcon(n.type)}</div>
              <div className='notif-panel__item-body'>
                <p className='notif-panel__item-text'>{n.content}</p>
                <span className='notif-panel__item-time'>{formatDate(n.created_at)}</span>
              </div>
              {!n.is_read && <span className='notif-panel__item-dot' />}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const handleLogout = async () => {
    await logoOut(); // 真的告诉后端销毁 session
    logout(); // 清空 store 和 localStorage
    navigate('/');
    messageApi.success('退出登录！');
  };

  return (
    <Layout className='app-layout'>
      {contextHolder}
      <header style={{ zIndex: '99' }}>
        <h1 onClick={() => navigate('/')}>
          <FacebookOutlined />
          <span className='blog-title'>我的博客</span>
        </h1>

        <div className='nav'>
          {/* 主题切换 */}
          <Dropdown
            trigger={['click']}
            placement='bottomRight'
            menu={{
              onClick: ({ key }) => setTheme(key),
              items: Object.entries(themes).map(([key, theme]) => ({
                key,
                label: theme.name,
                icon: <span className='theme-indicator' style={{ backgroundColor: theme.primary }} />,
                className: currentTheme === key ? 'theme-active' : ''
              }))
            }}
          >
            <span className='nav-item nav-item--theme'>
              <SkinOutlined />
              <span>换肤</span>
            </span>
          </Dropdown>

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
            <>
              {/* 消息通知 */}
              <Dropdown
                trigger={['click']}
                placement='bottomRight'
                onOpenChange={handleNotifOpenChange}
                dropdownRender={() => notifPanel}
              >
                <span className='nav-item nav-item--bell'>
                  <Badge count={unreadCount} size='small' offset={[2, -2]}>
                    <BellOutlined style={{ fontSize: 18 }} />
                  </Badge>
                </span>
              </Dropdown>

              <Dropdown
                trigger={['click']}
                placement='bottomRight'
                menu={{
                  onClick: ({ key }) => {
                    if (key === 'profile') navigate('/profile');
                    if (key === 'drafts') navigate('/drafts');
                    if (key === 'views') navigate('/my-views');
                    if (key === 'collections') navigate('/my-collections');
                    if (key === 'logout') handleLogout();
                  },
                  items: [
                    {
                      key: 'profile',
                      icon: <UserOutlined />,
                      label: '个人中心'
                    },
                    {
                      key: 'drafts',
                      icon: <FileTextOutlined />,
                      label: '我的文章'
                    },

                    {
                      key: 'views',
                      icon: <EyeOutlined />,
                      label: '浏览历史'
                    },
                    {
                      key: 'collections',
                      icon: <BookFilled />,
                      label: '我的收藏'
                    },
                    { type: 'divider' },
                    {
                      key: 'logout',
                      danger: true,
                      icon: <LogoutOutlined />,
                      label: '退出登录'
                    }
                  ]
                }}
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
            </>
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
