import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Modal, message, Input } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  ReadOutlined,
  SearchOutlined,
  EditOutlined
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

const BlogList = () => {
  const [blogList, setBlogList] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState('');
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

      {/* 顶部工具栏：标题 + 搜索 + 发布按钮（仅样式，逻辑你后续接） */}
      <div className='blog-toolbar'>
        <div className='blog-toolbar__left'>
          <span className='blog-toolbar__icon' aria-hidden='true'>
            <ReadOutlined />
          </span>
          <h2 className='blog-toolbar__title'>
            所有文章
            <span className='blog-toolbar__count'>（总计 {total} 篇）</span>
          </h2>
        </div>

        <div className='blog-toolbar__right'>
          <div className='blog-toolbar__search-wrap'>
            <SearchOutlined className='blog-toolbar__search-icon' />
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

      {loading && blogList.length === 0 ? (
        <div className='blog-list__empty'>加载中...</div>
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

              return (
                <li
                  key={item.id}
                  className='blog-card'
                  onClick={() =>
                    router(`/detail/${item.id}?username=${item.username}`)
                  }
                >
                  <div className='blog-card__main'>
                    <h2 className='blog-card__title'>{item.title}</h2>
                    <p
                      className='blog-card__excerpt'
                      dangerouslySetInnerHTML={{
                        __html: truncate(item.content, 140)
                      }}
                    ></p>
                    <div className='blog-card__meta'>
                      <span className='blog-card__meta-item'>
                        <UserOutlined />
                        {author}
                      </span>
                      <span className='blog-card__meta-item'>
                        <CalendarOutlined />
                        {formatDate(publishedAt) || '时间未知'}
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
                        <EditOutlined />
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
