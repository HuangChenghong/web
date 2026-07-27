/**
 * 清理 uploads/ 目录中没有被任何用户引用的"孤儿文件"
 *
 * 什么是孤儿文件？
 * 当用户更换头像时，旧头像文件会留在 uploads/ 目录中，但数据库里已经没有引用了
 * 这些没人用的文件就是孤儿文件，占用磁盘空间，需要定期清理
 *
 * 用法:
 *   node scripts/clean-orphans.js          真正删除（小心使用！）
 *   node scripts/clean-orphans.js --dry    只预览不删（推荐先用这个确认）
 *
 * 定时执行（Windows 任务计划程序）:
 *   程序: node
 *   参数: C:\...\web\backend\scripts\clean-orphans.js
 *   触发器: 每周日凌晨 3 点
 */

// 引入 Node.js 内置模块
const fs = require('fs'); // 文件系统操作（读文件、删文件等）
const path = require('path'); // 路径处理（拼接路径、解析路径等）
const { dbquery } = require('../db'); // 引入数据库查询函数

// 定义 uploads 目录的完整路径
// __dirname 是当前脚本所在目录（scripts/）
// '..' 表示上一级目录（backend/）
// 'uploads' 就是我们要扫描的文件夹
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// 判断是否为"预览模式"
// process.argv 是命令行参数数组，比如 ["node", "clean-orphans.js", "--dry"]
// 如果包含 "--dry" 参数，就开启预览模式（只看哪些文件会被删，不真正删除）
const DRY_RUN = process.argv.includes('--dry');

