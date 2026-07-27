/**
 * 清理 uploads/ 里没有任何用户引用的孤儿文件
 *
 * 用法:
 *   node scripts/clean-orphans.js          真正删除
 *   node scripts/clean-orphans.js --dry    只预览不删（推荐先用这个）
 *
 * 定时执行（Windows 任务计划程序）:
 *   程序: node
 *   参数: C:\...\web\backend\scripts\clean-orphans.js
 *   触发器: 每周日凌晨 3 点
 */
const fs = require('fs');
const path = require('path');
const { dbquery } = require('../db');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DRY_RUN = process.argv.includes('--dry');

(async () => {
  console.log(DRY_RUN ? '🔍 [预览模式] 不真正删除' : '🗑️  [清理模式] 开始清理');
  console.log('   扫描目录:', UPLOADS_DIR);
  console.log('');

  try {
    // 1. 读 uploads 目录里所有文件
    const files = await fs.promises.readdir(UPLOADS_DIR).catch(() => []);
    if (!files.length) {
      console.log('uploads 目录是空的，没什么好清理的');
      process.exit(0);
    }

    // 2. 查出数据库里所有被引用的相对路径（这里要按你实际字段名）
    const rows = await dbquery(
      'SELECT avater FROM user WHERE avater IS NOT NULL'
    );
    const used = new Set(rows.map(r => r.avater.replace(/^\//, '')));

    // 如果以后 articles 表也有封面图，把下面这行打开：
    // const arts = await dbquery("SELECT cover FROM articles WHERE cover IS NOT NULL");
    // arts.forEach(r => r.cover && used.add(r.cover.replace(/^\//, '')));

    // 3. 比对
    let kept = 0;
    let removed = 0;
    const orphans = [];

    for (const f of files) {
      const rel = `uploads/${f}`;
      if (used.has(rel)) {
        kept++;
      } else {
        orphans.push(f);
      }
    }

    if (orphans.length === 0) {
      console.log(`✅ 扫描完成：保留 ${kept} 个，无孤儿文件`);
      process.exit(0);
    }

    // 4. 打印待删文件清单
    console.log(`⚠️  发现 ${orphans.length} 个孤儿文件：`);
    orphans.forEach(f => console.log('   -', f));
    console.log('');

    // 5. 真正删除
    if (!DRY_RUN) {
      for (const f of orphans) {
        await fs.promises
          .unlink(path.join(UPLOADS_DIR, f))
          .then(() => {
            console.log('   ✅ 已删:', f);
            removed++;
          })
          .catch(err => {
            console.warn('   ❌ 删失败:', f, err.message);
          });
      }
      console.log(`\n🎉 完成：保留 ${kept} 个，删除 ${removed} 个`);
    } else {
      console.log(`💡 预览结束，确认无误后去掉 --dry 真正执行`);
    }
    process.exit(0);
  } catch (err) {
    console.error('清理失败:', err);
    process.exit(1);
  }
})();
