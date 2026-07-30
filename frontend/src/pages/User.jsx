import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { loginApi, registerApi, captcha } from '../api/blog';
import { useUserStore } from '@/store/useUserStore';
import './user.css';

/**
 * 登录 / 注册 二合一页面
 * - 同一个组件，根据当前路由（/login 或 /register）展示对应表单
 * - 用 useLocation() 拿 pathname 判定模式
 * - 顶部 Tab 也能切换（真正改路由，保证地址栏和刷新都一致）
 */
const User = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useUserStore();
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [captchaId, setCaptchaId] = useState('');

  // 当前模式：'login' | 'register'。由路由决定，路由变了组件会重渲染自动同步
  const mode = location.pathname.includes('/register') ? 'register' : 'login';
  console.log('location.pathname', location.pathname);
  const isLogin = mode === 'login';

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // 切模式时清空表单（避免上一个模式的字段残留）
  useEffect(() => {
    form.resetFields();
  }, [mode, form]);

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // 切模式：跳到对应路由
  const switchMode = next => {
    if (next === mode) return;
    navigate(next === 'login' ? '/login' : '/register');
  };
  const refreshCaptcha = async () => {
    try {
      const res = await captcha();
      const imgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(res.data.captchaImg)}`;
      setCaptchaUrl(imgUrl);
      setCaptchaId(res.data.captchaId);
    } catch (error) {
      console.log(error);
    }
  };

  // 提交：根据 mode 调不同接口
  const handleFinish = async values => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginApi({
          username: values.username,
          password: values.password,
          code: values.captcha,
          captchaId: captchaId
        });
        console.log('登录成功1111111111', res);
        // request 拦截器已经剥过一层 data，业务数据在 res.data
        const { username } = res.data || {};
        login(res.data); // 使用 zustand 登录

        messageApi.success(`欢迎回来，${username || ''}！`);
        setTimeout(() => navigate('/'), 600);
      } else {
        await registerApi({
          username: values.username,
          password: values.password
        });
        messageApi.success('注册成功，正在为你登录…');
        // 注册成功后跳到登录页（带用户名，方便继续操作）
        setTimeout(() => navigate('/login', { state: { username: values.username } }), 800);
      }
    } catch (err) {
      // 拦截器已经弹过通用错误，这里再兜个底
      console.log(err, err.message);
      messageApi.error(err?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-page'>
      {contextHolder}

      <div className='auth-card'>
        {/* 顶部 Logo + 标题 */}
        <div className='auth-card__brand'>
          <div className='auth-card__logo'>
            <ThunderboltFilled />
          </div>
          <h1 className='auth-card__title'>{isLogin ? '欢迎回来' : '加入我们'}</h1>
          <p className='auth-card__subtitle'>{isLogin ? '登录后开始记录你的想法' : '几秒钟创建账号，开启你的博客'}</p>
        </div>

        {/* Tab 切换：登录 / 注册 */}
        {/* auth-tabs--login / --register 控制 CSS 的 ::after 滑动指示器切换位置 */}
        <div className={`auth-tabs auth-tabs--${mode}`}>
          <div
            className={`auth-tabs__item ${isLogin ? 'auth-tabs__item--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            登录
          </div>
          <div
            className={`auth-tabs__item ${!isLogin ? 'auth-tabs__item--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            注册
          </div>
        </div>

        {/* 表单 */}
        <Form
          form={form}
          name={isLogin ? 'login' : 'register'}
          size='large'
          layout='vertical'
          onFinish={handleFinish}
          autoComplete='off'
        >
          <Form.Item
            name='username'
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度 3~20 位' }
            ]}
          >
            <Input prefix={<UserOutlined className='auth-input-icon' />} placeholder='用户名' allowClear />
          </Form.Item>

          <Form.Item
            name='password'
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 20, message: '密码长度 6~20 位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined className='auth-input-icon' />} placeholder='密码' />
          </Form.Item>

          {/* 注册多一项确认密码 */}
          {!isLogin ? (
            <Form.Item
              name='confirm'
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码不一致'));
                  }
                })
              ]}
            >
              <Input.Password prefix={<SafetyOutlined className='auth-input-icon' />} placeholder='确认密码' />
            </Form.Item>
          ) : (
            // 验证码行：input + svg 图横排，靠 CSS .captcha-row 的 flex + gap 控制布局
            <div className='captcha-row'>
              <Form.Item name='captcha' rules={[{ required: true, message: '请输入验证码' }]}>
                <Input placeholder='请输入验证码' />
              </Form.Item>
              <img className='captcha-img' src={captchaUrl || null} onClick={refreshCaptcha} alt='点击换一张' />
            </div>
          )}
          <Button type='primary' htmlType='submit' loading={loading} block className='auth-submit'>
            {isLogin ? '登录' : '注册'}
          </Button>
        </Form>

        {/* 底部切换链接 */}
        <div className='auth-footer'>
          {isLogin ? (
            <span>
              还没有账号？
              <button onClick={() => switchMode('register')}>立即注册</button>
            </span>
          ) : (
            <span>
              已有账号？
              <button onClick={() => switchMode('login')}>返回登录</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default User;