// 使用立即执行异步函数（IIFE），这样可以在里面使用 await
(async () => {
  // 打印当前模式和扫描目录，让用户知道脚本在做什么
  console.log(DRY_RUN ? '🔍 [预览模式] 不真正删除' : '🗑️  [清理模式] 开始清理');
  console.log('   扫描目录:', UPLOADS_DIR);
  console.log('');

  try {
    /**
     * 步骤1：递归读取 uploads 目录下所有文件
     *
     * 为什么要递归？
     * 因为现在头像上传会按日期创建子文件夹，比如 uploads/2026-07-27/xxx.png
     * 只用 fs.readdir 只能读到顶层文件（如 2026-07-27 文件夹），读不到里面的图片
     * 所以需要递归遍历所有子目录，找到真正的图片文件
     *
     * 参数:
     *   dir - 当前要扫描的目录路径
     * 返回:
     *   一个数组，包含所有文件的完整路径
     */
    const getAllFiles = async dir => {
      // 读取当前目录下的所有内容（文件和文件夹）
      // withFileTypes: true 表示返回的是 fs.Dirent 对象，可以判断是文件还是文件夹
      // fs.promises.readdir 是 Node.js 用来 读取目录内容 的方法。
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      // entries= [
      //   Dirent {
      //     name: '2026-7-27',
      //     parentPath: 'C:\\Users\\Administrator\\Desktop\\python\\web\\backend\\upload
      // s',
      //     Symbol(type): 2
      //   }
      // ]
      // entries= [
      //   Dirent {
      //     name: '1785143749427-0.gdenp0xsumr.png',
      //     parentPath: 'C:\\Users\\Administrator\\Desktop\\python\\web\\backend\\upload
      // s\\2026-7-27',
      //     Symbol(type): 1
      //   },
      // ]

      console.log('entries=', entries); // 打印所有文件和文件夹
      // 用来存放所有找到的文件路径
      const files = [];

      // 遍历每一项
      for (const entry of entries) {
        // 拼接完整路径：当前目录 + 文件名/文件夹名
        const fullPath = path.join(dir, entry.name);

        // 如果是文件夹，就递归调用 getAllFiles，继续深入扫描
        if (entry.isDirectory()) {
          // ...(await getAllFiles(fullPath)) 展开数组，把里面的文件路径一个个加进来
          files.push(...(await getAllFiles(fullPath)));
        } else {
          // 如果是文件，直接把完整路径加到数组里
          files.push(fullPath);
        }
      }

      // 返回所有找到的文件路径，绝对路径
      return files;
    };

    // 调用递归函数，获取 uploads 目录下所有文件
    const allFiles = await getAllFiles(UPLOADS_DIR).catch(() => []);
    console.log('allFiles=所有的文件路径的集合Array', allFiles);

    // 如果没有找到任何文件，说明 uploads 目录是空的，直接退出
    if (!allFiles.length) {
      console.log('uploads 目录是空的，没什么好清理的');
      process.exit(0); // 退出程序，0 表示正常退出
    }

    /**
     * 步骤2：从数据库中查出所有正在被使用的头像路径
     *
     * 我们的 user 表有一个 avater 字段，存储的是头像的相对路径
     * 比如 /uploads/2026-07-27/xxx.png
     *
     * 我们要把这些路径收集起来，建立一个"已使用文件"的集合
     */
    const rows = await dbquery(
      'SELECT avater FROM user WHERE avater IS NOT NULL'
    );

    // 把数据库里的路径处理一下：去掉开头的 "/"，然后放到 Set 里
    // Set 是一种数据结构，查找速度非常快（O(1)），适合用来做"存在性检查"
    // 比如 used.has('uploads/2026-07-27/xxx.png') 可以瞬间判断这个文件是否被使用
    const used = new Set(rows.map(r => r.avater.replace(/^\//, '')));
    console.log('used=所有正在被使用的头像路径集合', used);
    // Set(3) {
    //   'uploads/2026-7-27/1785146293551-0.4l7vezhduno.png',
    //   'uploads/2026-7-27/1785143749427-0.gdenp0xsumr.png',
    //   'uploads/2026-7-27/1785146849012-0.8agbbo5e46i.png'
    // }

    /**
     * 如果以后 articles 表也有封面图，把下面的代码打开
     * 原理和上面一样：从数据库查出所有封面图路径，加到 used 集合里
     */
    // const arts = await dbquery("SELECT cover FROM articles WHERE cover IS NOT NULL");
    // arts.forEach(r => r.cover && used.add(r.cover.replace(/^\//, '')));

    /**
     * 步骤3：比对文件，找出孤儿文件
     *
     * 遍历所有文件，判断每个文件是否在 used 集合中
     * 如果在，说明正在被使用，保留
     * 如果不在，说明是孤儿文件，标记为待删除
     */
    let kept = 0; // 计数器：保留的文件数量
    let removed = 0; // 计数器：删除的文件数量
    const orphans = []; // 数组：存放所有孤儿文件的完整路径

    // 遍历每一个文件
    for (const fullPath of allFiles) {
      /**
       * 计算文件的相对路径
       *
       * fullPath 是完整路径，比如 C:\xxx\web\backend\uploads\2026-07-27\xxx.png
       * 我们需要把它转换成相对于 backend/ 的路径，比如 uploads/2026-07-27/xxx.png
       * 这样才能和数据库里存储的路径格式一致，进行比对
       *
       * path.relative(基准路径, 当前路径) 返回相对路径
       * .replace(/\\/g, '/') 把 Windows 的反斜杠 \ 换成正斜杠 /
       */
      const rel = path
        .relative(path.join(__dirname, '..'), fullPath)
        .replace(/\\/g, '/');

      console.log('rel=', rel);
      // 把文件处理成和数据库保存的一样格式
      // rel= uploads/2026-7-27/1785143749427-0.gdenp0xsumr.png

      // 检查这个相对路径是否在 used 集合中
      if (used.has(rel)) {
        // 在集合中，说明被使用了，计数器加1
        kept++;
      } else {
        // 不在集合中，说明是孤儿文件，加到待删除数组里
        orphans.push(fullPath);
      }
    }

    // 如果没有孤儿文件，打印结果并退出
    if (orphans.length === 0) {
      console.log(`✅ 扫描完成：保留 ${kept} 个，无孤儿文件`);
      process.exit(0);
    }

    /**
     * 步骤4：打印待删除文件清单
     *
     * 在真正删除之前，让用户看到哪些文件会被删除
     * 特别是在清理模式下，这一步非常重要，避免误删文件
     */
    console.log(`⚠️  发现 ${orphans.length} 个孤儿文件：`);
    orphans.forEach(f => console.log('   -', f));
    console.log('');

    /**
     * 步骤5：真正删除文件
     *
     * 如果不是预览模式，就遍历孤儿文件数组，逐个删除
     */
    if (!DRY_RUN) {
      for (const f of orphans) {
        // 使用 fs.promises.unlink 删除文件
        // .then() 是删除成功后的回调
        // .catch() 是删除失败后的回调（比如文件已被其他程序占用）
        await fs.promises
          .unlink(f)
          .then(() => {
            console.log('   ✅ 已删:', f);
            removed++; // 删除成功，计数器加1
          })
          .catch(err => {
            // 删除失败，打印警告信息，但不中断整个脚本
            console.warn('   ❌ 删失败:', f, err.message);
          });
      }

      // 删除完成后，打印统计结果
      console.log(`\n🎉 完成：保留 ${kept} 个，删除 ${removed} 个`);
    } else {
      // 如果是预览模式，提示用户去掉 --dry 参数来真正执行删除
      console.log(`💡 预览结束，确认无误后去掉 --dry 真正执行`);
    }

    // 正常退出程序
    process.exit(0);
  } catch (err) {
    // 如果整个过程中出现任何错误（比如数据库连接失败），打印错误信息并退出
    console.error('清理失败:', err);
    process.exit(1); // 1 表示异常退出
  }
})();
