import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Card, Upload, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import './profile.css';
import { updateUser, getUserInfo } from '../api/blog';
import { useUserStore } from '@/store/useUserStore';

const Profile = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, update } = useUserStore();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const userId = user?.userId || localStorage.getItem('userId');
    getUserInfo({ userId })
      .then(res => {
        if (res.code === 200 && res?.data) {
          const { avater, username, cname, email } = res.data;
          setAvatarUrl(avater);
          form.setFieldsValue({
            username,
            cname,
            email
          });
        }
      })
      .catch(err => {
        messageApi.error('登录过期，请重新登录！！！！！！！！！！！！！');
        console.log(err, '过期了');
      });
  }, [form, user, messageApi]);

  const getBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  const handleUploadChange = async info => {
    const latestFileList = info.fileList.slice(-1);
    setFileList(latestFileList);

    const file = latestFileList[0]?.originFileObj;
    if (!file) {
      setAvatarFile(null);
      return;
    }

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error('只能上传图片文件');
      setFileList([]);
      setAvatarFile(null);
      return;
    }

    const preview = await getBase64(file);
    setAvatarUrl(preview);
    setAvatarFile(file);
  };

  const handleFinish = async values => {
    setLoading(true);

    const formData = new FormData();
    formData.append('username', values.username || '');
    formData.append('cname', values.cname || '');
    formData.append('email', values.email || '');

    if (avatarFile) {
      formData.append('avater', avatarFile);
    }

    try {
      const res = await updateUser(formData);
      // updateUser 返回的结构为 { code, msg, data }
      if (res.code === 200) {
        // 从接口返回的数据中获取更新后的用户信息
        const { username, cname, avater } = res.data;
        update({ username, cname, avater }); // 使用 zustand 更新
        // 更新本地状态
        setAvatarUrl(avater);
        form.setFieldsValue({ username, cname, avater });
        messageApi.success('个人资料已更新');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      messageApi.error(err?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='profile-page'>
      {contextHolder}
      <Card title='个人中心' className='profile-card'>
        <div className='profile-form-inner'>
          <Form form={form} layout='vertical' onFinish={handleFinish}>
            <Form.Item label='头像' className='profile-avater-item'>
              <div className='profile-avater-row'>
                <div className='profile-avater-preview'>
                  {avatarUrl ? (
                    <Avatar size={96} src={avatarUrl} />
                  ) : (
                    <Avatar size={96} style={{ backgroundColor: '#8b5cf6' }}>
                      {(user?.username || 'U')[0]?.toUpperCase()}
                    </Avatar>
                  )}
                </div>
                <div className='profile-avater-actions'>
                  <Upload
                    accept='image/*'
                    showUploadList={false}
                    beforeUpload={() => false}
                    fileList={fileList}
                    onChange={handleUploadChange}
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />}>更换头像</Button>
                  </Upload>
                  <div className='profile-avater-hint'>
                    建议 200x200，支持 jpg/png，文件小于 1MB
                  </div>
                </div>
              </div>
            </Form.Item>

            <Form.Item
              name='username'
              label='用户名'
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder='用户名' disabled />
            </Form.Item>

            <Form.Item
              name='cname'
              label='昵称'
              tooltip='用于在文章或评论中显示（可选）'
            >
              <Input placeholder='昵称（可选）' />
            </Form.Item>

            <Form.Item
              name='email'
              label='邮箱'
              rules={[{ type: 'email', message: '请输入有效邮箱地址' }]}
            >
              <Input prefix={<MailOutlined />} placeholder='邮箱（可选）' />
            </Form.Item>

            <Form.Item className='profile-actions'>
              <Button
                type='primary'
                style={{ marginRight: '20px' }}
                loading={loading}
                htmlType='submit'
              >
                保存资料
              </Button>
              <Button onClick={() => navigate(-1)}>返回</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
