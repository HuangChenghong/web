# Docker MySQL 时区修复文档

## 一、问题现象

- 数据库中 `createdAt`、`updatedAt` 等时间字段比实际北京时间少 8 小时
- 接口返回的时间格式是 `2026-07-29T15:07:32.000Z`（UTC 格式，带 Z 后缀）
- 期望：时间正确显示为北京时间 `2026-07-29 23:07:32`

## 二、根本原因

1. **MySQL 服务器时区是 UTC**（Docker 镜像默认时区是 UTC）
   - `CURRENT_TIMESTAMP` 写入时用的是 UTC 时间
   - `TIMESTAMP` 类型字段存储时也会转换为 UTC

2. **mysql2 驱动默认把时间字段转为 JS Date 对象**
   - `res.json()` 序列化 Date 对象时会输出 UTC 格式（带 `T` 和 `Z`）

## 三、解决方案（三层修复）

### 第一层：MySQL 服务器时区（根本修复）

> 让 MySQL 写入和读取都用东八区时间

#### 1. 查看当前时区

```sql
-- 在 Navicat 或命令行执行
SELECT NOW() AS current_time, UTC_TIMESTAMP() AS utc_time;
SELECT @@time_zone AS session_tz, @@global.time_zone AS global_tz;
```

如果 `NOW()` 和 `UTC_TIMESTAMP()` 返回值相同，说明 MySQL 时区是 UTC。

#### 2. Docker 容器内修改配置文件（永久生效）

```powershell
# 1. 查看容器名称
docker ps

# 2. 在容器内创建时区配置文件
docker exec mysql bash -c "printf '[mysqld]\ndefault-time-zone = +08:00\n' > /etc/mysql/conf.d/timezone.cnf"

# 3. 验证配置文件内容
docker exec mysql cat /etc/mysql/conf.d/timezone.cnf

# 4. 重启 MySQL 容器使配置生效
docker restart mysql

# 5. 等待 10 秒后验证
Start-Sleep -Seconds 10
docker exec mysql mysql -uroot -p123456 -e "SELECT NOW() AS now_time, @@time_zone AS tz;"
```

#### 3. 验证结果

```
now_time: 2026-07-29 23:55:00  ✅ 北京时间
tz: +08:00                      ✅ 时区已生效
```

#### 4. 临时修复方式（重启容器后失效，不推荐）

```sql
-- 在 Navicat 执行，立即生效但容器重启后失效
SET GLOBAL time_zone = '+08:00';
SET time_zone = '+08:00';
```

---

### 第二层：后端 db.js 配置（格式修复）

> 让接口返回时间字符串而非 UTC 格式的 Date 对象

#### 修改文件：`web/backend/db.js`

```javascript
const pool = mysql.createPool({
  // ... 其他配置

  // ⬇️ 时区配置：
  // timezone: 读取时用东八区时间返回
  timezone: '+08:00',

  // typeCast: 把时间字段转为字符串而非 JS Date 对象
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
```

#### 各配置的作用

| 配置项                  | 作用                           | 不配置的后果                         |
| ----------------------- | ------------------------------ | ------------------------------------ |
| `timezone: '+08:00'`    | 连接级时区，读取时用东八区返回 | 读取的时间是 UTC                     |
| `typeCast`              | 时间字段转为字符串             | 返回 `2026-07-29T11:43:20.000Z` 格式 |
| `pool.on('connection')` | 每个新连接设置会话时区         | 连接池复用时可能时区不对             |

---

### 第三层：修复旧数据

> 已经存错的旧数据需要手动修复

```sql
-- 1. 先检查旧数据偏差（确认是否少了 8 小时）
SELECT id, createdAt, updatedAt, NOW() AS current_time
FROM articles
ORDER BY id DESC
LIMIT 10;

-- 2. 修复 articles 表（时间加 8 小时）
UPDATE articles
SET createdAt = DATE_ADD(createdAt, INTERVAL 8 HOUR),
    updatedAt = DATE_ADD(updatedAt, INTERVAL 8 HOUR)
WHERE createdAt < '2030-01-01';

-- 3. 如果有其他表也需要修复，替换表名和字段名即可
-- UPDATE comments SET createdAt = DATE_ADD(createdAt, INTERVAL 8 HOUR) WHERE createdAt < '2030-01-01';
-- UPDATE article_collection SET createdAt = DATE_ADD(createdAt, INTERVAL 8 HOUR) WHERE createdAt < '2030-01-01';
```

---

## 四、验证步骤

1. **重启后端服务**（加载新的 db.js 配置）

   ```powershell
   cd c:\Users\Administrator\Desktop\python\web\backend
   npm start
   ```

2. **创建一篇新文章**，检查数据库中的时间是否正确

3. **查看接口返回**，确认时间格式是 `2026-07-29 23:07:32`（不带 T 和 Z）

4. **检查旧数据**，确认修复后时间正确

## 五、注意事项

1. **不要用 `new Date().toISOString()`** 手动设置时间
   - 这个方法返回 UTC 时间，不是本地时间
   - 让 MySQL 的 `CURRENT_TIMESTAMP` 自动处理即可

2. **不要在代码里手动处理时间**
   - 配置好 MySQL 和 db.js 后，所有表的时间字段都会自动正确
   - 不需要每个接口都写时间转换逻辑

3. **Docker 容器删除后配置会丢失**
   - 如果用 `docker rm` 删除容器再重新 `docker run`，配置文件会丢失
   - 建议用 `docker-compose` 管理容器，配置写在 `docker-compose.yml` 中：

   ```yaml
   services:
     mysql:
       image: mysql:8.4
       command: --default-time-zone='+08:00'
       environment:
         - MYSQL_ROOT_PASSWORD=123456
       ports:
         - '3308:3306'
       volumes:
         - mysql_data:/var/lib/mysql

   volumes:
     mysql_data:
   ```

4. **MySQL 8.4 与 8.0 的区别**
   - MySQL 8.4 默认时区仍然是 SYSTEM（取决于系统时区）
   - Docker 镜像的系统时区默认是 UTC
   - 所以必须显式设置 `default-time-zone = '+08:00'`
