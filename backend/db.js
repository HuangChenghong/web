// 导入 promise 版 API
const mysql = require('mysql2/promise');

// 使用连接池处理连接,  连接池只初始化一次（全局单例，只创建1个池）,那个配置也可以单独拿出来，根据环境来配置
const pool = mysql.createPool({
  host: process.env.DB_HOST, // 来自 .env：mysql
  user: process.env.DB_USER, // 来自 .env：myapp_user
  password: process.env.DB_PASSWORD, // 来自 .env
  port: process.env.DB_PORT, // 来自 .env：3306
  database: process.env.DB_NAME, // 来自 .env：blog
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // ⬇️ 时区配置：
  // timezone: 读取时用东八区时间返回
  timezone: '+08:00',
  // typeCast: 把时间字段转为字符串而非 JS Date 对象，避免 res.json() 序列化时转成 UTC
  // 不配置的话，返回格式是 "2026-07-29T11:43:20.000Z"（UTC）
  // 配置后返回格式是 "2026-07-29 19:43:20"（本地时间字符串）
  typeCast: function (field, next) {
    if (field.type === 'TIMESTAMP' || field.type === 'DATETIME') {
      return field.string();
    }
    return next();
  }
});

// ⬇️ 关键：确保每个新连接的会话时区都设置为东八区
// 这样 CURRENT_TIMESTAMP 和 TIMESTAMP 字段都会用东八区时间
pool.on('connection', function (connection) {
  connection.query("SET time_zone = '+08:00'");
});

const dbquery = async (sql, params = []) => {
  try {
    // 普通query，不是sql注入的预处理语句
    const [rows] = await pool.query(sql, params);
    // console.log('查询结果：', rows);
    return rows;

    // 使用预处理语句的方法，节约性能
    // const [rows] = await pool.execute(sql, params);
    // console.log('查询结果：', rows);
    // return rows;
  } catch (error) {
    console.log('数据库查询错误：', error);
    throw error;
  }
};

module.exports = {
  dbquery,
  pool // 导出 pool 以便需要时直接使用
};
