// 导入 promise 版 API
const mysql = require('mysql2/promise');

async function singleConnDemo(sql, params = []) {
  let conn; // 提前声明连接变量，catch里也能访问到
  try {
    // 1. 创建并连接数据库
    conn = await mysql.createConnection({
      host: '127.0.0.1', // 数据库地址
      port: 3306, // mysql端口
      user: 'root', // 账号
      password: '123456', // 密码
      database: 'test' // 要连接的库名
    });
    // 有sql注入漏洞，推荐用execute预处理语句
    // const [rows, fields] = await conn.query(sql, params);
    // 2. 使用 execute 预处理语句，更安全
    const [rows] = await conn.execute(sql, params);
    console.log('查询结果：', rows);
    return rows;
  } catch (err) {
    // 打印完整错误日志
    console.error(
      '数据库操作失败：',
      err.message,
      'SQL:',
      sql,
      '参数:',
      params
    );
    throw err; // 向上抛出，交给上层业务处理
  } finally {
    // 3. 无论成功失败，一定会关闭连接，杜绝连接泄漏
    if (conn) {
      await conn.end();
      console.log('临时数据库连接已关闭');
    }
  }
}
// *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

// 使用连接池处理连接,  连接池只初始化一次（全局单例，只创建1个池）,那个配置也可以单独拿出来，根据环境来配置
const pool = mysql.createPool({
  host: '127.0.0.1', // Windows 上 localhost 偶尔会被解析到 IPv6，改成 127.0.0.1 更稳
  user: 'root',
  password: '123456',
  port: 3308, // mysql端口
  database: 'blog', //数据库的名字
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
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
  dbquery,
  singleConnDemo
};
