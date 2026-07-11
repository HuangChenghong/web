import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getBlogDetail } from '@/api/blog';
import './detail.css';

// 格式化发布时间，没有就显示一个默认值
const formatDate = value => {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '刚刚';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Detail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');

  console.log(id, username, useParams());
  const [blogDetail, setBlogDetail] = useState(null);

  const fetchBlogDetail = async () => {
    try {
      const response = await getBlogDetail(id);
      setBlogDetail(response.data);
    } catch (error) {
      console.error('获取博客详情失败:', error);
    }
  };

  useEffect(() => {
    fetchBlogDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!blogDetail) {
    return (
      <div className='blog-detail blog-detail__loading'>文章加载中...</div>
    );
  }

  // 兼容多种字段名（后端可能返回 createdAt / publishedAt / username / username
  const author = username;
  const publishedAt =
    blogDetail.publishedAt ||
    blogDetail.createdAt ||
    blogDetail.created_at ||
    null;

  return (
    <div className='blog-detail'>
      <h1 className='blog-detail__title'>{blogDetail.title}</h1>

      <div className='blog-detail__meta'>
        <span className='blog-detail__meta-item'>
          <span className='blog-detail__meta-icon'>👤</span>
          <span className='blog-detail__meta-label'>作者：</span>
          <span className='blog-detail__meta-value'>{author}</span>
        </span>
        <span className='blog-detail__meta-item'>
          <span className='blog-detail__meta-icon'>🕒</span>
          <span className='blog-detail__meta-label'>发布时间：</span>
          <span className='blog-detail__meta-value'>
            {formatDate(publishedAt)}
          </span>
        </span>
      </div>

      <div
        className='blog-detail__content'
        dangerouslySetInnerHTML={{
          __html: blogDetail.content
        }}
      ></div>
    </div>
  );
};

export default Detail;
