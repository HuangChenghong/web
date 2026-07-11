# ============================================================
# Node.js 后端 Dockerfile
# 放路径：backend/Dockerfile
# ============================================================

# ---- 构建阶段（可选用，比如有 TypeScript 需要编译） ----
# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# ---- 运行阶段 ----
FROM node:18-alpine

# 装个时区数据和 wget（健康检查用）
RUN apk add --no-cache tzdata wget \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

ENV TZ=Asia/Shanghai
ENV NODE_ENV=production

WORKDIR /app

# 先复制 package 文件，利用 Docker 缓存
# 依赖没变就不会重新 npm install
COPY package*.json ./

# 只装生产依赖，省空间
RUN npm ci --only=production \
    && npm cache clean --force

# 复制源代码
COPY . .

# 暴露端口（只是声明，实际靠 docker-compose 的 expose）
EXPOSE 3000

# 启动命令
# 根据你的项目入口文件改：
#   - Express:     node src/index.js
#   - NestJS:      node dist/main.js
#   - Next.js:     node server.js
#   - PM2 集群:    pm2-runtime start ecosystem.config.js
CMD ["node", "src/index.js"]
