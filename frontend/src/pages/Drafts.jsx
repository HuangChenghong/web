import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Modal, message, Tabs, Input, Pagination, Spin } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  CalendarOutlined,
  FileTextOutlined,
  EyeOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { getBlogList, delBlog } from '../api/blog';
import './drafts.css';

// ★ 状态映射：区分草稿 vs 已发布
// 后端 status: 1=已发布，2=草稿
const statusMap = {
  1: { label: '已发布', color: 'green', icon: <EyeOutlined /> },
  2: { label: '草稿', color: 'orange', icon: <FileTextOutlined /> }
};

// ★ 状态筛选 Tab 配置（只有草稿和已发布两个 tab）
const statusTabs = [
  { key: '2', label: '草稿' },
  { key: '1', label: '已发布' }
];

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

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [title, setTitle] = useState('');
  const [statusTab, setStatusTab] = useState('2'); // 默认"草稿"
  const [loading, setLoading] = useState(false);
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  // ★ 拉取数据：依赖 page / title / statusTab，任一变化都重拉
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        title: title.trim(),
        user_id: Number(localStorage.getItem('userId')) || '', // 当前登录用户id
        status: Number(statusTab) // 当前 tab 对应的状态值
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

  // 点击卡片：草稿跳编辑页，已发布跳详情页
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
      // 删完回第 1 页（数据少一页，逻辑直观），useEffect 会自动重拉
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

  // 空状态文案根据当前筛选条件动态变化
  const getEmptyText = () => {
    if (title.trim()) return `没找到包含"${title.trim()}"的文章`;
    if (statusTab === '1') return '暂无已发布文章，去发布一篇吧';
    return '暂无草稿，去写一篇吧';
  };

  return (
    <div className='my-drafts'>
      {contextHolder}
      {messageContextHolder}

      {/* 标题区（对齐 mycollections） */}
      <div className='my-drafts__header'>
        <h2 className='my-drafts__title'>
          <FileProtectOutlined />
          <span>我的文章</span>
        </h2>
        <p className='my-drafts__subtitle'>草稿与已发布文章统一管理</p>
      </div>

      {/* ★ 工具栏：状态 Tab（左）+ 搜索框（右） */}
      <div className='my-drafts__toolbar'>
        <Tabs
          activeKey={statusTab}
          onChange={key => {
            setStatusTab(key);
            setPage(1); // 切 Tab 必须重置页码，否则可能落到空页
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
              setPage(1); // 搜索时也要回到第 1 页
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
                return (
                  <li
                    key={item.id}
                    className={`my-drafts__item ${isDraft ? 'my-drafts__item--draft' : 'my-drafts__item--published'}`}
                    onClick={() => openDraft(item)}
                  >
                    <div className='my-drafts__item-content'>
                      {/* ★ 状态标签：草稿橙、已发布绿 */}
                      <div className='my-drafts__item-header'>
                        <Tag color={status.color} icon={status.icon}>
                          {status.label}
                        </Tag>
                      </div>
                      <h3 className='my-drafts__item-title'>{item.title || '未命名草稿'}</h3>
                      <div className='my-drafts__item-meta'>
                        <span className='my-drafts__item-date'>
                          <CalendarOutlined />
                          {formatDate(item.updatedAt || item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮（阻止冒泡，避免触发卡片点击） */}
                    <div className='my-drafts__item-actions' onClick={e => e.stopPropagation()}>
                      <button
                        className='my-drafts__action my-drafts__action--edit'
                        onClick={() => openDraft(item, true)}
                        title={isDraft ? '继续编辑/*' : '查看文章--'}
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

          {/* ★ 分页 */}
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
