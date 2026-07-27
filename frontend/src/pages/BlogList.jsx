import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Modal, message, Input } from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  ReadOutlined,
  EditOutlined,
  HeartOutlined,
  EyeOutlined,
  FolderOutlined,
  ThunderboltFilled,
  EditFilled,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';

import { getBlogList, delBlog } from '../api/blog';
import './bloglist.css';

// 内容截断（单行版本，CSS 也会兜底）
const truncate = (str = '', max = 140) =>
  str.length <= max ? str : str.slice(0, max) + '…';

// 格式化日期
const formatDate = value => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 分类列表（模拟数据，后续可从后端获取）
const categories = [
  { value: '', label: '全部' },
  { value: '技术', label: '技术' },
  { value: '生活', label: '生活' },
  { value: '随笔', label: '随笔' },
  { value: '教程', label: '教程' },
  { value: '分享', label: '分享' },
  { value: '其他', label: '其他' }
];

// 分类强调色 + 浅底色（用于卡片装饰条和标签背景）
// 浅底色 = 主题里的 --cat-* 变量，这里作为 fallback 兜底
const categoryAccents = {
  技术: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.10)' },
  生活: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)' },
  随笔: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.10)' },
  教程: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
  分享: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.10)' },
  其他: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)' }
};

// 简单的文案模板
const HERO_TITLES = [
  '在这里，记录每一段思考',
  '把灵感写成可被回看的文字',
  '今天，又有什么值得分享？'
];
const pickTitle = total => HERO_TITLES[Math.min(total, HERO_TITLES.length - 1)];

