import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import './myviews.css';

// 分类颜色映射
const categoryColors = {
  '技术': 'blue',
  '生活': 'green',
  '随笔': 'purple',
  '教程': 'orange',
  '分享': 'cyan',
  '其他': 'default'
};

// 模拟浏览记录数据
const mockViewHistory = [
  { id: 1, title: 'React Hooks 入门指南', category: '技术', likes: 128, views: 2341, createdAt: '2026-07-26 15:30', username: '张三' },
  { id: 2, title: 'Node.js 异步编程最佳实践', category: '技术', likes: 96, views: 1892, createdAt: '2026-07-26 14:20', username: '李四' },
  { id: 3, title: '周末去公园散步的感悟', category: '生活', likes: 45, views: 567, createdAt: '2026-07-25 19:10', username: '王五' },
  { id: 4, title: '前端性能优化技巧总结', category: '分享', likes: 256, views: 4532, createdAt: '2026-07-25 16:45', username: '赵六' },
  { id: 5, title: '学习编程的心得体会', category: '随笔', likes: 89, views: 1234, createdAt: '2026-07-24 20:30', username: '钱七' }
];

const MyViews = () => {
  const navigate = useNavigate();
  const [viewHistory, setViewHistory] = useState([]);

  useEffect(() => {
    // 模拟加载浏览记录
    setViewHistory(mockViewHistory);
  }, []);

  return (
    <div className='my-views'>
      {/* 标题 */}
      <div className='my-views__header'>
        <h2 className='my-views__title'>
          <EyeOutlined />
          <span>我的浏览</span>
        </h2>
        <p className='my-views__subtitle'>浏览过的文章记录</p>
      </div>

      {viewHistory.length === 0 ? (
        <div className='my-views__empty'>
          <EyeOutlined className='my-views__empty-icon' />
          <p>暂无浏览记录</p>
          <button className='my-views__empty-btn' onClick={() => navigate('/')}>
            去浏览文章
          </button>
        </div>
      ) : (
        <ul className='my-views__list'>
          {viewHistory.map(item => (
            <li
              key={item.id}
              className='my-views__item'
              onClick={() => navigate(`/detail/${item.id}?username=${item.username}`)}
            >
              <div className='my-views__item-content'>
                <div className='my-views__item-header'>
                  <Tag color={categoryColors[item.category] || 'default'}>
                    {item.category}
                  </Tag>
                </div>
                <h3 className='my-views__item-title'>{item.title}</h3>
                <div className='my-views__item-meta'>
                  <span className='my-views__item-author'>{item.username}</span>
                  <span className='my-views__item-date'>
                    <CalendarOutlined />
                    {item.createdAt}
                  </span>
                  <span className='my-views__item-stats'>
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

export default MyViews;