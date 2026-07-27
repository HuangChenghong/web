import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartOutlined, EyeOutlined, CalendarOutlined, BookFilled } from '@ant-design/icons';
import { Tag } from 'antd';
import './mycollections.css';

// 分类颜色映射
const categoryColors = {
  '技术': 'blue',
  '生活': 'green',
  '随笔': 'purple',
  '教程': 'orange',
  '分享': 'cyan',
  '其他': 'default'
};

// 模拟收藏数据
const mockCollections = [
  { id: 1, title: 'React Hooks 入门指南', category: '技术', likes: 128, views: 2341, createdAt: '2026-07-26 15:30', username: '张三' },
  { id: 4, title: '前端性能优化技巧总结', category: '分享', likes: 256, views: 4532, createdAt: '2026-07-25 16:45', username: '赵六' },
  { id: 6, title: 'Vue3 组合式API详解', category: '技术', likes: 178, views: 3120, createdAt: '2026-07-23 18:20', username: '孙八' }
];

const MyCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    // 模拟加载收藏记录
    setCollections(mockCollections);
  }, []);

  return (
    <div className='my-collections'>
      {/* 标题 */}
      <div className='my-collections__header'>
        <h2 className='my-collections__title'>
          <BookFilled />
          <span>我的收藏</span>
        </h2>
        <p className='my-collections__subtitle'>收藏的文章列表</p>
      </div>

      {collections.length === 0 ? (
        <div className='my-collections__empty'>
          <BookFilled className='my-collections__empty-icon' />
          <p>暂无收藏记录</p>
          <button className='my-collections__empty-btn' onClick={() => navigate('/')}>
            去收藏文章
          </button>
        </div>
      ) : (
        <ul className='my-collections__list'>
          {collections.map(item => (
            <li
              key={item.id}
              className='my-collections__item'
              onClick={() => navigate(`/detail/${item.id}?username=${item.username}`)}
            >
              <div className='my-collections__item-content'>
                <div className='my-collections__item-header'>
                  <Tag color={categoryColors[item.category] || 'default'}>
                    {item.category}
                  </Tag>
                </div>
                <h3 className='my-collections__item-title'>{item.title}</h3>
                <div className='my-collections__item-meta'>
                  <span className='my-collections__item-author'>{item.username}</span>
                  <span className='my-collections__item-date'>
                    <CalendarOutlined />
                    {item.createdAt}
                  </span>
                  <span className='my-collections__item-stats'>
                    <HeartOutlined /> {item.likes}
                    <EyeOutlined /> {item.views}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyCollections;