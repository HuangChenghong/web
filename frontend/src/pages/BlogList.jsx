import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Modal, message, Input } from 'antd';
import {
  CalendarOutlined,
  ExclamationCircleFilled,
  EditOutlined,
  LikeOutlined,
  EyeOutlined,
  FolderOutlined,
  ThunderboltFilled,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';

import { getBlogList, delBlog, getCategories, getCount } from '../api/blog';
import './bloglist.css';
import { imgUrl } from '../utils/imgUrl';
import { formatDate } from '../utils/common';

// 内容截断（单行版本，CSS 也会兜底）
const truncate = (str = '', max = 140) => (str.length <= max ? str : str.slice(0, max) + '…');

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
const HERO_TITLES = ['在这里，记录每一段思考', '把灵感写成可被回看的文字', '今天，又有什么值得分享？'];
const pickTitle = total => HERO_TITLES[Math.min(total, HERO_TITLES.length - 1)];

const BlogList = () => {
  // 从 sessionStorage 恢复列表状态
  const savedState = sessionStorage.getItem('bloglist_state');
  const initialState = savedState ? JSON.parse(savedState) : {};

  const [blogList, setBlogList] = useState([]);
  const [page, setPage] = useState(initialState.page || 1);
  const [pageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState(initialState.title || '');
  const [category, setCategory] = useState(initialState.category || '');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hero, setHero] = useState({});
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const router = useNavigate();
  const username = localStorage.getItem('username');

  // 保存列表状态到 sessionStorage
  const saveListState = useCallback(
    (state = {}) => {
      const currentState = { page, category, title, ...state };
      sessionStorage.setItem('bloglist_state', JSON.stringify(currentState));
    },
    [page, category, title]
  );

  const fetchData = async (page, query = title) => {
    setLoading(true);
    const data = {
      page,
      pageSize,
      title: query,
      category_id: category,
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

  useEffect(() => {
    // 获取分类列表
    getCategories()
      .then(res => {
        const all = [{ id: '', name: '全部' }, ...res.data];
        setCategories(all);
      })
      .catch(err => {
        console.log('获取分类-', err);
      });
    // 获取总用户数和总流量量
    getCount()
      .then(res => {
        setHero(res.data);
      })
      .catch(err => console.log('获取用户num=', err));
  }, []);
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
  }, [page, category]);

  // 保存列表状态到 sessionStorage
  useEffect(() => {
    sessionStorage.setItem('bloglist_state', JSON.stringify({ page, category, title }));
  }, [page, category, title]);

  // 组件挂载时恢复滚动位置
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem('bloglist_scroll');
    if (savedScrollY) {
      setTimeout(() => {
        window.scrollTo(0, Number(savedScrollY));
      }, 100);
    }
  }, []);

  // 监听滚动保存位置
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('bloglist_scroll', String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
            <p className='blog-hero__subtitle'>这里汇集了所有发布过的文章，挑一个分类，或者直接搜索感兴趣的标题吧～</p>
          </div>
          <div className='blog-hero__stats'>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{total}</span>
              <span className='blog-hero__stat-label'>总文章</span>
            </div>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{hero.userCount}</span>
              <span className='blog-hero__stat-label'>累计用户</span>
            </div>
            <div className='blog-hero__stat'>
              <span className='blog-hero__stat-num'>{hero.viewCount}</span>
              <span className='blog-hero__stat-label'>总浏览</span>
            </div>
          </div>
        </div>
      </section>

      <div className='blog-toolbar'>
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

            <div className='blog-toolbar__category-list' ref={categoryScrollRef}>
              {categories.map(item => (
                <button
                  key={item.id}
                  className={`blog-toolbar__category-item ${category === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(item.id);
                    setPage(1);
                  }}
                >
                  {item.name}
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
          <button className='blog-toolbar__btn' type='button' onClick={handleLogin}>
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
              <div className='blog-skeleton-card__cover' />
              <div className='blog-skeleton-card__body'>
                <div className='blog-skeleton-card__shimmer' style={{ width: '18%', height: 14 }} />
                <div className='blog-skeleton-card__shimmer' style={{ width: '70%', height: 20 }} />
                <div className='blog-skeleton-card__shimmer' style={{ width: '100%', height: 12 }} />
                <div className='blog-skeleton-card__shimmer' style={{ width: '45%', height: 12 }} />
              </div>
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
              const avater = item.avater;
              const publishedAt = item.created_at || item.createdAt || item.publishedAt || null;
              const blogCategory = item.categoryName || '其他';
              const likes = item.likeCount || 0;
              const views = item.views || 0;
              const accent = categoryAccents[blogCategory] || categoryAccents['其他'];
              const cardStyle = {
                '--card-accent': accent.color,
                '--card-accent-bg': accent.bg
              };

              return (
                <li
                  key={item.id}
                  className='blog-card'
                  style={cardStyle}
                  onClick={() => {
                    // 保存当前滚动位置
                    sessionStorage.setItem('bloglist_scroll', String(window.scrollY));
                    router(`/detail/${item.id}?username=${item.username}`);
                  }}
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
                    <p className='blog-card__excerpt'>{item.description || '暂无描述'}</p>
                    <div className='blog-card__meta'>
                      <span className='blog-card__author'>
                        {avater ? (
                          <img src={imgUrl(avater)} width='18' alt={author} />
                        ) : (
                          <span className='blog-card__avatar'>{getInitial(author)}</span>
                        )}
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
                        <LikeOutlined />
                        {likes}
                      </span>
                      {/* 浏览量 */}
                      <span className='blog-card__meta-item blog-card__meta-item--view'>
                        <EyeOutlined />
                        {views}
                      </span>
                    </div>
                  </div>

                  {/* 封面缩略图 */}
                  <div className='blog-card__cover'>
                    <img
                      width='160'
                      height='120'
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
