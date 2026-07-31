import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  getBlogDetail,
  collectBlog,
  cancelCollect,
  getViewNum,
  likeBlog,
  cancelLike,
  getSimilarBlogs,
  createComment,
  getCommentList,
  likeComment
} from '@/api/blog';
import {
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  BookOutlined,
  BookFilled,
  MessageOutlined,
  LikeOutlined,
  FolderOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { Avatar, Input, Tag, message, Pagination } from 'antd';
import { imgUrl } from '@/utils/imgUrl';
import { formatDate } from '@/utils/common';
import './detail.css';

// 模拟评论数据
const mockComments = [
  {
    id: 1,
    username: '张三',
    avater: '',
    content: '写得很好，受益匪浅！',
    createdAt: '2026-07-26 15:30',
    likes: 12
  }
];

const Detail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('username');
  const status = searchParams.get('status') || 1;
  const navigate = useNavigate();

  const [blogDetail, setBlogDetail] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState([]);
  const [similarBlogs, setSimilarBlogs] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [total, setTotal] = useState(0);

  const fetchBlogDetail = async () => {
    try {
      const { data } = await getBlogDetail(id, { status });
      const isCollect = data.collectUserId !== null && data.collectUserId !== undefined;
      const isLike = data.likeUserId !== null && data.likeUserId !== undefined;
      setBlogDetail(data);
      setLikes(data.likes || 0);
      setViews(data.views || 0);
      setIsLiked(isLike);
      setIsCollected(isCollect);
      fetchSimilarBlogs(data);
    } catch (error) {
      console.error('获取博客详情失败:', error);
    }
  };

  useEffect(() => {
    handleView();
    fetchBlogDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    console.log(page, 'page');
    fetchCommentsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, id]);

  // 获取文章评论列表
  const fetchCommentsList = async () => {
    try {
      const { data, total } = await getCommentList(id, { page, pageSize });
      console.log(data, '获取文章评论列表');
      setComments(data || []);
      setTotal(total || 0);
    } catch (error) {
      console.error('获取文章评论列表失败:', error);
    }
  };

  // 获取相似文章列表
  const fetchSimilarBlogs = async params => {
    try {
      const { data } = await getSimilarBlogs({ id, category_id: params.category_id });
      setSimilarBlogs(data || []);
    } catch (error) {
      console.error('获取相似文章列表失败:', error);
    }
  };

  // 统计浏览量
  const handleView = async () => {
    try {
      const response = await getViewNum({ id });
      if (response.code === 200) {
        console.log('浏览量+++');
      }
    } catch (error) {
      console.error('获取浏览量失败:', error);
    }
  };

  // 点赞功能评论
  const handleCommentLike = async comment_id => {
    try {
      const data = { comment_id, user_id: localStorage.getItem('userId') };
      const response = await likeComment(data);
      if (response.code === 200) {
        const result = comments.map(comment => {
          if (comment.id === comment_id) {
            const isLike = comment.isLike;
            return {
              ...comment,
              isLike: !isLike,
              likeCount: isLike ? comment.likeCount - 1 : comment.likeCount + 1
            };
          }
          return comment;
        });
        setComments(result);
        // messageApi.success(newLiked ? '点赞成功' : '取消点赞');
      }
    } catch (error) {
      console.error('点赞博客失败:', error);
    }
  };

  // 点赞功能
  const handleLike = async () => {
    try {
      const data = { id, userId: localStorage.getItem('userId') };
      const response = !isLiked ? await likeBlog(data) : await cancelLike(data);
      if (response.code === 200) {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        messageApi.success(newLiked ? '点赞成功' : '取消点赞');
      }
    } catch (error) {
      console.error('点赞博客失败:', error);
    }
  };

  // 收藏功能
  const handleCollect = async () => {
    try {
      const data = { id, userId: localStorage.getItem('userId') };
      const response = !isCollected ? await collectBlog(data) : await cancelCollect(data);
      console.log(response);
      if (response.code === 200) {
        const newCollected = !isCollected;
        setIsCollected(newCollected);
        messageApi.success(newCollected ? '收藏成功' : '取消收藏');
      }
    } catch (error) {
      console.error('收藏博客失败:', error);
    }
  };

  // 提交评论
  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = {
      article_id: id,
      content: commentInput,
      parent_id: null,
      user_id: localStorage.getItem('userId')
    };
    // setComments(prev => [...prev, newComment]);
    try {
      const res = await createComment(newComment);
      if (res.code === 200) {
        messageApi.success('评论成功');
        fetchCommentsList();
      } else {
        messageApi.error('评论失败');
      }
      setCommentInput('');
    } catch (error) {
      console.error('评论失败:', error);
      messageApi.error('评论失败');
    }
  };

  // 返回上一页，兜底：直接访问详情页时回首页
  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  if (!blogDetail) {
    return <div className='blog-detail blog-detail__loading'>文章加载中...</div>;
  }

  const author = username;
  const publishedAt = blogDetail.publishedAt || blogDetail.createdAt || blogDetail.created_at || null;
  const blogCategory = blogDetail.categoryName || '其他';

  return (
    <div className='blog-detail'>
      {contextHolder}

      <div className='blog-detail__card'>
        {/* 吸顶导航条 */}
        <div className='blog-detail__nav'>
          <button className='blog-detail__nav-back' onClick={handleBack}>
            <LeftOutlined />
            <span>返回列表</span>
          </button>
        </div>

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
              <span className='blog-detail__meta-value'>{formatDate(publishedAt)}</span>
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
          <div className='blog-detail__content' dangerouslySetInnerHTML={{ __html: blogDetail.content }}></div>
        </div>

        {/* 相似博客推荐 */}
        <div className='blog-detail__similar'>
          <h3 className='blog-detail__similar-title'>
            <Tag color='purple'>相关推荐</Tag>
            <span>相似博客</span>
          </h3>
          <div className='blog-detail__similar-list'>
            {similarBlogs.map(item => (
              <div key={item.id} className='blog-detail__similar-item' onClick={() => navigate(`/detail/${item.id}`)}>
                <div className='blog-detail__similar-header'>
                  <span className='blog-detail__similar-category'>{item.categoryName}</span>
                </div>
                <h4 className='blog-detail__similar-title-text'>{item.title}</h4>
                <div className='blog-detail__similar-meta'>
                  <span>
                    <HeartOutlined /> {item.likeCount}
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
                <span className='blog-detail__comment-tip'>Ctrl + Enter 提交</span>
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
            <div className='blog-detail__comments-empty'>暂无评论，快来发表第一条吧！</div>
          ) : (
            <div className='blog-detail__comment-list'>
              {comments.map(item => (
                <div key={item.id} className='blog-detail__comment-item'>
                  <div className='blog-detail__comment-avatar'>
                    <Avatar size='small' src={item.avater ? imgUrl(item.avater) : undefined} />
                  </div>
                  <div className='blog-detail__comment-content'>
                    <div className='blog-detail__comment-header'>
                      <span className='blog-detail__comment-author'>{item.username}</span>
                      <span className='blog-detail__comment-time'>{item.createdAt}</span>
                    </div>
                    <p className='blog-detail__comment-text'>{item.content}</p>
                    <div className='blog-detail__comment-footer'>
                      <button
                        className={item.isLike ? 'active blog-detail__comment-like' : 'blog-detail__comment-like'}
                        onClick={() => handleCommentLike(item.id)}
                      >
                        {item.isLike ? <LikeOutlined /> : <HeartOutlined />}
                        <span>
                          {item.likes}
                          {item.likeCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className='blog-detail__pagination'>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={p => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detail;
