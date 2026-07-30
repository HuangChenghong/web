import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Form, Input, Button, message, Select, Upload } from 'antd';
import { Editor } from '@wangeditor/editor-for-react';
import { createToolbar } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import {
  EditOutlined,
  CloseOutlined,
  CheckOutlined,
  FileTextOutlined,
  TagsOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addBlog, getBlogDetail, editBlog, getCategories } from '@/api/blog';
import request from '@/api/request';

import './article-editor.css';

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
  const [category, setCategory] = useState(1);
  const [thumb, setThumb] = useState(''); // 封面图 URL
  const [desc, setDesc] = useState(''); // 文章摘要
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // 封面上传中状态
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef(null);

  // ⬇️ 用 useMemo 缓存 editorConfig，避免每次渲染都创建新对象导致配置丢失
  const editorConfig = useMemo(
    () => ({
      placeholder: '开始书写你的内容...',
      // ⬇️ 图片上传配置（wangEditor v5 配置格式）
      MENU_CONF: {
        uploadImage: {
          // 上传接口地址（通过代理访问后端）
          // ⚠️ 路由在 users.js，注册在 /api/users，所以完整路径是 /api/users/upload/image
          server: '/api/users/upload/image',
          // 上传参数名
          fieldName: 'file',
          // 单个文件最大体积（5MB）
          maxFileSize: 5 * 1024 * 1024,
          // 最多可上传几个文件
          maxNumberOfFiles: 5,
          // 允许的文件类型
          allowedFileTypes: ['image/*'],
          // 自定义返回数据获取图片 URL
          customInsert(res, insertFn) {
            // 后端返回格式：{ code: 200, data: { url: '/uploads/xxx.png' } }
            if (res.code === 200 && res.data?.url) {
              insertFn(res.data.url, '', res.data.url);
            }
          },
          // 上传成功回调
          onSuccess(file, res) {
            console.log(`${file.name} 上传成功`, res);
          },
          // 上传失败回调
          onFailed(file, res) {
            console.log(`${file.name} 上传失败`, res);
          }
        }
      }
    }),
    []
  );

  // ⬇️ 用 useMemo 缓存 toolbarConfig
  const toolbarConfig = useMemo(
    () => ({
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
    }),
    []
  );

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

  useEffect(() => {
    getCategories().then(res => {
      const data = res.data.map(x => ({ value: x.id, label: x.name }));
      setCategories(data);
    });
  }, []);

  const handleSubmit = async (isDraft = false) => {
    // 没登录就别让提交
    if (!localStorage.getItem('userId')) {
      messageApi.warning('请先登录');
      return navigate('/login');
    }

    const data = {
      title,
      content,
      category_id: category,
      thumb,
      desc,
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

  // 封面上传处理 - 上传到服务器并获取 URL
  const handleCoverUpload = async file => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      messageApi.error('只能上传图片文件');
      return;
    }
    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      // 创建 FormData 并上传文件
      const formData = new FormData();
      formData.append('file', file);

      const res = await request.postFormData('/users/upload/image', formData);
      if (res.code === 200 && res.data?.url) {
        setThumb(res.data.url);
        messageApi.success('封面上传成功');
      } else {
        messageApi.error(res.msg || '封面上传失败');
      }
    } catch (err) {
      console.error('封面上传失败:', err);
      messageApi.error('封面上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 移除封面
  const handleRemoveCover = () => {
    setThumb('');
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
          setThumb(d.thumb || '');
          setDesc(d.desc || '');
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
        const res = await getBlogDetail(id, { status });
        if (cancelled) return;
        setContent(res.data.content || '');
        setTitle(res.data.title || '');
        setCategory(res.data.category_id || 1);
        setThumb(res.data.thumb || '');
        setDesc(res.data.description || '');
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
        <div className='editor-card' style={{ textAlign: 'center', padding: 80 }}>
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
                <h1 className='editor-card__title'>{id ? '编辑文章' : '发布新文章'}</h1>
                <p className='editor-card__subtitle'>{id ? '修改你的文章内容' : '把你的想法写下来，分享给更多人'}</p>
              </div>
            </div>
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

            {/* 封面图片 */}
            <Form.Item
              label={
                <span className='editor-form__label'>
                  <PictureOutlined /> 添加封面
                </span>
              }
              extra='建议尺寸 16:9，大小不超过 5MB'
            >
              <div className='editor-form__cover-uploader'>
                {uploading ? (
                  <div className='editor-form__cover-placeholder editor-form__cover-uploading'>
                    <UploadOutlined spin />
                    <span>上传中...</span>
                  </div>
                ) : thumb ? (
                  <div className='editor-form__cover-preview'>
                    <img src={thumb} alt='封面预览' />
                    <div className='editor-form__cover-actions'>
                      <Button size='small' icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                        更换封面
                      </Button>
                      <button type='button' className='editor-form__cover-remove' onClick={handleRemoveCover}>
                        <DeleteOutlined /> 移除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='editor-form__cover-placeholder' onClick={() => fileInputRef.current?.click()}>
                    <UploadOutlined />
                    <span>点击上传封面</span>
                    <small>支持 JPG、PNG 格式</small>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                    e.target.value = '';
                  }}
                  disabled={uploading}
                />
              </div>
            </Form.Item>

            {/* 文章描述 */}
            <Form.Item
              label={
                <span className='editor-form__label'>
                  <FileOutlined /> 文章描述
                </span>
              }
              extra='描述会在文章列表页展示，帮助读者快速了解内容（选填）'
            >
              <Input.TextArea
                className='editor-form__description'
                placeholder='给文章写一段简短的描述，让读者一眼了解内容...'
                maxLength={200}
                showCount
                autoSize={{ minRows: 2, maxRows: 4 }}
                value={desc}
                onChange={e => setDesc(e.target.value)}
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
                {editor && <CustomToolbar editor={editor} config={toolbarConfig} />}
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
                <Button size='large' className='editor-form__btn editor-form__btn--draft' onClick={saveDraft}>
                  撤销为草稿
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
