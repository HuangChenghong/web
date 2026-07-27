import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';
import { Editor } from '@wangeditor/editor-for-react';
import { createToolbar } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import {
  EditOutlined,
  CloseOutlined,
  CheckOutlined,
  FileTextOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { addBlog, getBlogDetail, editBlog } from '@/api/blog';

import './article-editor.css';

// 分类列表
const categories = [
  { value: '技术', label: '技术' },
  { value: '生活', label: '生活' },
  { value: '随笔', label: '随笔' },
  { value: '教程', label: '教程' },
  { value: '分享', label: '分享' },
  { value: '其他', label: '其他' }
];

/**
 * 发布文章页面（纯 UI，逻辑由你接）
 *
 * 待你补充的点（提示，非作业）：
 *   1. Form 的 onFinish —— 拿到 values 后调 addBlog 接口
 *   2. 提交成功后 navigate('/') 跳回列表 + message.success 提示
 *   3. 当前是否登录的判断：localStorage.getItem('token')
 *   4. 取消按钮的 onClick：navigate(-1) 返回上一页
 */
const ArticleEditor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('随笔');
  // const articleId state not used
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();

  const editorConfig = {
    placeholder: '开始书写你的内容...'
  };

  const toolbarConfig = {
    modalAppendToBody: true,
    toolbarKeys: [
      'undo',
      'redo',
      '|',
      'bold',
      'italic',
      'underline',
      'through',
      'headerSelect',
      'blockquote',
      '|',
      'color',
      'bgColor',
      'fontSize',
      'fontFamily',
      'lineHeight',
      '|',
      'bulletedList',
      'numberedList',
      'todo',
      'insertLink',
      {
        key: 'group-image',
        title: '图片',
        menuKeys: ['insertImage', 'uploadImage']
      },
      'insertTable',
      'codeBlock',
      'divider',
      'fullScreen'
    ]
  };

  const [editor, setEditor] = useState(null);

  // 自定义 Toolbar：捕获重复创建错误，开发模式下 React StrictMode 可能触发双重挂载
  const CustomToolbar = ({ editor, config, mode = 'default' }) => {
    const ref = React.useRef(null);
    const toolbarRef = React.useRef(null);

    useEffect(() => {
      if (!editor || !ref.current) return;

      try {
        const tb = createToolbar({
          editor,
          selector: ref.current,
          config,
          mode
        });
        toolbarRef.current = tb;
      } catch (err) {
        if (String(err).includes('Repeated create toolbar')) {
          console.warn('Ignored repeated create toolbar:', err.message || err);
        } else {
          throw err;
        }
      }

      return () => {
        try {
          const t = toolbarRef.current;
          if (t && typeof t.destroy === 'function') t.destroy();
        } catch (e) {
          // ignore
        }
      };
    }, [editor, config, mode]);

    return <div ref={ref} />;
  };

  const handleSubmit = async (isDraft = false) => {
    // 没登录就别让提交
    if (!localStorage.getItem('userId')) {
      messageApi.warning('请先登录');
      return navigate('/login');
    }

    const data = {
      title,
      content,
      category,
      status: isDraft ? 2 : 1,
      user_id: localStorage.getItem('userId')
    };

    try {
      setSubmitting(true);
      const res = await (id ? editBlog({ ...data, id }) : addBlog(data));

      if (res.code === 200) {
        messageApi.success(id ? '修改成功' : '发布成功');
        navigate('/');
      } else {
        messageApi.error(res.msg || '操作失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      messageApi.error('网络异常，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 保存草稿到 localStorage（无后端时的临时方案）
  const saveDraft = () => {
    handleSubmit(true);
    messageApi.success('已保存到草稿');
  };

  useEffect(() => {
    if (!id) return;

    // 如果 id 是本地草稿 id（draft-...），从 localStorage 回显
    if (id.startsWith && id.startsWith('draft-')) {
      const raw = localStorage.getItem('draftArticles') || '[]';
      try {
        const arr = JSON.parse(raw) || [];
        const d = arr.find(x => x.id === id);
        if (d) {
          setTitle(d.title || '');
          setContent(d.content || '');
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getBlogDetail(id);
        if (cancelled) return;
        setContent(res.data.content || '');
        setTitle(res.data.title || '');
      } catch (error) {
        console.error('获取博客详情失败:', error);
        messageApi.error('文章加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, messageApi]);

  return (
    <div className='editor-page'>
      {contextHolder}
      {/* 编辑模式下，回显完成前显示 loading，避免一闪而过的空白 */}
      {loading ? (
        <div
          className='editor-card'
          style={{ textAlign: 'center', padding: 80 }}
        >
          文章加载中...
        </div>
      ) : (
        <div className='editor-card'>
          {/* 顶部标题栏 */}
          <header className='editor-card__header'>
            <div className='editor-card__title-group'>
              <span className='editor-card__icon'>
                <EditOutlined />
              </span>
              <div>
                <h1 className='editor-card__title'>
                  {id ? '编辑文章' : '发布新文章'}
                </h1>
                <p className='editor-card__subtitle'>
                  {id ? '修改你的文章内容' : '把你的想法写下来，分享给更多人'}
                </p>
              </div>
            </div>

            {/* 右上角"草稿 / 发布"状态徽标，仅展示 */}
            <span className='editor-card__badge'>未保存</span>
          </header>

          {/* 表单 */}
          <Form className='editor-form' layout='vertical' autoComplete='off'>
            {/* 文章标题 */}
            <Form.Item
              label={
                <span className='editor-form__label'>
                  <FileTextOutlined /> 文章标题
                </span>
              }
              // 注意：没有 name，避免 antd 接管这个 input
            >
              <Input
                className='editor-form__title-input'
                placeholder='给你的文章起个标题...'
                maxLength={80}
                showCount
                size='large'
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                }}
              />
            </Form.Item>

            {/* 文章分类 */}
            <Form.Item
              label={
                <span className='editor-form__label'>
                  <TagsOutlined /> 文章分类
                </span>
              }
            >
              <Select
                size='large'
                value={category}
                onChange={value => setCategory(value)}
                options={categories}
                className='editor-form__category'
              />
            </Form.Item>

            {/* 正文 */}
            <Form.Item
              label={
                <span className='editor-form__label'>
                  <FileTextOutlined /> 正文内容
                </span>
              }
              // 注意：没有 name，避免 antd 接管这个 textarea
            >
              <div className='editor-form__content editor-form__quill'>
                <Editor
                  defaultConfig={editorConfig}
                  value={content}
                  onChange={editorInstance => {
                    setContent(editorInstance.getHtml());
                  }}
                  onCreated={editorInstance => {
                    setEditor(editorInstance);
                    // 如果已经有内容，确保回显到 editor
                    try {
                      if (content) editorInstance.setHtml(content);
                    } catch (e) {
                      console.error('setHtml error:', e);
                    }
                  }}
                  onDestroyed={() => {
                    setEditor(null);
                  }}
                  mode='default'
                />
                {editor && (
                  <CustomToolbar editor={editor} config={toolbarConfig} />
                )}
              </div>
            </Form.Item>

            {/* 底部操作栏 */}
            <div className='editor-form__actions'>
              <Button
                size='large'
                icon={<CloseOutlined />}
                className='editor-form__btn editor-form__btn--cancel'
                onClick={() => navigate(-1)} //← 等你接
              >
                取消
              </Button>

              <div className='editor-form__actions-right'>
                {/* 保存草稿（仅 UI）,如果是已经发布的 */}
                <Button
                  size='large'
                  className='editor-form__btn editor-form__btn--draft'
                  onClick={saveDraft}
                >
                  保存草稿
                </Button>
                <Button
                  type='primary'
                  size='large'
                  icon={<CheckOutlined />}
                  className='editor-form__btn editor-form__btn--submit'
                  // htmlType='submit'
                  loading={submitting} // ✅ 提交中禁用，防止重复点
                  onClick={() => {
                    handleSubmit(false);
                  }}
                >
                  发布文章
                  {/* {id ? '保存修改' : '发布文章'} */}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
