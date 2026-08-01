# ============================================================
# 后端 Dockerfile（Express + Node 20）
# 入口：bin/www   端口：8000
# ============================================================
# ---- 构建阶段（可选用，比如有 TypeScript 需要编译） ----
# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# ---- 阶段1：装依赖 ----
FROM node:20-alpine AS deps

WORKDIR /app

# 先复制 package 文件，利用 Docker 缓存
COPY package*.json ./

# 只装生产依赖（nodemon 在 devDependencies 里会被排除）
RUN npm ci --omit=dev

# ---- 阶段2：复制代码并运行 ----
FROM node:20-alpine

WORKDIR /app

# 从构建阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制全部源代码
COPY . .

# 关键！jade 模板需要这个目录存在（即使空的）
# Express 的 views 目录是 path.join(__dirname, 'views')
RUN mkdir -p ./views

# 创建上传目录（multer 写到这里）
RUN mkdir -p ./uploads

# 暴露端口（要和 bin/www 里默认的 PORT 一致）
EXPOSE 8000

# 启动命令（和 package.json 的 start 一样）
CMD ["node", "./bin/www"]

# **注释**：
# - `node:20-alpine`：~50MB，比完整 Node 镜像小 5 倍
# - `npm ci --omit=dev`：比 `npm install` 严格，只装 dependencies
# - `node ./bin/www`：你的 `package.json` 里 `start` 脚本就是这个，直接用
# - `EXPOSE 8000`：纯文档作用，告诉别人容器内部用什么端口