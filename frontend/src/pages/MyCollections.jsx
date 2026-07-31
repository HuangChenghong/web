import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from 'antd';
import { CalendarOutlined, BookFilled, LikeOutlined, EyeOutlined, FolderOutlined } from '@ant-design/icons';
import { getMyCollectArticle } from '@/api/blog';
import { imgUrl } from '@/utils/imgUrl';
import { formatDate } from '@/utils/common';
import './mycollections.css';

// 分类强调色 + 浅底色
const categoryAccents = {
  技术: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.10)' },
  生活: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)' },
  随笔: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.10)' },
  教程: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
  分享: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.10)' },
  其他: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)' }
};

const MyCollections = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    getMyCollectArticle({ page, pageSize }).then(res => {
      setCollections(res.data || []);
      setTotal(res.total || 0);
    });
  }, [page]);

  // 取首字符作为头像
  const getInitial = (name = '') => {
    if (!name) return '佚';
    const trimmed = String(name).trim();
    if (/[一-龥]/.test(trimmed)) return trimmed.slice(-1);
    return trimmed.charAt(0).toUpperCase();
  };

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
          {collections.map(item => {
            const author = item.username || '佚名';
            const avater = item.avater;
            const publishedAt = item.createdAt;
            const blogCategory = item.categoryName || '其他';
            const likes = item.likes || 0;
            const views = item.views || 0;
            const accent = categoryAccents[blogCategory] || categoryAccents['其他'];
            const cardStyle = {
              '--card-accent': accent.color,
              '--card-accent-bg': accent.bg
            };

            return (
              <li
                key={item.id}
                className='my-collections__item'
                style={cardStyle}
                onClick={() => navigate(`/detail/${item.article_id}?username=${item.username}`)}
              >
                {/* 内容区 - 左边 */}
                <div className='my-collections__item-main'>
                  {/* 分类标签 */}
                  <div className='my-collections__item-category'>
                    <span className='my-collections__item-category-tag'>
                      <FolderOutlined />
                      {blogCategory}
                    </span>
                  </div>

                  <h3 className='my-collections__item-title'>{item.title}</h3>

                  {/* 描述 */}
                  <p className='my-collections__item-excerpt'>{item.description || '暂无描述'}</p>

                  {/* 元信息 */}
                  <div className='my-collections__item-meta'>
                    <span className='my-collections__item-author'>
                      {avater ? (
                        <img src={imgUrl(avater)} width='18' alt={author} />
                      ) : (
                        <span className='my-collections__item-avatar'>{getInitial(author)}</span>
                      )}
                      {author}
                    </span>
                    <span className='my-collections__item-divider' />
                    <span className='my-collections__item-meta-item'>
                      <CalendarOutlined />
                      {formatDate(publishedAt) || '时间未知'}
                    </span>
                    <span className='my-collections__item-divider' />
                    <span className='my-collections__item-meta-item my-collections__item-meta-item--like'>
                      <LikeOutlined />
                      {likes}
                    </span>
                    <span className='my-collections__item-meta-item my-collections__item-meta-item--view'>
                      <EyeOutlined />
                      {views}
                    </span>
                  </div>
                </div>

                {/* 封面缩略图 - 右边 */}
                <div className='my-collections__item-cover'>
                  <img
                    src={
                      item.thumb ||
                      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(blogCategory + ' article, blog post, minimalist, clean')}&image_size=landscape_4_3`
                    }
                    alt={item.title}
                    loading='lazy'
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className='my-drafts__pagination'>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={p => setPage(p)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default MyCollections;