const BlogList = () => {
  const [blogList, setBlogList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const router = useNavigate();
  const username = localStorage.getItem('username');

  const fetchData = async (page, query = title) => {
    setLoading(true);
    const data = {
      page,
      pageSize,
      title: query,
      category: category,
      status: 1
    };
    try {
      const res = await getBlogList(data);
      setBlogList(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取博客列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 计算总浏览量 / 总点赞数（用于 Hero 统计区）
  const { totalViews, totalLikes } = useMemo(() => {
    return blogList.reduce(
      (acc, cur) => ({
        totalViews: acc.totalViews + (Number(cur.views) || 0),
        totalLikes: acc.totalLikes + (Number(cur.likes) || 0)
      }),
      { totalViews: 0, totalLikes: 0 }
    );
  }, [blogList]);

  // 取首字符作为头像（中文取最后 1 字，英文取首字母）
  const getInitial = (name = '') => {
    if (!name) return '佚';
    const trimmed = String(name).trim();
    // 中文直接取最后一个字（如 "佚名"）
    if (/[一-龥]/.test(trimmed)) return trimmed.slice(-1);
    return trimmed.charAt(0).toUpperCase();
  };

  // 分类列表横向滚动状态
  const categoryScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateCategoryScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    // 预留 1px 容差，避免整数像素导致的抖动
    const canLeft = el.scrollLeft > 1;
    const canRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 1;
    setShowLeftArrow(canLeft);
    setShowRightArrow(canRight);
  }, []);

  useEffect(() => {
    updateCategoryScrollState();
    const el = categoryScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateCategoryScrollState, { passive: true });
    window.addEventListener('resize', updateCategoryScrollState);
    return () => {
      el.removeEventListener('scroll', updateCategoryScrollState);
      window.removeEventListener('resize', updateCategoryScrollState);
    };
    // categories.length 用于当分类列表从接口动态拉长时重新计算箭头显隐
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateCategoryScrollState, categories.length]);

  // 选中分类后自动滚到可视区
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('.blog-toolbar__category-item.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [category]);

  const scrollCategories = direction => {
    const el = categoryScrollRef.current;
    if (!el) return;
    // 每次滚动约一屏的 60%，足够顺滑又不会跳太多
    el.scrollBy({ left: direction * el.clientWidth * 0.6, behavior: 'smooth' });
  };

  // 跳转登录
  const handleLogin = () => {
    if (username) {
      router('/publish');
    } else {
      router('/login');
    }
  };

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 删除单篇文章
  const handleDelete = async id => {
    const res = await delBlog({
      id,
      userId: Number(localStorage.getItem('userId')) || 1
    });
    if (res.code === 200) {
      messageApi.success('删除成功');
      // 删除后回到第一页（数据少一页，逻辑更直观）
      setPage(1);
      fetchData(1);
    } else {
      messageApi.error(res.msg || '删除失败');
    }
  };

  const confirmDelete = id => {
    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleFilled />,
      content: '删除后无法恢复，确定吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => handleDelete(id)
    });
  };

  return (
    <div className='blog-list'>
      {contextHolder}
      {messageContextHolder}

      {/* === Hero 顶部欢迎区 === */}
      <section className='blog-hero'>
        <div className='blog-hero__inner'>
          <div className='blog-hero__text'>
            <span className='blog-hero__greeting'>
              <ThunderboltFilled />
              灵感 · 记录 · 分享
            </span>
            <h1 className='blog-hero__title'>{pickTitle(total)}</h1>
            <p className='blog-hero__subtitle'>
              这里汇集了所有发布过的文章。挑一个分类，或者直接搜索感兴趣的标题吧～
            </p>
          </div>
          <div className='blog-hero__stats'>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{total}</span>
              <span className='blog-hero__stat-label'>总文章</span>
            </div>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{totalViews}</span>
              <span className='blog-hero__stat-label'>总阅读</span>
            </div>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{totalLikes}</span>
              <span className='blog-hero__stat-label'>总点赞</span>
            </div>
          </div>
        </div>
      </section>

      {/* 顶部工具栏：标题 + 搜索 + 发布按钮（仅样式，逻辑你后续接） */}
      <div className='blog-toolbar'>
        {/* <div className='blog-toolbar__left'>
          <span className='blog-toolbar__icon' aria-hidden='true'>
            <ReadOutlined />
          </span>
          <h2 className='blog-toolbar__title'>
            所有文章
            <span className='blog-toolbar__count'>（总计 {total} 篇）</span>
          </h2>
        </div> */}

        <div className='blog-toolbar__right'>
          {/* 分类筛选：横向滚动 + 左右箭头 */}
          <div className='blog-toolbar__category'>
            <button
              type='button'
              aria-label='向左滚动分类'
              className={`blog-toolbar__category-arrow blog-toolbar__category-arrow--left ${showLeftArrow ? 'visible' : ''}`}
              onClick={() => scrollCategories(-1)}
            >
              <LeftOutlined />
            </button>

            <div
              className='blog-toolbar__category-list'
              ref={categoryScrollRef}
            >
              {categories.map(item => (
                <button
                  key={item.value}
                  className={`blog-toolbar__category-item ${category === item.value ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(item.value);
                    setPage(1);
                    fetchData(1);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type='button'
              aria-label='向右滚动分类'
              className={`blog-toolbar__category-arrow blog-toolbar__category-arrow--right ${showRightArrow ? 'visible' : ''}`}
              onClick={() => scrollCategories(1)}
            >
              <RightOutlined />
            </button>
          </div>

          <div className='blog-toolbar__search-wrap'>
            <Input.Search
              allowClear
              value={title}
              onChange={e => {
                setTitle(e.target.value);
              }}
              type='text'
              placeholder='搜索文章标题'
              onSearch={() => {
                fetchData(1);
              }}
              onClear={() => {
                fetchData(1, '');
              }}
            />
          </div>
          <button
            className='blog-toolbar__btn'
            type='button'
            onClick={handleLogin}
          >
            <EditOutlined />
            <span>{username ? '发布文章' : '登录后发布'}</span>
          </button>
        </div>
      </div>

      {/* 初次加载时显示骨架屏 */}
      {loading && blogList.length === 0 ? (
        <div className='blog-list__skeleton'>
          {[1, 2, 3].map(i => (
            <div className='blog-skeleton-card' key={i}>
              <div
                className='blog-skeleton-card__shimmer'
                style={{ width: '18%', height: 18 }}
              />
              <div
                className='blog-skeleton-card__shimmer'
                style={{ width: '70%', height: 22 }}
              />
              <div
                className='blog-skeleton-card__shimmer'
                style={{ width: '100%', height: 14 }}
              />
              <div
                className='blog-skeleton-card__shimmer'
                style={{ width: '50%', height: 14 }}
              />
            </div>
          ))}
        </div>
      ) : blogList.length === 0 ? (
        <div className='blog-list__empty'>暂无文章，敬请期待～</div>
      ) : (
        <>
          <ul className='blog-list__items'>
            {blogList.map(item => {
              // 兼容多种字段名
              const author = item.username || '佚名';
              const publishedAt =
                item.created_at || item.createdAt || item.publishedAt || null;
              const blogCategory = item.category || '其他';
              const likes = item.likes || 0;
              const views = item.views || 0;
              const accent =
                categoryAccents[blogCategory] || categoryAccents['其他'];
              const cardStyle = {
                '--card-accent': accent.color,
                '--card-accent-bg': accent.bg
              };

              return (
                <li
                  key={item.id}
                  className='blog-card'
                  style={cardStyle}
                  onClick={() =>
                    router(`/detail/${item.id}?username=${item.username}`)
                  }
                >
                  <div className='blog-card__main'>
                    {/* 分类标签 */}
                    <div className='blog-card__category'>
                      <span className='blog-card__category-tag'>
                        <FolderOutlined />
                        {blogCategory}
                      </span>
                    </div>

                    <h2 className='blog-card__title'>{item.title}</h2>
                    <p
                      className='blog-card__excerpt'
                      dangerouslySetInnerHTML={{
                        __html: truncate(item.content, 140)
                      }}
                    ></p>
                    <div className='blog-card__meta'>
                      <span className='blog-card__author'>
                        <span className='blog-card__avatar'>
                          {getInitial(author)}
                        </span>
                        {author}
                      </span>
                      <span className='blog-card__divider' />
                      <span className='blog-card__meta-item'>
                        <CalendarOutlined />
                        {formatDate(publishedAt) || '时间未知'}
                      </span>
                      <span className='blog-card__divider' />
                      {/* 点赞数 */}
                      <span className='blog-card__meta-item blog-card__meta-item--like'>
                        <HeartOutlined />
                        {likes}
                      </span>
                      {/* 浏览量 */}
                      <span className='blog-card__meta-item blog-card__meta-item--view'>
                        <EyeOutlined />
                        {views}
                      </span>
                    </div>
                  </div>

                  {username === item.username && (
                    <div className='blog-card__actions'>
                      <button
                        className='blog-card__action blog-card__action--edit'
                        title='编辑文章'
                        onClick={e => {
                          e.stopPropagation(); // 阻止冒泡到卡片
                          // onClick 逻辑由你接：
                          router(`/publishEdit/${item.id}`);
                          // 或者用 query 参数：router(`/publish?id=${item.id}`)
                        }}
                      >
                        <EditFilled />
                      </button>

                      <button
                        className='blog-card__action blog-card__action--delete'
                        title='删除文章'
                        onClick={e => {
                          e.stopPropagation(); // 阻止冒泡到卡片
                          confirmDelete(item.id);
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className='blog-list__pagination'>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={p => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BlogList;
