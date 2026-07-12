// 导入 promise 版 API
const mysql = require('mysql2/promise');
// *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

// 使用连接池处理连接,  连接池只初始化一次（全局单例，只创建1个池）,那个配置也可以单独拿出来，根据环境来配置
const isProd = process.env.NODE_ENV === 'production';
const pool = mysql.createPool({
  host: isProd ? process.env.DB_HOST : '127.0.0.1',        // 来自 .env：mysql
  user: isProd ? process.env.DB_USER : 'root',        // 来自 .env：myapp_user
  password: isProd ? process.env.DB_PASSWORD : '123456',// 来自 .env
  port: isProd ? process.env.DB_PORT : 3308,        // 来自 .env：3306
  database: isProd ? process.env.DB_NAME : 'blog',    // 来自 .env：blog
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
const dbquery = async (sql, params = []) => {
  try {
    // 普通de，不是sql注入的预处理语句
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
  dbquery
};
