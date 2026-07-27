import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getBlogDetail } from '@/api/blog';
import {
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  BookOutlined,
  BookFilled,
  MessageOutlined,
  LikeOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { Avatar, Input, Tag } from 'antd';
import { imgUrl } from '@/utils/imgUrl';
import './detail.css';

// 格式化发布时间
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

// 模拟相似博客数据
const mockSimilarBlogs = [
  {
    id: 1,
    title: 'React Hooks 入门指南',
    category: '技术',
    likes: 128,
    views: 2341
  },
  {
    id: 2,
    title: 'Node.js 异步编程最佳实践',
    category: '技术',
    likes: 96,
    views: 1892
  },
  {
    id: 3,
    title: '前端性能优化技巧总结',
    category: '分享',
    likes: 256,
    views: 4532
  }
];

// 模拟评论数据
const mockComments = [
  {
    id: 1,
    username: '张三',
    avater: '',
    content: '写得很好，受益匪浅！',
    createdAt: '2026-07-26 15:30',
    likes: 12
  },
  {
    id: 2,
    username: '李四',
    avater: '',
    content: '感谢分享，期待更多文章！',
    createdAt: '2026-07-26 16:45',
    likes: 8
  },
  {
    id: 3,
    username: '王五',
    avater: '',
    content: '这个知识点很实用，已经收藏了',
    createdAt: '2026-07-26 18:20',
    likes: 15
  }
];

const Detail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const navigate = useNavigate();

  const [blogDetail, setBlogDetail] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  const fetchBlogDetail = async () => {
    try {
      const response = await getBlogDetail(id);
      setBlogDetail(response.data);
      setLikes(response.data.likes || 0);
      setViews(response.data.views || 0);
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
      const collectedPosts = JSON.parse(
        localStorage.getItem('collectedPosts') || '[]'
      );
      setIsLiked(likedPosts.includes(id));
      setIsCollected(collectedPosts.includes(id));
    } catch (error) {
      console.error('获取博客详情失败:', error);
    }
  };

  useEffect(() => {
    fetchBlogDetail();
    setComments(mockComments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 点赞功能
  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikes(prev => (newLiked ? prev + 1 : prev - 1));
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    if (newLiked) {
      likedPosts.push(id);
    } else {
      const index = likedPosts.indexOf(id);
      if (index > -1) likedPosts.splice(index, 1);
    }
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
  };

  // 收藏功能
  const handleCollect = () => {
    const newCollected = !isCollected;
    setIsCollected(newCollected);
    const collectedPosts = JSON.parse(
      localStorage.getItem('collectedPosts') || '[]'
    );
    if (newCollected) {
      collectedPosts.push(id);
    } else {
      const index = collectedPosts.indexOf(id);
      if (index > -1) collectedPosts.splice(index, 1);
    }
    localStorage.setItem('collectedPosts', JSON.stringify(collectedPosts));
  };

  // 评论点赞
  const handleCommentLike = commentId => {
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
  };

  // 提交评论
  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    const newComment = {
      id: Date.now(),
      username: localStorage.getItem('username') || '匿名用户',
      avater: localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).avater
        : '',
      content: commentInput,
      createdAt: formatDate(new Date()),
      likes: 0
    };
    setComments(prev => [...prev, newComment]);
    setCommentInput('');
  };

  if (!blogDetail) {
    return (
      <div className='blog-detail blog-detail__loading'>文章加载中...</div>
    );
  }

  const author = username;
  const publishedAt =
    blogDetail.publishedAt ||
    blogDetail.createdAt ||
    blogDetail.created_at ||
    null;
  const blogCategory = blogDetail.category || '其他';

  return (
    <div className='blog-detail'>
      <div className='blog-detail__card'>
        {/* 文章标题 */}
        <div className='blog-detail__header'>
          <h1 className='blog-detail__title'>{blogDetail.title}</h1>

          {/* 文章元信息 */}
          <div className='blog-detail__meta'>
            <span className='blog-detail__meta-item'>
              <span className='blog-detail__meta-icon'>👤</span>
              <span className='blog-detail__meta-value'>{author}</span>
            </span>
            <span className='blog-detail__meta-item'>
              <span className='blog-detail__meta-icon'>🕒</span>
              <span className='blog-detail__meta-value'>
                {formatDate(publishedAt)}
              </span>
            </span>
            <span className='blog-detail__meta-item'>
              <span className='blog-detail__category'>
                <FolderOutlined style={{ fontSize: 12 }} />
                {blogCategory}
              </span>
            </span>
          </div>
        </div>

        {/* 操作栏 */}
        <div className='blog-detail__actions'>
          <button
            className={`blog-detail__action blog-detail__action--like ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
          >
            {isLiked ? <HeartFilled /> : <HeartOutlined />}
            <span>{likes}</span>
          </button>
          <button
            className={`blog-detail__action blog-detail__action--collect ${isCollected ? 'active' : ''}`}
            onClick={handleCollect}
          >
            {isCollected ? <BookFilled /> : <BookOutlined />}
            <span>{isCollected ? '已收藏' : '收藏'}</span>
          </button>
          <span className='blog-detail__action blog-detail__action--view'>
            <EyeOutlined />
            <span>{views}</span>
          </span>
        </div>

        {/* 文章内容 */}
        <div className='blog-detail__content-wrap'>
          <div
            className='blog-detail__content'
            dangerouslySetInnerHTML={{ __html: blogDetail.content }}
          ></div>
        </div>

        {/* 相似博客推荐 */}
        <div className='blog-detail__similar'>
          <h3 className='blog-detail__similar-title'>
            <Tag color='purple'>相关推荐</Tag>
            <span>相似博客</span>
          </h3>
          <div className='blog-detail__similar-list'>
            {mockSimilarBlogs.map(item => (
              <div
                key={item.id}
                className='blog-detail__similar-item'
                onClick={() => navigate(`/detail/${item.id}`)}
              >
                <div className='blog-detail__similar-header'>
                  <span className='blog-detail__similar-category'>
                    {item.category}
                  </span>
                </div>
                <h4 className='blog-detail__similar-title-text'>
                  {item.title}
                </h4>
                <div className='blog-detail__similar-meta'>
                  <span>
                    <HeartOutlined /> {item.likes}
                  </span>
                  <span>
                    <EyeOutlined /> {item.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 评论区 */}
        <div className='blog-detail__comments'>
          <h3 className='blog-detail__comments-title'>
            <MessageOutlined />
            <span>评论 ({comments.length})</span>
          </h3>

          {/* 评论输入 */}
          <div className='blog-detail__comment-input'>
            <Avatar
              size='small'
              src={
                localStorage.getItem('userInfo')
                  ? imgUrl(JSON.parse(localStorage.getItem('userInfo')).avater)
                  : undefined
              }
            />
            <div className='blog-detail__comment-input-wrap'>
              <Input.TextArea
                placeholder='写下你的评论...'
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onPressEnter={e => {
                  if (e.ctrlKey || e.metaKey) {
                    handleSubmitComment();
                  }
                }}
                rows={3}
                className='blog-detail__comment-textarea'
              />
              <div className='blog-detail__comment-actions'>
                <span className='blog-detail__comment-tip'>
                  Ctrl + Enter 提交
                </span>
                <button
                  className='blog-detail__comment-submit'
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim()}
                >
                  发表评论
                </button>
              </div>
            </div>
          </div>

          {/* 评论列表 */}
          {comments.length === 0 ? (
            <div className='blog-detail__comments-empty'>
              暂无评论，快来发表第一条吧！
            </div>
          ) : (
            <div className='blog-detail__comment-list'>
              {comments.map(item => (
                <div key={item.id} className='blog-detail__comment-item'>
                  <div className='blog-detail__comment-avatar'>
                    <Avatar
                      size='small'
                      src={item.avater ? imgUrl(item.avater) : undefined}
                    />
                  </div>
                  <div className='blog-detail__comment-content'>
                    <div className='blog-detail__comment-header'>
                      <span className='blog-detail__comment-author'>
                        {item.username}
                      </span>
                      <span className='blog-detail__comment-time'>
                        {item.createdAt}
                      </span>
                    </div>
                    <p className='blog-detail__comment-text'>{item.content}</p>
                    <div className='blog-detail__comment-footer'>
                      <button
                        className='blog-detail__comment-like'
                        onClick={() => handleCommentLike(item.id)}
                      >
                        <LikeOutlined />
                        <span>{item.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detail;
