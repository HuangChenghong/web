const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置图片存储规则（按日期分目录，避免重名覆盖）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const dayDir = date.toLocaleDateString().replace(/[\\/]/g, '-');
    const fullPath = path.join('./uploads', dayDir);
    // 不存在目录就递归创建,recursive: true：哪怕没有uploads文件夹，也会自动创建
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath); // 保存目录
  },
  filename: (req, file, cb) => {
    // 时间戳+后缀，避免重名覆盖图片
    const suffix = path.extname(file.originalname); //截取文件后缀
    const fileName = Date.now() + '-' + Math.random().toString(36) + suffix;
    cb(null, fileName);
  }
});

// 限制：仅图片、最大5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // 在 multer 配置里加 `fileFilter` 过滤非法文件，只允许上传图片格式
    const allowImg = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (allowImg.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持jpg/png/webp/gif/bmp图片'), false);
  }
});

// 根据上传的文件计算可访问的 URL（与 storage 的日期目录规则保持一致）
const buildImageUrl = file => {
  if (!file) return null;
  const date = new Date();
  const dayDir = date.toLocaleDateString().replace(/[\\/]/g, '-');
  return `/uploads/${dayDir}/${file.filename}`;
};

// 安全删除 uploads 目录下的文件（防路径遍历攻击）
const safeDeleteFile = relativePath => {
  if (!relativePath) return;
  const filePath = path.join(__dirname, '..', ...relativePath.split('/').slice(1));
  const uploadsDir = path.join(__dirname, '..', 'uploads') + path.sep;
  if (filePath.startsWith(uploadsDir)) {
    fs.unlink(filePath, err => {
      if (err) {
        console.warn('[file] 删除失败:', relativePath, err.message);
      }
    });
  }
};

module.exports = { upload, storage, buildImageUrl, safeDeleteFile };
