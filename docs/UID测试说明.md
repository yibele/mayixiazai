# UID自增机制测试说明

## 🎯 测试目标
验证用户UID自增机制是否正常工作

## 📋 测试步骤

### 1. 清空测试数据
```javascript
// 在微信开发者工具控制台执行
wx.cloud.database().collection('users').get().then(res => {
  console.log('现有用户数:', res.data.length)
})

wx.cloud.database().collection('uid_counter').get().then(res => {
  console.log('UID计数器:', res.data)
})
```

### 2. 测试第一个匿名用户
- 清除本地存储：`wx.clearStorageSync()`
- 重新打开小程序
- 预期结果：创建用户uid=1, nickName="游客1"

### 3. 测试第二个匿名用户
- 更换设备或清除deviceId
- 重新静默登录
- 预期结果：创建用户uid=2, nickName="游客2"

### 4. 测试正式用户注册
- 调用微信登录
- 预期结果：创建用户uid=3, nickName="用户3"

## ✅ 验证点

1. **UID连续性**: uid应该是1,2,3连续递增
2. **昵称正确**: 匿名用户显示"游客{uid}", 正式用户显示"用户{uid}"
3. **计数器更新**: uid_counter.count应该等于最新的UID值
4. **原子性**: 并发创建用户时UID不重复

## 🔍 查看方法

在云开发控制台数据库中查看：
- `users` 集合：检查uid字段和nickName
- `uid_counter` 集合：检查count值

或在小程序中调试：
```javascript
// 获取当前用户信息
console.log('用户信息:', userManager.getUserInfo())
```
