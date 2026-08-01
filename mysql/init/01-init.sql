/*
 Navicat Premium Dump SQL

 Source Server         : blog
 Source Server Type    : MySQL
 Source Server Version : 80410 (8.4.10)
 Source Host           : 127.0.0.1:3308
 Source Schema         : blog

 Target Server Type    : MySQL
 Target Server Version : 80410 (8.4.10)
 File Encoding         : 65001

 Date: 31/07/2026 23:12:33
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for article_collection
-- ----------------------------
DROP TABLE IF EXISTS `article_collection`;
CREATE TABLE `article_collection`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `article_id` int NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_article`(`user_id` ASC, `article_id` ASC) USING BTREE,
  INDEX `article_collection_ibfk_2`(`article_id` ASC) USING BTREE,
  CONSTRAINT `article_collection_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `article_collection_ibfk_2` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_collection
-- ----------------------------
INSERT INTO `article_collection` VALUES (1, 4, 8, '2026-07-28 06:54:42');
INSERT INTO `article_collection` VALUES (2, 4, 7, '2026-07-28 07:26:44');
INSERT INTO `article_collection` VALUES (3, 4, 13, '2026-07-28 07:30:16');
INSERT INTO `article_collection` VALUES (7, 4, 12, '2026-07-28 07:48:38');
INSERT INTO `article_collection` VALUES (8, 7, 8, '2026-07-29 10:02:32');
INSERT INTO `article_collection` VALUES (9, 7, 14, '2026-07-29 11:20:06');
INSERT INTO `article_collection` VALUES (12, 7, 37, '2026-07-30 18:22:07');
INSERT INTO `article_collection` VALUES (13, 4, 37, '2026-07-31 03:09:39');
INSERT INTO `article_collection` VALUES (14, 5, 39, '2026-07-31 17:30:20');
INSERT INTO `article_collection` VALUES (15, 5, 37, '2026-07-31 20:26:50');
INSERT INTO `article_collection` VALUES (16, 5, 38, '2026-07-31 20:32:27');
INSERT INTO `article_collection` VALUES (17, 5, 34, '2026-07-31 20:32:32');
INSERT INTO `article_collection` VALUES (18, 5, 32, '2026-07-31 20:32:36');
INSERT INTO `article_collection` VALUES (20, 5, 25, '2026-07-31 20:33:32');
INSERT INTO `article_collection` VALUES (21, 5, 31, '2026-07-31 20:36:23');
INSERT INTO `article_collection` VALUES (22, 4, 40, '2026-07-31 21:20:47');

-- ----------------------------
-- Table structure for article_comment
-- ----------------------------
DROP TABLE IF EXISTS `article_comment`;
CREATE TABLE `article_comment`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `article_id` int NOT NULL,
  `parent_id` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reply_to_user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `article_id`(`article_id` ASC) USING BTREE,
  INDEX `parent_id`(`parent_id` ASC) USING BTREE,
  CONSTRAINT `article_comment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `article_comment_ibfk_2` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `article_comment_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `article_comment` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_comment
-- ----------------------------
INSERT INTO `article_comment` VALUES (1, 4, 1, NULL, '哈哈哈哈都是', '2026-07-31 14:47:07', '2026-07-31 14:47:07', NULL);
INSERT INTO `article_comment` VALUES (2, 4, 1, NULL, '不要啊', '2026-07-31 14:48:32', '2026-07-31 14:48:32', NULL);
INSERT INTO `article_comment` VALUES (3, 4, 1, NULL, '文章不错啊', '2026-07-31 15:12:27', '2026-07-31 15:12:27', NULL);
INSERT INTO `article_comment` VALUES (4, 4, 39, NULL, '我来看看你', '2026-07-31 15:19:55', '2026-07-31 15:19:55', NULL);
INSERT INTO `article_comment` VALUES (5, 5, 39, NULL, '今天天气不错，过来看看', '2026-07-31 15:20:33', '2026-07-31 15:20:33', NULL);
INSERT INTO `article_comment` VALUES (6, 5, 39, NULL, '哈哈哈', '2026-07-31 15:21:08', '2026-07-31 15:21:08', NULL);
INSERT INTO `article_comment` VALUES (7, 5, 39, NULL, '啦啦啦啦啦', '2026-07-31 15:27:32', '2026-07-31 15:27:32', NULL);
INSERT INTO `article_comment` VALUES (8, 5, 39, NULL, '是的发生的个', '2026-07-31 15:27:37', '2026-07-31 15:27:37', NULL);
INSERT INTO `article_comment` VALUES (9, 5, 39, NULL, '萨达故事大纲法第三方', '2026-07-31 15:27:40', '2026-07-31 15:27:40', NULL);
INSERT INTO `article_comment` VALUES (10, 5, 39, NULL, '哈哈哈', '2026-07-31 17:29:58', '2026-07-31 17:29:58', NULL);
INSERT INTO `article_comment` VALUES (11, 5, 40, NULL, '愿祖国繁荣富强！', '2026-07-31 17:43:36', '2026-07-31 17:43:36', NULL);
INSERT INTO `article_comment` VALUES (12, 5, 7, NULL, 'good', '2026-07-31 20:36:34', '2026-07-31 20:36:34', NULL);
INSERT INTO `article_comment` VALUES (13, 5, 40, 11, '112313123', '2026-07-31 21:18:50', '2026-07-31 21:18:50', 5);
INSERT INTO `article_comment` VALUES (14, 4, 40, NULL, '真好', '2026-07-31 21:21:37', '2026-07-31 21:21:37', NULL);

-- ----------------------------
-- Table structure for article_like
-- ----------------------------
DROP TABLE IF EXISTS `article_like`;
CREATE TABLE `article_like`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `article_id` int NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_article`(`user_id` ASC, `article_id` ASC) USING BTREE,
  INDEX `article_like_ibfk_2`(`article_id` ASC) USING BTREE,
  CONSTRAINT `article_like_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `article_like_ibfk_2` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of article_like
-- ----------------------------
INSERT INTO `article_like` VALUES (3, 7, 8, '2026-07-29 14:27:53');
INSERT INTO `article_like` VALUES (5, 7, 38, '2026-07-30 18:21:43');
INSERT INTO `article_like` VALUES (6, 7, 37, '2026-07-30 18:21:59');
INSERT INTO `article_like` VALUES (7, 7, 39, '2026-07-30 23:47:20');
INSERT INTO `article_like` VALUES (8, 4, 34, '2026-07-31 02:24:02');
INSERT INTO `article_like` VALUES (9, 4, 18, '2026-07-31 03:09:18');
INSERT INTO `article_like` VALUES (10, 4, 3, '2026-07-31 03:09:28');
INSERT INTO `article_like` VALUES (11, 4, 37, '2026-07-31 03:09:39');
INSERT INTO `article_like` VALUES (13, 5, 37, '2026-07-31 20:26:49');
INSERT INTO `article_like` VALUES (14, 5, 38, '2026-07-31 20:32:26');
INSERT INTO `article_like` VALUES (15, 5, 31, '2026-07-31 20:36:21');

-- ----------------------------
-- Table structure for articles
-- ----------------------------
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文章富文本内容',
  `user_id` int NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('1','2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '1' COMMENT '1:已发布，2:草稿',
  `category_id` int NULL DEFAULT NULL,
  `views` int NULL DEFAULT 0 COMMENT '浏览量',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `thumb` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of articles
-- ----------------------------
INSERT INTO `articles` VALUES (1, '第一个片文章', '我的第一个文章', 4, NULL, '2026-07-31 15:19:35', '1', 1, 30, NULL, NULL);
INSERT INTO `articles` VALUES (2, 'vue2.x学  哈哈哈', '<p>vue2.x 学习专用</p>', 4, NULL, '2026-07-31 14:07:07', '1', 2, 5, NULL, NULL);
INSERT INTO `articles` VALUES (3, '富文本123123666', '<p><strong>阿斯顿发12312312</strong><em><strong>313188899</strong></em></p>', 4, NULL, '2026-07-31 14:12:13', '2', 3, 25, '哈哈哈111111', '/uploads/2026-7-31/1785477140054-0.28gxl1xm4av.webp');
INSERT INTO `articles` VALUES (4, '4121', '<p>12121</p>', 5, NULL, '2026-07-31 01:55:26', '1', 4, 7, NULL, NULL);
INSERT INTO `articles` VALUES (5, '富文本sdfas asdfas', '<p><strong>阿斯顿发12312312</strong><em><strong>3131</strong></em></p>', 5, NULL, '2026-07-30 19:10:44', '1', 5, 4, NULL, NULL);
INSERT INTO `articles` VALUES (7, '草稿', '阿草稿草稿', 5, '2026-07-12 04:04:52', '2026-07-31 20:51:02', '1', 6, 10, NULL, NULL);
INSERT INTO `articles` VALUES (8, '拉萨京东方啦时代峰峻2026年7月27日00:30:46', '<p>阿斯顿发山东噶事 2026年7月27日00:30:50</p>', 5, '2026-07-12 04:11:07', '2026-07-31 02:26:21', '1', 2, 20, NULL, NULL);
INSERT INTO `articles` VALUES (9, '我创建一个草稿', '<p>我是草稿</p>', 5, NULL, '2026-07-31 20:59:03', '2', 1, 3, '', '/uploads/2026-7-31/1785502667339-0.5wkbzr41593.webp');
INSERT INTO `articles` VALUES (10, '124245', '456456465', 5, NULL, '2026-07-31 02:26:20', '1', 2, 3, NULL, NULL);
INSERT INTO `articles` VALUES (11, '湿哒哒', '<p>防守打法</p>', 6, NULL, NULL, '2', 2, 0, NULL, NULL);
INSERT INTO `articles` VALUES (12, '2026年7月28日00:07:11', '<p>我是2026年7月28日00:07:20</p>', 6, NULL, '2026-07-31 20:33:18', '1', 3, 1, NULL, NULL);
INSERT INTO `articles` VALUES (13, '我是admin', '<p>我是admin创建 2026年7月28日00:09:20</p><p>今天好热</p><p>希望有一个美好的未来</p>', 4, NULL, '2026-07-31 14:07:03', '1', 4, 2, NULL, NULL);
INSERT INTO `articles` VALUES (14, 'asdfadsf ', '<p>asdfasdgasdgfsadg</p>', 7, NULL, '2026-07-31 20:26:09', '1', 5, 6, NULL, NULL);
INSERT INTO `articles` VALUES (15, 'sdafdasf ', '<p>asdfasfas</p>', 7, NULL, '2026-07-30 21:10:35', '1', 6, 4, NULL, NULL);
INSERT INTO `articles` VALUES (17, '我是一个文章', '<p>牛逼</p>', 7, NULL, '2026-07-31 00:14:04', '1', 1, 5, 'sdfsadggsdgsd', '');
INSERT INTO `articles` VALUES (18, '我是管理员大爷', '<p>2026年7月29日22:47:34</p>', 4, NULL, '2026-07-31 03:09:07', '1', NULL, 3, NULL, NULL);
INSERT INTO `articles` VALUES (21, '2026年7月29日23:04:57', '<p>2026年7月29日23:05:01</p>', 4, '2026-07-29 23:05:03', '2026-07-30 19:11:07', '1', NULL, 1, NULL, NULL);
INSERT INTO `articles` VALUES (22, '2026年7月29日23:06:46', '<p>2026年7月29日23:06:49</p>', 4, '2026-07-29 23:06:53', '2026-07-30 19:10:35', '1', NULL, 2, NULL, NULL);
INSERT INTO `articles` VALUES (23, '2 2026年7月29日23:07:13', '<p>2026年7月29日23:07:24</p>', 4, '2026-07-29 23:07:25', '2026-07-30 19:09:21', '1', NULL, 2, NULL, NULL);
INSERT INTO `articles` VALUES (24, '32026年7月29日23:07:32', '<p>2026年7月29日23:07:34</p>', 4, '2026-07-29 23:07:35', '2026-07-29 23:07:35', '1', NULL, 0, NULL, NULL);
INSERT INTO `articles` VALUES (25, '4 2026年7月29日23:10:33', '<p>2026年7月29日23:10:36</p>', 4, '2026-07-29 23:10:37', '2026-07-31 20:33:31', '1', NULL, 1, NULL, NULL);
INSERT INTO `articles` VALUES (26, '72026年7月29日23:34:24', '<p>2026年7月29日23:34:28</p>', 4, '2026-07-29 23:34:29', '2026-07-29 23:35:34', '1', NULL, 1, NULL, NULL);
INSERT INTO `articles` VALUES (27, '2026年7月29日23:35:51 发一个文章', '<h2><strong>我是标题</strong></h2><ol><li>我是谁</li><li>我今天没出门</li><li>今天运动减肥了</li></ol>', 4, '2026-07-29 23:37:15', '2026-07-31 14:33:44', '1', NULL, 3, NULL, NULL);
INSERT INTO `articles` VALUES (28, '2026年7月29日23:40:58', '<p>我的时间还在吗</p><ul><li><strong>2</strong><span style=\"color: rgb(225, 60, 57);\"><strong>026年7月29日23:</strong></span><strong>41:09</strong></li></ul>', 4, '2026-07-29 23:41:46', '2026-07-30 19:17:51', '1', NULL, 5, NULL, NULL);
INSERT INTO `articles` VALUES (29, '撒旦法撒旦法001233', '<p>撒旦<strong>法萨芬001 002</strong></p>', 4, '2026-07-29 23:55:28', '2026-07-30 00:21:40', '1', 4, 2, NULL, NULL);
INSERT INTO `articles` VALUES (30, '收到胜多负少', '<p>撒旦法时代</p>', 4, '2026-07-30 00:01:51', '2026-07-31 20:56:34', '1', NULL, 6, NULL, NULL);
INSERT INTO `articles` VALUES (31, '促进团结奋斗 汇聚磅礴力量', '<p>促进团结奋斗 汇聚磅礴力量</p><p>实现中华民族伟大复兴，需要海内外中华儿女共同努力，做好侨务工作至关重要。</p><p>“全面贯彻党的侨务政策，紧紧围绕党和国家工作大局，更好凝聚侨心侨力”“积极服务祖国统一大业，促进海内外中华儿女团结奋斗”，习近平总书记近日对侨务工作作出重要指示，为做好新时代新征程侨务工作指明了方向、提供了重要遵循。</p><p>7月27日至28日，全国侨务工作会议在北京召开，对我国侨务工作作出具体部署。</p><p>侨务工作是党和国家的一项长期性战略性工作。越是朝着强国建设、民族复兴的目标砥砺前行，越要把广大海外侨胞和归侨侨眷紧密团结起来、力量汇聚起来。</p><p>党的十八大以来，以习近平同志为核心的党中央统筹国内国际两个大局，对做好侨务工作、凝聚侨心侨力同圆共享中国梦作出新的部署、提出新的要求，开创侨务工作新局面，有力促进了海内外中华儿女大团结，为中国式现代化作出了积极贡献。</p><p>看推动国家经济社会发展。从设立广东汕头华侨经济文化合作试验区，到出台外商投资法及其条例，再到引导海外侨胞积极参与高质量共建“一带一路”……一系列务实之举，有效激发了广大侨胞参与中国式现代化建设的积极性，助力中国与共建国家政治互信、经济互融、民心相通。</p><p>看传承弘扬中华文化。“四海同春”“亲情中华”等一场场精彩文化品牌活动走向世界各地，把年味、乡情送到万千侨胞身边；“中国寻根之旅”等文化体验活动持续开展，让一批批华裔青少年实地触摸中华文脉、感受中华文化。守护“共同的根”，传承“共同的魂”，成就“共同的梦”，中国人、中国文化、中国精神、中国心，成为海内外中华儿女内心深处的认同。</p><p>看增进中外交流合作。以“节”为媒，海外侨团开展形式多样的人文交流活动，让春节、中秋等传统节庆成为中外民众共享的文化盛宴。线上线下文化交流遍地开花，中华文化海外传播根基持续夯实，海外侨胞成为中外文明交流的民间使者，向世界展现了可信、可爱、可敬的中国形象。</p><p>…………</p><p>遍布世界各地的6000多万海外侨胞，是中华民族的重要组成部分，是中华大家庭血脉相连的重要成员。正是因为始终把凝聚侨心作为重中之重，用好地缘、亲缘、文缘独特纽带，密切联系交往，海外侨胞的向心力和凝聚力不断增强，有力推动了国家经济社会发展。</p><p>今天，中华民族伟大复兴势不可挡，这是全体海内外中华儿女共同奋斗的结果。把我国建设成为社会主义现代化强国，寄托着中华民族的夙愿和期盼，离不开每一名海外赤子的同心奋斗。广大海外侨胞和归侨侨眷积极响应号召，秉承优良传统、厚植家国情怀，定能在新征程上发挥独特优势、展现更大作为。</p><p>“十五五”规划纲要提出：“全面贯彻党的侨务政策，更好凝聚侨心侨力，发挥宗亲乡亲、祖地文化等纽带作用。”贯彻落实党中央决策部署，必须坚持凝心聚力同圆共享中国梦的主题，坚持为大局服务和为侨服务相统一、国内侨务和国外侨务工作相协同、涵养资源和发挥作用相统筹，最大限度把海外侨胞和归侨侨眷中蕴藏的巨大能量凝聚起来、发挥出来。各级侨务工作者要始终牢记嘱托，当好海外侨胞和归侨侨眷的贴心人，成为侨务工作的实干家。</p><p>潮起海天阔，同心向复兴。新征程上，以习近平新时代中国特色社会主义思想为指导，全面贯彻党的侨务政策，紧紧围绕党和国家工作大局，推动新时代侨务工作高质量发展，更好凝聚侨心侨力、促进海内外中华儿女团结奋斗，定能为以中国式现代化全面推进强国建设、民族复兴伟业汇聚磅礴力量。</p>', 4, '2026-07-30 00:28:30', '2026-07-31 20:36:41', '1', 6, 9, NULL, NULL);
INSERT INTO `articles` VALUES (32, '表格', '<table style=\"width: auto;\"><tbody><tr><table style=\"width: auto;\"><tbody><tr><th colSpan=\"1\" rowSpan=\"1\" width=\"78\">姓名</th><th colSpan=\"1\" rowSpan=\"1\" width=\"80\">性别</th><th colSpan=\"1\" rowSpan=\"1\" width=\"81\">年龄</th><th colSpan=\"1\" rowSpan=\"1\" width=\"144\">工作</th><th colSpan=\"1\" rowSpan=\"1\" width=\"auto\">备注</th></tr><tr><td colSpan=\"1\" rowSpan=\"1\" width=\"auto\"> &nbsp; &nbsp; hch</td><td colSpan=\"1\" rowSpan=\"1\" width=\"auto\"> &nbsp; &nbsp; man</td><td colSpan=\"1\" rowSpan=\"1\" width=\"auto\"> &nbsp; &nbsp;18</td><td colSpan=\"1\" rowSpan=\"1\" width=\"auto\"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;啥都干</td><td colSpan=\"1\" rowSpan=\"1\" width=\"auto\">撒旦法</td></tr></tbody></table><p><br></p></tr></tbody></table><p><br></p>', 4, '2026-07-30 00:30:10', '2026-07-31 20:32:35', '1', 1, 7, NULL, NULL);
INSERT INTO `articles` VALUES (34, '图片', '<p><img src=\"https://ms.bdimg.com/pacific/0/pic/-220073810_1571652596.jpg?x=0&y=0&h=150&w=242&vh=150.00&vw=242.00&oh=150.00&ow=242.00\" alt=\"网络图片\" data-href=\"https://ms.bdimg.com/pacific/0/pic/-220073810_1571652596.jpg?x=0&y=0&h=150&w=242&vh=150.00&vw=242.00&oh=150.00&ow=242.00\" style=\"\"/></p>', 4, '2026-07-30 00:56:41', '2026-07-31 21:03:33', '1', 1, 14, NULL, NULL);
INSERT INTO `articles` VALUES (35, '胜多负少', '<p><img src=\"/uploads/2026-7-30/1785344482428-0.d6pjw5zy5lt.webp\" alt=\"\" data-href=\"/uploads/2026-7-30/1785344482428-0.d6pjw5zy5lt.webp\" style=\"\"/></p><p><br></p><p><br></p><p> &nbsp; &nbsp;我是一只黄色的猫咪</p><p> &nbsp; &nbsp;我现在饿了</p>', 4, '2026-07-30 01:01:25', '2026-07-30 02:12:13', '1', 1, 8, NULL, NULL);
INSERT INTO `articles` VALUES (36, '我是新的', '<p>2026年7月30日02:27:15</p><p>哈哈哈哈</p>', 4, '2026-07-30 02:31:36', '2026-07-31 03:09:43', '1', 5, 22, '我是新的呢绒', '');
INSERT INTO `articles` VALUES (37, '我是一个正经的标题', '<p>如果你正在用 Python 做 Agent 开发，你一定绕不开两个名字：LangChain 和 LangGraph。它们经常被放在一起提起，但很多刚入门的朋友其实分不清——它们到底有什么区别？谁负责什么？能不能只用其中一个？</p><p><br></p><p>这篇文章就用一个你一定能听懂的类比，把这两个框架的关系彻底讲清楚</p><p>先回到原点：Agent 开发到底需要什么？</p><p>在聊框架之前，我们先快速对齐一个认知：开发一个 Agent，本质上是在造一个\"会思考、会干活的助手\"。</p><p><br></p><p>这个助手需要具备哪些能力？</p><p><br></p><p>能调用大模型（理解用户意图、生成回复）</p><p>能使用外部工具（搜索、查数据库、调用 API）</p><p>能按照一定的逻辑链条去执行任务（先做什么、再做什么、遇到异常怎么处理）</p><p>能在执行过程中记住上下文状态（上一步的结果要传给下一步）</p><p>这就引出了两个层次的需求：基础组件的供给，和任务流程的编排。而 LangChain 和 LangGraph，恰好各自解决其中一个问题。</p><p><br></p><p><br></p><p><br></p><p>LangChain：Python Agent 开发的「乐高积木套装」</p><p>LangChain 是什么？</p><p><br></p><p>你可以把 LangChain 想象成一个巨大的乐高积木套装。打开这个盒子，你拿到的是：</p><p><br></p><p>模型积木：统一调用 OpenAI、Claude、国产大模型等各种 LLM 的接口，换模型就像换一块积木</p><p>提示模板积木：用结构化的方式管理 Prompt，支持变量插值、少样本示例等</p><p>工具积木：把搜索、计算器、数据库查询、API 调用包装成模型可调用的标准工具</p><p>检索积木：对接向量数据库、文档加载器、嵌入模型，快速搭建 RAG 链路</p><p>链式调用积木：把上述积木串成一个简单的线性链路（Chain），比如\"检索 → 拼接上下文 → 发给模型 → 返回答案\"</p><p><br></p><p><br></p><p>LangChain 的定位，就是把 AI 开发中高频使用的组件全部标准化、模块化。你不用关心每个大模型的 API 差异，不用重复写文档切分和向量化的代码——积木已经给你准备好了，拿来就能拼。</p><p><br></p><p>但问题来了：有了一堆积木，你就能搭出一个复杂的 Agent 吗？</p><p><br></p><p>能——但只能搭出「线性结构」。就像用积木搭一根直直的长条，从 A 到 B 到 C，一路到底。而真正的 Agent 工作流远不止于此：它需要条件分支（“如果搜索结果为空，换一个关键词重新搜”）、需要循环（“继续调用工具直到拿到满意结果”）、需要状态管理（“记住用户三回合前提到的那个参数”）。</p><p><img src=\"https://i-blog.csdnimg.cn/img_convert/eea832f7644d86192e9c451ce64fce70.png\" alt=\"\" data-href=\"https://i-blog.csdnimg.cn/img_convert/eea832f7644d86192e9c451ce64fce70.png\" style=\"\"/></p><p><br></p><p><br></p><p>这时候，LangGraph 出场了。</p><p><br></p><p>LangGraph：Agent 工作流的「搭建图纸 + 装配线」</p><p>LangGraph 是什么？</p><p><br></p><p>如果 LangChain 是积木套装，那 LangGraph 就是搭建图纸，外加一条智能装配线。</p><p><br></p><p>它的核心概念只有两个：</p><p><br></p><p>图（Graph） 和 状态（State）。</p><p><br></p><p>图的思维：把任务变成\"节点 + 边\"</p><p>LangGraph 让你用有向图来描述 Agent 的工作流：</p><p><br></p><p>每个节点（Node） 代表一个具体的步骤——比如\"调用模型思考\"、“执行某个工具”、“汇总结果”</p><p>每条边（Edge） 代表步骤之间的流转——可以是\"无条件走下一步\"，也可以是\"根据条件选择走 A 还是走 B\"</p><p>这就从\"一根筋走到底\"变成了灵活的多分支网络。ReAct 模式（思考 → 行动 → 观察 → 再思考）用图来表达再自然不过：一个循环边把\"观察\"节点指回\"思考\"节点，Agent 就能反复迭代直到完成任务。</p><p><br></p><p>状态的思维：让 Agent 拥有\"记忆\"</p><p>LangGraph 另一个关键设计是内建的状态管理。整个图的每一步执行，都会读写一个共享的 State 对象。这意味着：</p><p><br></p><p>上一步工具返回的结果，下一步模型能自动看到</p><p>多轮对话的上下文不会丢失</p><p>你可以在任意节点插入人工审核（Human-in-the-loop），暂停流程、修改状态、再继续执行</p><p><br></p><p><br></p><p>如果用一句话总结 LangGraph 的定位：它不提供积木，它定义积木怎么拼、按什么顺序拼、拼的过程中怎么记住已经拼到哪了。</p><p><br></p><p>它们怎么配合？——\"积木 + 图纸\"的协作模式</p><p>讲了这么多，最直观的理解方式就是回到那个类比：</p><p><br></p><p>LangChain 负责「有什么可以用」，LangGraph 负责「按什么逻辑用」。</p><p><br></p><p>在实际项目中，它们的协作模式是这样的：</p><p><br></p><p>你用 LangChain 封装模型调用、定义工具、配置检索器、写好提示模板——把零件都准备好</p><p>你用 LangGraph 画一张图：定义节点（每个节点里调用 LangChain 准备好的组件）、定义边（包括条件边和循环边）、定义 State 的结构</p><p>编译图，跑起来——LangGraph 的运行时引擎就会按照图纸，自动调度每个节点、管理状态流转、处理异常分支</p><p>你写的代码大致长这样（伪代码示意）：</p><p>一键获取完整项目代码</p><pre><code class=\"language-python\"># LangChain 负责准备零件\nfrom langchain_core.tools import tool\nfrom langchain_openai import ChatOpenAI\n\nllm = ChatOpenAI(model=\"gpt-4\")\n\n@tool\ndef search(query: str) -&gt; str:\n    \"\"\"搜索工具\"\"\"\n    return f\"搜索结果：关于\'{query}\'的信息...\"\n\ntools = [search]\nllm_with_tools = llm.bind_tools(tools)\n\n# LangGraph 负责编排流程\nfrom langgraph.graph import StateGraph, MessagesState, START, END\n\ndef call_model(state: MessagesState):\n    return {\"messages\": [llm_with_tools.invoke(state[\"messages\"])]}\n\ndef should_continue(state: MessagesState):\n    last_msg = state[\"messages\"][-1]\n    if last_msg.tool_calls:\n        return \"tools\"      # 需要调工具，走工具分支\n    return END              # 否则结束\n\nbuilder = StateGraph(MessagesState)\nbuilder.add_node(\"agent\", call_model)\nbuilder.add_node(\"tools\", ToolNode(tools))\nbuilder.add_edge(START, \"agent\")\nbuilder.add_conditional_edges(\"agent\", should_continue)\nbuilder.add_edge(\"tools\", \"agent\")  # 工具结果返回 agent，形成循环\n\ngraph = builder.compile()\n</code></pre><p>你看，LangChain 提供了 ChatOpenAI、@tool 装饰器、bind_tools 这些零件；而 LangGraph 提供了 StateGraph、条件边、循环边这些编排能力。两者分工明确，谁也替代不了谁。</p><p><br></p><p>为什么不用其中一个就够了？</p><p>你可能还会问：我就写个简单的问答机器人，非要用两个框架吗？</p><p><br></p><p>实话实说——简单的场景确实可以只用 LangChain。 一个 create_retrieval_chain 配上 RunnablePassthrough，几行代码就能跑起来。</p><p><br></p><p>但一旦你的需求升级到以下任何一种情况，LangGraph 就变成刚需：</p><p><br></p><p>Agent 需要多次工具调用，且结果之间相互依赖</p><p>需要在工具执行前后插入人工审核节点</p><p>需要并行执行多个子任务再汇总</p><p>执行链路存在复杂的分支和异常处理</p><p>需要持久化状态，支持暂停恢复</p><p>现实是：绝大部分有实际价值的 Agent 都会走到这些场景。 这也是为什么 LangChain 官方现在把 LangGraph 作为构建 Agent 的首选方案——它承认单纯的链式调用已经不够用了。</p><p><br></p><p>Python 生态的优势与代价</p><p>最后，聊一点来自实践的真实体感。结合第二篇文章的选型分析，Python 生态做 Agent 开发有一个很鲜明的特点：</p><p><br></p><p>上手极快，但要写好、写稳，需要额外的工程纪律。</p><p><br></p><p>Python 的动态类型让你几小时内就能跑通一个 Demo，LangChain 加上 LangGraph 的组合让复杂工作流的开发体验非常顺滑。但当项目体量变大、团队成员变多、需要长期维护时，缺乏编译时检查的问题就会逐渐显现——一个函数签名的改动可能要到线上才暴露，代码读起来也需要大量\"脑内推断类型\"。</p><p><br></p><p>这不是说 Python 不好，而是提醒你：选 Python 框架做 Agent，意味着你享受了最高效的从零到一，但同时需要主动建立类型约束、单元测试、代码审查这些工程习惯来对冲长期维护的风险。</p><p><br></p><p>如果你本身是 Python 生态的开发者，这个成本是可控的；如果团队以 Java 或 Go 为主，那去看 Spring AI Alibaba 或 Eino 可能是更自然的选择。但无论选哪个语言，LangChain + LangGraph 所定义的\"组件化 + 图编排\"这套思想，都是 Agent 开发的通用范式，值得理解透彻。</p><p><br></p><p>一句话总结</p><p>LangChain 是乐高积木套装——它告诉你能用什么零件；LangGraph 是搭建图纸和装配线——它告诉你零件怎么拼、按什么顺序拼、拼到一半出问题了怎么办。两者各司其职，合在一起，才是 Python Agent 开发的完整工具箱</p>', 4, '2026-07-30 02:38:48', '2026-07-31 20:26:48', '1', 5, 33, '我是讲解langchain和langGRaph的，通过我，你们能够更了解一点agent的开发流程，我是讲解langchain和langGRaph的，通过我，你们能够更了解一点agent的开发流程，我是讲解langchain和langGRaph的，通过我，你们能够更了解一点agent的开发流程', '');
INSERT INTO `articles` VALUES (38, '我是zhansan的草稿', '<p>zhangsan的草稿</p>', 7, '2026-07-30 03:04:42', '2026-07-31 20:32:24', '1', 1, 29, 'zhagnsan的草稿', '');
INSERT INTO `articles` VALUES (39, '防守打法', '<p>我是第一名</p><p><img src=\"/uploads/2026-7-30/1785426375896-0.akr4judaj9v.webp\" alt=\"\" data-href=\"/uploads/2026-7-30/1785426375896-0.akr4judaj9v.webp\" style=\"width: 380.00px;height: 380.00px;\"/></p><p>党的复兴之路任重而道远</p>', 7, '2026-07-30 22:44:57', '2026-07-31 20:34:23', '1', 1, 148, '看到我你就知道你不是第一了', '/uploads/2026-7-30/1785422689567-0.9zsoo8wlo6m.webp');
INSERT INTO `articles` VALUES (40, '中共中央政治局第二十七次集体学习', '<p>新华社北京7月31日电 中共中央政治局7月30日下午就高质量推进国防和军队现代化进行第二十七次集体学习。中共中央总书记习近平在主持学习时强调，“十五五”时期，要坚持以新时代中国特色社会主义思想为指导，深入贯彻新时代强军思想，强化政治引领，深化创新发展，高质量推进国防和军队现代化，如期实现建军一百年奋斗目标，推动基本实现国防和军队现代化取得决定性进展，为以中国式现代化全面推进强国建设、民族复兴伟业提供坚强战略支撑。</p><p>这次中央政治局集体学习在八一建军节前夕举行。习近平代表党中央和中央军委，向全体人民解放军指战员、武警部队官兵、军队文职人员、预备役人员和民兵致以节日的祝贺！</p><p>中央军委战略规划办公室孙正同志就高质量推进国防和军队现代化问题进行讲解，提出工作建议。中央政治局的同志认真听取讲解，并进行了讨论。</p><p>习近平在听取讲解和讨论后发表重要讲话。他指出，高质量推进国防和军队现代化，是推进中国式现代化的应有之义。党的十八大以来，党中央统筹中华民族伟大复兴战略全局和世界百年未有之大变局，把强军兴军摆在党和国家事业的突出位置，毫不动摇坚持和加强党对军队的绝对领导，鲜明提出党在新时代的强军目标，谋划实施国防和军队现代化新“三步走”战略，全面推进政治建军、改革强军、科技强军、人才强军、依法治军，边斗争、边备战、边建设，我军现代化水平和实战能力显著提升，强军事业取得历史性成就、发生历史性变革。</p><p>习近平强调，政治建军是人民军队立军之本，关乎国防和军队现代化建设方向和底色。要坚持和加强党对军队的绝对领导，全面落实新时代政治建军方略，加强理论武装，深化思想整风，打牢官兵听党话、跟党走的思想根基，确保枪杆子永远听党指挥。要深入推进反腐败斗争，健全重大项目监管体系，确保各项建设质量托底、能力托底、廉洁托底。</p><p>习近平指出，高质量推进国防和军队现代化，根本指向和检验标准始终是战斗力。要加强无人智能技术军事应用，深化网络信息体系建设运用，逐步构建智能化军事体系。要加强作战能力体系集成，搞好实战化检验评估，扎实推进练兵备战，有效捍卫国家主权、安全、发展利益。</p><p>习近平强调，巩固提高一体化国家战略体系和能力，是高质量推进国防和军队现代化的必由之路。要加强军事治理，结合落实跨军地改革任务，优化体制机制，完善政策制度，形成各司其职、紧密协作、规范有序的跨军地工作格局。中央和国家机关有关部门、地方党委和政府要大力支持国防和军队建设，在全社会营造关心国防、热爱国防、建设国防、保卫国防的浓厚氛围。</p>', 5, '2026-07-31 17:43:15', '2026-07-31 21:21:15', '1', 5, 18, '中共中央政治局7月30日下午就高质量推进国防和军队现代化进行第二十七次集体学习。这次中央政治局集体学习在八一建军节前夕举行。习近平代表党中央和中央军委，向全体人民解放军指战员、武警部队官兵、军队文职人员、预备役人员和民兵致以节日的祝贺', '/uploads/2026-7-31/1785490992444-0.00utx7irjqoy.webp');

-- ----------------------------
-- Table structure for category
-- ----------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `create_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of category
-- ----------------------------
INSERT INTO `category` VALUES (1, '技术', '2026-07-29 07:13:53', NULL);
INSERT INTO `category` VALUES (2, '教程', '2026-07-29 07:14:11', NULL);
INSERT INTO `category` VALUES (3, '生活', '2026-07-29 07:14:24', NULL);
INSERT INTO `category` VALUES (4, '随笔', '2026-07-29 07:14:47', NULL);
INSERT INTO `category` VALUES (5, '分享', '2026-07-29 07:15:06', NULL);
INSERT INTO `category` VALUES (6, '其他', '2026-07-29 07:15:14', NULL);

-- ----------------------------
-- Table structure for comment_like
-- ----------------------------
DROP TABLE IF EXISTS `comment_like`;
CREATE TABLE `comment_like`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `comment_id` int NULL DEFAULT NULL,
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comment_like
-- ----------------------------
INSERT INTO `comment_like` VALUES (4, 5, 6, '2026-07-31 17:20:10');
INSERT INTO `comment_like` VALUES (5, 5, 7, '2026-07-31 17:22:45');
INSERT INTO `comment_like` VALUES (6, 5, 8, '2026-07-31 17:29:00');
INSERT INTO `comment_like` VALUES (9, 5, 5, '2026-07-31 17:29:24');
INSERT INTO `comment_like` VALUES (10, 5, 10, '2026-07-31 17:30:01');
INSERT INTO `comment_like` VALUES (11, 5, 11, '2026-07-31 21:03:45');
INSERT INTO `comment_like` VALUES (12, 5, 13, '2026-07-31 21:18:54');

-- ----------------------------
-- Table structure for notification
-- ----------------------------
DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '接收者用户id',
  `from_user_id` int NULL DEFAULT NULL COMMENT '发送者用户id',
  `article_id` int NULL DEFAULT NULL COMMENT '关联文章id',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'like/collect/comment',
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '通知内容',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '0未读 1已读',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_read`(`user_id` ASC, `is_read` ASC) USING BTREE,
  INDEX `idx_user_created`(`user_id` ASC, `created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '消息通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notification
-- ----------------------------
INSERT INTO `notification` VALUES (1, 5, 4, 40, 'collect', 'admin 收藏了你的文章《中共中央政治局第二十七次集体学习》', 1, '2026-07-31 21:20:47');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `avater` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (4, 'admin', '$2b$10$0qmWVt6aWKrDujtC.f3CwOwJiOH9sut37KecfN3kq64E68/vDCOdi', '管理员大爷', '2026-07-27 08:53:17', '/uploads/2026-7-30/1785343196007-0.q7bmqo25o8c.webp', '297101@qq.com');
INSERT INTO `user` VALUES (5, 'hch', '$2b$10$7IrI6Zo3nBGN2PfvzjWZ/u3fzklWXkRushS120Cdf.nGwu.jyIXL2', '小黄0112', NULL, '/uploads/2026-7-27/1785143749427-0.gdenp0xsumr.png', '985211@qq.com');
INSERT INTO `user` VALUES (6, 'huangch', '$2b$10$/NAUcPsdgMQM6hMiZV3QPO.RpqeY8Bli62y2BRu.daS2oxFQj9jOG', '大威天龙01', '2026-07-27 00:53:07', '/uploads/2026-7-27/1785146849012-0.8agbbo5e46i.png', '852123@qq.com');
INSERT INTO `user` VALUES (7, 'zhansan', '$2b$10$Khay8lz3OqnDM.xuIOKrpuU9EaJZHj.cG.j15tHJkkd7PPMB.QBFm', '张三', '2026-07-29 17:37:24', '/uploads/2026-7-30/1785421993028-0.0fep4ja6dtw.webp', NULL);

-- ----------------------------
-- Table structure for user_view_record
-- ----------------------------
DROP TABLE IF EXISTS `user_view_record`;
CREATE TABLE `user_view_record`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `article_id` int NOT NULL,
  `view_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `view_count` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_view_record
-- ----------------------------
INSERT INTO `user_view_record` VALUES (1, 4, 39, '2026-07-31 15:19:49', 10);
INSERT INTO `user_view_record` VALUES (2, 4, 38, '2026-07-31 03:03:24', 11);
INSERT INTO `user_view_record` VALUES (3, 4, 37, '2026-07-31 03:09:46', 5);
INSERT INTO `user_view_record` VALUES (4, 4, 36, '2026-07-31 03:09:43', 3);
INSERT INTO `user_view_record` VALUES (5, 4, 1, '2026-07-31 15:19:35', 18);
INSERT INTO `user_view_record` VALUES (6, 4, 4, '2026-07-31 01:55:26', 2);
INSERT INTO `user_view_record` VALUES (7, 4, 34, '2026-07-31 03:05:19', 3);
INSERT INTO `user_view_record` VALUES (8, 4, 32, '2026-07-31 02:25:24', 1);
INSERT INTO `user_view_record` VALUES (9, 4, 2, '2026-07-31 14:07:07', 5);
INSERT INTO `user_view_record` VALUES (10, 4, 10, '2026-07-31 02:26:20', 2);
INSERT INTO `user_view_record` VALUES (11, 4, 8, '2026-07-31 02:26:21', 3);
INSERT INTO `user_view_record` VALUES (12, 4, 3, '2026-07-31 14:12:13', 23);
INSERT INTO `user_view_record` VALUES (13, 4, 18, '2026-07-31 03:09:07', 3);
INSERT INTO `user_view_record` VALUES (14, 4, 13, '2026-07-31 14:07:03', 1);
INSERT INTO `user_view_record` VALUES (15, 4, 27, '2026-07-31 14:33:44', 1);
INSERT INTO `user_view_record` VALUES (16, 5, 39, '2026-07-31 20:34:23', 86);
INSERT INTO `user_view_record` VALUES (17, 5, 14, '2026-07-31 20:26:09', 5);
INSERT INTO `user_view_record` VALUES (19, 5, 7, '2026-07-31 20:51:02', 4);
INSERT INTO `user_view_record` VALUES (20, 5, 40, '2026-07-31 21:21:15', 17);
INSERT INTO `user_view_record` VALUES (21, 5, 38, '2026-07-31 20:32:24', 3);
INSERT INTO `user_view_record` VALUES (22, 5, 34, '2026-07-31 21:03:33', 5);
INSERT INTO `user_view_record` VALUES (23, 5, 32, '2026-07-31 20:32:35', 2);
INSERT INTO `user_view_record` VALUES (24, 5, 37, '2026-07-31 20:26:48', 1);
INSERT INTO `user_view_record` VALUES (25, 5, 12, '2026-07-31 20:33:18', 1);
INSERT INTO `user_view_record` VALUES (26, 5, 25, '2026-07-31 20:33:31', 1);
INSERT INTO `user_view_record` VALUES (27, 5, 31, '2026-07-31 20:36:41', 2);
INSERT INTO `user_view_record` VALUES (29, 5, 9, '2026-07-31 20:59:03', 2);
INSERT INTO `user_view_record` VALUES (30, 4, 40, '2026-07-31 21:20:45', 1);

SET FOREIGN_KEY_CHECKS = 1;
