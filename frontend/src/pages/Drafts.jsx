import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message, Tabs, Input, Pagination, Spin } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined,
  FileProtectOutlined,
  LikeOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { getBlogList, delBlog } from '../api/blog';
import { formatDate } from '../utils/common';
import './drafts.css';

// 状态映射：区分草稿 vs 已发布
const statusMap = {
  1: { label: '已发布', color: 'green', icon: <EyeOutlined /> },
  2: { label: '草稿', color: 'orange', icon: <FileTextOutlined /> }
};

// 状态筛选 Tab 配置
const statusTabs = [
  { key: '2', label: '草稿' },
  { key: '1', label: '已发布' }
];

// 分类强调色
const categoryAccents = {
  技术: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.10)' },
  生活: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)' },
  随笔: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.10)' },
  教程: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
  分享: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.10)' },
  其他: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.14)' }
};

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [title, setTitle] = useState('');
  const [statusTab, setStatusTab] = useState('2');
  const [loading, setLoading] = useState(false);
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        title: title.trim(),
        user_id: Number(localStorage.getItem('userId')) || '',
        status: Number(statusTab)
      };
      const res = await getBlogList(params);
      setDrafts(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('获取文章列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, title, statusTab]);

  const openDraft = (item, flag = false) => {
    if (flag) {
      navigate(`/publishEdit/${item.id}?status=${item.status}`);
    } else {
      navigate(`/detail/${item.id}?username=${item.username}&status=${item.status}`);
    }
  };

  const deleteDraft = async id => {
    const res = await delBlog({
      id,
      userId: Number(localStorage.getItem('userId')) || 1
    });
    if (res.code === 200) {
      messageApi.success('删除成功');
      setPage(1);
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
      onOk: () => deleteDraft(id)
    });
  };

  const getEmptyText = () => {
    if (title.trim()) return `没找到包含"${title.trim()}"的文章`;
    if (statusTab === '1') return '暂无已发布文章，去发布一篇吧';
    return '暂无草稿，去写一篇吧';
  };

  return (
    <div className='my-drafts'>
      {contextHolder}
      {messageContextHolder}

      {/* 标题区 */}
      <div className='my-drafts__header'>
        <h2 className='my-drafts__title'>
          <FileProtectOutlined />
          <span>我的文章</span>
        </h2>
        <p className='my-drafts__subtitle'>草稿与已发布文章统一管理</p>
      </div>

      {/* 工具栏：状态 Tab + 搜索框 */}
      <div className='my-drafts__toolbar'>
        <Tabs
          activeKey={statusTab}
          onChange={key => {
            setStatusTab(key);
            setPage(1);
          }}
          items={statusTabs}
          className='my-drafts__tabs'
        />
        <div className='my-drafts__search'>
          <Input.Search
            allowClear
            placeholder='搜索文章标题'
            value={title}
            onChange={e => setTitle(e.target.value)}
            onSearch={val => {
              setTitle(val);
              setPage(1);
            }}
            onClear={() => {
              setTitle('');
              setPage(1);
            }}
          />
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className='my-drafts__empty'>
          <FileTextOutlined className='my-drafts__empty-icon' />
          <p>{getEmptyText()}</p>
          <button className='my-drafts__empty-btn' onClick={() => navigate('/publish')}>
            去写一篇
          </button>
        </div>
      ) : (
        <>
          <Spin spinning={loading}>
            <ul className='my-drafts__list'>
              {drafts.map(item => {
                const status = statusMap[item.status] || statusMap[2];
                const isDraft = item.status !== 1;
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
                    className={`my-drafts__item ${isDraft ? 'my-drafts__item--draft' : 'my-drafts__item--published'}`}
                    style={cardStyle}
                    onClick={() => openDraft(item)}
                  >
                    {/* 内容区 - 左边 */}
                    <div className='my-drafts__item-main'>
                      {/* 分类 + 状态标签 */}
                      <div className='my-drafts__item-category'>
                        <span className='my-drafts__item-category-tag'>
                          <FolderOutlined />
                          {blogCategory}
                        </span>
                        <span className={`my-drafts__item-status my-drafts__item-status--${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <h3 className='my-drafts__item-title'>{item.title || '未命名草稿'}</h3>

                      {/* 描述 */}
                      <p className='my-drafts__item-excerpt'>{item.description || '暂无描述'}</p>

                      {/* 元信息 */}
                      <div className='my-drafts__item-meta'>
                        <span className='my-drafts__item-meta-item'>
                          <CalendarOutlined />
                          {formatDate(item.updatedAt || item.createdAt)}
                        </span>
                        <span className='my-drafts__item-divider' />
                        <span className='my-drafts__item-meta-item my-drafts__item-meta-item--like'>
                          <LikeOutlined />
                          {likes}
                        </span>
                        <span className='my-drafts__item-meta-item my-drafts__item-meta-item--view'>
                          <EyeOutlined />
                          {views}
                        </span>
                      </div>
                    </div>

                    {/* 封面缩略图 - 右边 */}
                    <div className='my-drafts__item-cover'>
                      <img
                        src={
                          item.thumb ||
                          `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(blogCategory + ' article, blog post, minimalist, clean')}&image_size=landscape_4_3`
                        }
                        alt={item.title}
                        loading='lazy'
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div className='my-drafts__item-actions' onClick={e => e.stopPropagation()}>
                      <button
                        className='my-drafts__action my-drafts__action--edit'
                        onClick={() => openDraft(item, true)}
                        title={isDraft ? '继续编辑' : '查看文章'}
                      >
                        <EditOutlined />
                      </button>
                      <button
                        className='my-drafts__action my-drafts__action--delete'
                        onClick={() => confirmDelete(item.id)}
                        title='删除'
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Spin>

          {/* 分页 */}
          <div className='my-drafts__pagination'>
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

export default Drafts;
