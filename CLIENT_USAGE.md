# API 客户端使用说明

## 概述

这是一个基于 axios 的后端服务调用客户端，提供了登录功能和本地存储管理。客户端具有以下特性：

- 🔧 工程化设计，配置与代码分离
- 🔐 自动 token 管理和请求拦截
- 💾 本地存储管理
- 🛡️ 统一错误处理
- 🔄 自动重试和超时处理

## 安装依赖

确保项目中已安装 axios：

```bash
npm install axios
```

## 环境配置

在项目根目录创建 `.env.local` 文件（开发环境）或 `.env` 文件（生产环境）：

```env
# 后端服务地址
SERVER_URL=http://localhost:3001
```

**注意：** 客户端使用 `SERVER_URL` 环境变量，而不是 `REACT_APP_API_BASE_URL`。

## 基本使用

### 1. 导入客户端

```javascript
import apiClient from './client';
```

### 2. 用户登录

```javascript
// 登录
const loginResult = await apiClient.login('username', 'password');

if (loginResult.success) {
  console.log('登录成功:', loginResult.data);
  // 用户信息会自动保存到 localStorage
} else {
  console.error('登录失败:', loginResult.message);
}
```

### 3. 检查登录状态

```javascript
// 检查是否已登录
const isLoggedIn = apiClient.isLoggedIn();

// 获取当前用户信息
const currentUser = apiClient.getCurrentUser();

// 获取当前 token
const token = apiClient.getCurrentToken();
```

### 4. 用户登出

```javascript
// 登出（会清除本地存储的认证信息）
const logoutResult = apiClient.logout();
console.log(logoutResult.message);
```

### 5. 测试连接

```javascript
// 测试与后端的连接
const connectionResult = await apiClient.testConnection();
if (connectionResult.success) {
  console.log('连接正常');
} else {
  console.error('连接失败:', connectionResult.message);
}
```

## API 接口

### login(username, password)

用户登录接口

**参数：**
- `username` (string): 用户名
- `password` (string): 密码

**返回值：**
```javascript
{
  success: boolean,    // 是否成功
  data: {             // 成功时的数据
    userInfo: object, // 用户信息
    token: string     // 认证 token
  },
  message: string,    // 结果消息
  error?: Error      // 失败时的错误对象
}
```

### logout()

用户登出接口

**返回值：**
```javascript
{
  success: boolean,
  message: string
}
```

### isLoggedIn()

检查登录状态

**返回值：** `boolean`

### getCurrentUser()

获取当前用户信息

**返回值：** `object | null`

### getCurrentToken()

获取当前 token

**返回值：** `string | null`

### testConnection()

测试与后端的连接

**返回值：**
```javascript
{
  success: boolean,
  data?: any,
  message: string,
  error?: Error
}
```

### uploadScore(scoreData)

上传单条分数到服务端

**参数：**
- `scoreData` (object): 分数数据对象
  - `gameId` (string): 游戏ID
  - `score` (number): 分数值
  - `timestamp` (number, 可选): 时间戳
  - `date` (string, 可选): 日期字符串

**返回值：**
```javascript
{
  success: boolean,
  data?: object, // 服务端返回的分数信息
  message: string,
  error?: Error
}
```

### uploadMultipleScores(scoresData)

批量上传分数到服务端

**参数：**
- `scoresData` (array): 分数数据数组

**返回值：**
```javascript
{
  success: boolean,
  data?: array, // 服务端返回的分数信息数组
  message: string,
  error?: Error
}
```

### getUserScores(userId)

获取用户的所有分数

**参数：**
- `userId` (number): 用户ID

**返回值：**
```javascript
{
  success: boolean,
  data?: object, // 包含用户分数数组的对象
  message: string,
  error?: Error
}
```

## 本地存储

客户端会自动管理以下 localStorage 键：

- `userInfo`: 用户信息
- `token`: 认证 token

## 错误处理

客户端提供了统一的错误处理：

- **400**: 请求参数错误
- **401**: 用户名或密码错误（会自动清除本地认证信息）
- **500**: 服务器内部错误
- **网络错误**: 连接失败提示

## 配置选项

可以通过环境变量配置：

- `SERVER_URL`: 后端服务地址（默认: http://localhost:3001）

## 分数管理系统

### 基本使用

```javascript
import scoreManager from './score';

// 保存分数（自动上传到服务端）
const savedRecord = await scoreManager.saveScore(2048);

// 获取所有分数
const allScores = scoreManager.getAllScores();

// 获取统计信息
const stats = scoreManager.getStatistics();
```

### 高级功能

```javascript
// 重试上传失败的分数
const retryResult = await scoreManager.retryFailedUploads();

// 批量上传本地分数到服务端
const batchResult = await scoreManager.batchUploadScores();

// 从服务端同步用户分数
const syncResult = await scoreManager.syncFromServer(userId);
```

### 分数记录状态

分数记录可能包含以下状态字段：

- `serverId`: 服务端分配的ID（表示已成功上传）
- `userId`: 用户ID
- `uploadedAt`: 上传时间戳
- `localOnly`: 仅本地保存（用户未登录）
- `uploadFailed`: 上传失败标记
- `uploadError`: 上传错误信息

## 测试工具

在浏览器控制台中可以使用以下测试函数：

```javascript
// 测试分数上传功能
testScoreUpload();

// 测试错误处理
testScoreUploadErrors();

// 测试分数同步
testScoreSync();
```

## 注意事项

1. 确保后端服务正在运行
2. 登录成功后，token 会自动添加到后续请求的 Authorization 头中
3. 401 错误会自动清除本地存储的认证信息
4. 所有异步方法都返回 Promise，建议使用 async/await 或 .then() 处理
5. 分数会同时保存到本地存储和服务端，确保数据不丢失
6. 网络异常时，分数会先保存到本地，后续可以重试上传
