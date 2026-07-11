import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Card, Upload, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import './profile.css';
import { updateUser } from '../api/blog';

const Profile = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const username = localStorage.getItem('username') || '';
    const avatar = localStorage.getItem('userAvatar') || '';
    setAvatarUrl(avatar);
    form.setFieldsValue({
      username,
      nickname: localStorage.getItem('userNickname') || '',
      email: localStorage.getItem('userEmail') || ''
    });
  }, [form]);

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
    formData.append('cname', values.nickname || '');
    formData.append('email', values.email || '');

    if (avatarFile) {
      formData.append('avater', avatarFile);
    }

    try {
      const res = await updateUser(formData);

      // updateUser 返回的结构为 { code, msg, data }
      const savedAvatar = res.data?.avatar || res.data?.avater || avatarUrl;
      if (savedAvatar) {
        localStorage.setItem('userAvatar', savedAvatar);
      }
      localStorage.setItem('userNickname', values.nickname || '');
      localStorage.setItem('userEmail', values.email || '');
      messageApi.success('个人资料已更新');
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
            <Form.Item label='头像' className='profile-avatar-item'>
              <div className='profile-avatar-row'>
                <div className='profile-avatar-preview'>
                  {avatarUrl ? (
                    <Avatar size={96} src={avatarUrl} />
                  ) : (
                    <Avatar size={96} style={{ backgroundColor: '#8b5cf6' }}>
                      {(localStorage.getItem('username') ||
                        'U')[0]?.toUpperCase()}
                    </Avatar>
                  )}
                </div>
                <div className='profile-avatar-actions'>
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
                  <div className='profile-avatar-hint'>
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
              name='nickname'
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
              <Button type='primary' loading={loading} htmlType='submit'>
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
