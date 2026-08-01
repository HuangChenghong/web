# ============================================================
# 前端 Dockerfile（React + CRACO）
# 构建：craco build  产物：build/ 目录
# ============================================================

# ---- 阶段1：构建 ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
# ↑ craco build 会产出 ./build 目录

# ---- 阶段2：用 nginx serve 静态文件 ----
FROM nginx:1.27-alpine

# 【2026-08-01 改】直接修改默认配置，不 COPY 外部 nginx.conf
# 原因：原来 COPY nginx.conf /etc/nginx/conf.d/，但前端目录根本没有这个文件，build 会失败
# 这里用 sed 改默认配置，加上 SPA fallback（你用 BrowserRouter 必须有）
# 默认配置是 try_files $uri $uri/ =404，浏览器刷新非 / 路径会 404
RUN sed -i 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.html;|' /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]