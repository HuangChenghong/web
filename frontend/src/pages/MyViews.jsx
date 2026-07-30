import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { getMyViewArticle } from '@/api/blog';
import './myviews.css';

// 分类颜色映射
const categoryColors = {
  技术: 'blue',
  生活: 'green',
  随笔: 'purple',
  教程: 'orange',
  分享: 'cyan',
  其他: 'default'
};

const MyViews = () => {
  const navigate = useNavigate();
  const [viewHistory, setViewHistory] = useState([]);

  useEffect(() => {
    getMyViewArticle().then(res => {
      setViewHistory(res.data);
    });
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
              onClick={() => navigate(`/detail/${item.article_id}?username=${item.username}`)}
            >
              <div className='my-views__item-content'>
                <div className='my-views__item-header'>
                  <Tag color={categoryColors[item.categoryName] || 'default'}>{item.categoryName}</Tag>
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
