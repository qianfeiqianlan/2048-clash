# 2048 游戏得分管理系统

## 概述

这是一个基于 localStorage 的本地得分存储系统，为 2048 游戏提供完整的得分管理功能。

## 功能特性

### 核心功能
- ✅ **保存得分接口** - 记录每次游戏的得分、对局ID、时间戳
- ✅ **统计分析接口** - 提供游戏总数、最高分、平均分、最低分等统计
- ✅ **最近十局游戏分数** - 获取最近10局游戏的得分记录
- ✅ **Top3得分** - 获取历史最高分的前3名
- ✅ **数据持久化** - 基于 localStorage 的本地存储
- ✅ **数据导入导出** - 支持数据的备份和恢复

### 扩展功能
- 📊 **详细统计** - 胜率、总得分、胜利次数等
- 🔍 **记录查询** - 根据对局ID查找特定记录
- 📅 **时间筛选** - 获取今日、本周等时间范围的记录
- 🗂️ **数据管理** - 删除特定记录、清空所有数据
- 📱 **响应式设计** - 适配各种屏幕尺寸

## 使用方法

### 基本用法

```javascript
import scoreManager from './score.js';

// 保存得分
const record = scoreManager.saveScore(2048);
console.log('保存成功:', record);

// 获取统计信息
const stats = scoreManager.getStatistics();
console.log('统计信息:', stats);

// 获取最近10局分数
const recent = scoreManager.getRecentScores(10);
console.log('最近分数:', recent);

// 获取Top3得分
const top3 = scoreManager.getTopScores(3);
console.log('Top3得分:', top3);
```

### 高级用法

```javascript
// 保存得分时指定对局ID和时间戳
const customRecord = scoreManager.saveScore(1500, {
  gameId: 'custom_game_123',
  timestamp: Date.now() - 3600000 // 1小时前
});

// 根据对局ID查找记录
const foundRecord = scoreManager.getScoreByGameId('custom_game_123');

// 获取今日记录
const todayScores = scoreManager.getTodayScores();

// 获取本周记录
const weekScores = scoreManager.getThisWeekScores();

// 获取指定时间范围的记录
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const monthScores = scoreManager.getScoresByDateRange(startDate, endDate);

// 删除特定记录
const deleted = scoreManager.deleteScore('custom_game_123');

// 导出数据
const exportData = scoreManager.exportData();

// 导入数据
const importSuccess = scoreManager.importData(exportData);

// 清空所有数据
const cleared = scoreManager.clearAllScores();
```

## API 参考

### ScoreManager 类

#### 方法

##### `saveScore(score, options)`
保存得分记录
- **参数:**
  - `score` (number): 得分
  - `options` (Object, 可选): 可选参数
    - `gameId` (string, 可选): 对局ID，不提供则自动生成
    - `timestamp` (number, 可选): 时间戳，不提供则使用当前时间
- **返回:** Object - 保存的记录信息

##### `getAllScores()`
获取所有得分记录
- **返回:** Array - 得分记录数组

##### `getStatistics()`
获取统计信息
- **返回:** Object - 包含以下字段的统计对象:
  - `totalGames`: 游戏总数
  - `highestScore`: 最高分
  - `averageScore`: 平均分
  - `lowestScore`: 最低分
  - `totalScore`: 总得分
  - `winCount`: 胜利次数（得分≥2048）
  - `winRate`: 胜率（百分比）

##### `getRecentScores(count)`
获取最近N局游戏分数
- **参数:**
  - `count` (number, 可选): 获取的局数，默认10
- **返回:** Array - 最近N局游戏记录

##### `getTopScores(count)`
获取Top N得分
- **参数:**
  - `count` (number, 可选): 获取的条数，默认3
- **返回:** Array - Top N得分记录

##### `getScoreByGameId(gameId)`
根据对局ID获取特定记录
- **参数:**
  - `gameId` (string): 对局ID
- **返回:** Object|null - 记录对象或null

##### `deleteScore(gameId)`
删除特定记录
- **参数:**
  - `gameId` (string): 对局ID
- **返回:** boolean - 是否删除成功

##### `clearAllScores()`
清空所有记录
- **返回:** boolean - 是否清空成功

##### `exportData()`
导出所有数据
- **返回:** string - JSON格式的数据

##### `importData(jsonData)`
导入数据
- **参数:**
  - `jsonData` (string): JSON格式的数据
- **返回:** boolean - 是否导入成功

##### `getScoresByDateRange(startDate, endDate)`
获取指定时间范围内的记录
- **参数:**
  - `startDate` (Date): 开始日期
  - `endDate` (Date): 结束日期
- **返回:** Array - 时间范围内的记录

##### `getTodayScores()`
获取今日记录
- **返回:** Array - 今日记录

##### `getThisWeekScores()`
获取本周记录
- **返回:** Array - 本周记录

## 数据格式

### 得分记录格式

```javascript
{
  gameId: "game_1703123456789_abc123def",  // 对局ID
  score: 2048,                             // 得分
  timestamp: 1703123456789,                // 时间戳
  date: "2023-12-21T10:30:56.789Z",       // ISO格式日期
  createdAt: 1703123456789                 // 创建时间戳
}
```

### 统计信息格式

```javascript
{
  totalGames: 25,        // 游戏总数
  highestScore: 4096,    // 最高分
  averageScore: 1850,    // 平均分
  lowestScore: 256,      // 最低分
  totalScore: 46250,     // 总得分
  winCount: 8,           // 胜利次数
  winRate: 32            // 胜率（百分比）
}
```

## 存储限制

- 最多保存 1000 条记录
- 超出限制时自动删除最旧的记录
- 使用 localStorage 存储，受浏览器存储限制影响

## 浏览器兼容性

- 支持所有现代浏览器
- 需要 localStorage 支持
- 使用 ES6+ 语法，建议使用现代浏览器

## 测试

运行测试文件来验证系统功能：

```javascript
// 在浏览器控制台中运行
testScoreManager();
```

## 集成说明

系统已经集成到 2048 游戏中，游戏结束时会自动保存得分并更新统计信息。无需额外配置即可使用。

## 注意事项

1. 数据存储在浏览器的 localStorage 中，清除浏览器数据会丢失记录
2. 建议定期导出数据进行备份
3. 系统会自动处理数据格式验证和错误处理
4. 所有时间戳使用毫秒级精度
