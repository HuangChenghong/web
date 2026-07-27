import React, { useEffect, useState } from 'react';
import { Card, List, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getBlogList, delBlog } from '../api/blog';

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async page => {
    const data = {
      page: 1,
      pageSize: 5,
      status: 2
    };
    try {
      const res = await getBlogList(data);
      setDrafts(res.data || []);
    } catch (err) {
      console.error('获取博客列表失败:', err);
    } finally {
      console.log('介乎');
    }
  };

  const openDraft = draft => {
    navigate(`/publishEdit/${draft.id}`);
  };

  const deleteDraft = async id => {
    const res = await delBlog({
      id,
      userId: Number(localStorage.getItem('userId')) || 1
    });
    if (res.code === 200) {
      messageApi.success('删除成功');
      fetchData(1);
    } else {
      messageApi.error(res.msg || '删除失败');
    }
  };

  

  return (
    <div className='drafts-page'>
      {contextHolder}
      <Card title='我的草稿文章' className='drafts-card'>
        <List
          locale={{ emptyText: '暂无草稿文章' }}
          dataSource={drafts}
          renderItem={item => (
            <List.Item
              actions={[
                <Button type='link' onClick={() => openDraft(item)} key='edit'>
                  编辑
                </Button>,
                <Button
                  type='link'
                  danger
                  onClick={() => deleteDraft(item.id)}
                  key='delete'
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={item.title || '未命名草稿'}
                description={`最后保存：${item.updatedAt || ''}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Drafts;
