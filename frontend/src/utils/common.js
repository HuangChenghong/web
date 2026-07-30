// 格式化发布时间
export const formatDate = value => {
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
