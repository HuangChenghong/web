const path = require('path');
function resolve(dir) {
  return path.resolve(__dirname, dir);
}

module.exports = {
  // 1. devServer开发服务器（代理、端口、跨域都在这里配，替代setupProxy.js）
  devServer: {
    port: 3001, // 修改启动端口
    open: true, // 自动打开浏览器
    proxy: {
      // 接口转发，不用写setupProxy.js了
      '/api': {
        target: 'http://localhost:8000/', // 代理地址
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      },
    }
  },

  // 2. webpack配置（路径别名、插件、loader）
  webpack: {
    alias: {
      '@': resolve('src') // 导入时直接 import xxx from '@/pages'
    }
  },

  // 3. 样式配置less/sass、babel、eslint等
  style: {
    sass: {}
  }
};
