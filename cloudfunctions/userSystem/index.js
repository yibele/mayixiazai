// cloudfunctions/userSystem/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 手动初始化UID计数器 - 调试用
async function initUIDCounter(forceReset = false) {
  try {
    console.log('=== 初始化UID计数器 ===')
    
    if (forceReset) {
      console.log('强制重置计数器')
    } else {
      // 检查是否已存在
      const existing = await db.collection('uid_counter').doc('user_counter').get()
      if (existing.data && existing.data.count !== undefined) {
        console.log('计数器已存在，当前值:', existing.data.count)
        return { success: true, message: '计数器已存在', currentCount: existing.data.count }
      }
    }
    
    // 创建或重置计数器
    await db.collection('uid_counter').doc('user_counter').set({
      count: 0, // 从0开始，下次获取时会变成1
      createTime: new Date(),
      updateTime: new Date(),
      description: 'UID自增计数器',
      version: '1.0'
    })
    
    console.log('UID计数器初始化成功')
    return { success: true, message: '计数器初始化成功' }
    
  } catch (error) {
    console.error('初始化UID计数器失败:', error)
    return { success: false, error: error.message }
  }
}

// 获取下一个UID - 按老板的逻辑
async function getNextUID() {
  // 第一步：直接获取整个集合
  const result = await db.collection('uid_counter').get()
  
  // 第二步：看是不是空
  if (result.data.length == 0) {
    // 第三步：如果是空，添加一个UID:1
    await db.collection('uid_counter').add({
      data: {
        uid: 1
      }
    })
    return 1
  }else {
    await db.collection('uid_counter').doc(result.data[0]._id).update({
      data: {
        uid: result.data[0].uid + 1
      }
    })
    return result.data[0].uid + 1;
  }
}

// 用户系统云函数
exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'silentLogin':
        return await silentLogin(OPENID, event.deviceId)
      case 'login':
        return await userLogin(OPENID, event.userInfo)
      case 'getProfile':
        return await getUserProfile(OPENID, event.deviceId)
      case 'checkDailyLimit':
        return await checkDailyLimit(OPENID, event.deviceId)
      case 'useFreeQuota':
        return await useFreeQuota(OPENID, event.deviceId, event.actionType)
      case 'watchAd':
        return await handleWatchAd(OPENID, event.adType, event.deviceId)
      case 'spendCredits':
        return await spendCredits(OPENID, event.amount, event.reason, event.relatedData, event.deviceId)
      case 'getCreditLogs':
        return await getCreditLogs(OPENID, event.page, event.limit)
      case 'getUsageHistory':
        return await getUsageHistory(OPENID, event.page, event.limit)
      
      // 调试和管理功能
      case 'initUIDCounter':
        return await initUIDCounter(event.forceReset)
      case 'getUIDCounter':
        return await getUIDCounterStatus()
      case 'testUID':
        return await testUIDGeneration()
        
      default:
        return { success: false, error: '无效的操作类型' }
    }
  } catch (error) {
    console.error('用户系统错误:', error)
    return { success: false, error: '系统内部错误' }
  }
}

// 静默登录（匿名用户）
async function silentLogin(openid, deviceId) {
  try {
    // 优先使用openid，如果没有则使用deviceId
    const userId = openid || deviceId
    
    if (!userId) {
      return { success: false, error: '无法获取用户标识' }
    }

    // 查找现有用户（匿名或正式用户）
    let userResult
    if (openid) {
      // 有openid，查找正式用户
      userResult = await db.collection('users').where({
        openid: openid
      }).get()
    } else {
      // 无openid，查找匿名用户
      userResult = await db.collection('users').where({
        deviceId: deviceId,
        isAnonymous: true
      }).get()
    }

    let user

    if (userResult.data.length === 0) {
      // 获取新的UID
      const uid = await getNextUID()
      
      // 创建新的匿名用户
      const newUser = {
        uid: uid, // 添加自增UID
        openid: openid || null,
        deviceId: deviceId || null,
        isAnonymous: !openid, // 没有openid则为匿名用户
        nickName: `普通用户`, // 使用UID作为默认昵称
        avatarUrl: '',
        credits: 0, // 匿名用户初始积分为0
        totalCredits: 0,
        dailyFreeCount: 0, // 今日免费使用次数
        lastFreeDate: new Date().toDateString(), // 最后使用免费次数的日期
        registerTime: new Date(),
        lastLoginTime: new Date(),
        vipLevel: 0,
        status: 'active'
      }

      const addResult = await db.collection('users').add({
        data: newUser
      })

      user = { ...newUser, _id: addResult._id }
      console.log('创建匿名用户:', userId)
    } else {
      // 更新最后登录时间
      user = userResult.data[0]
      
      // 检查是否需要重置每日免费次数
      const today = new Date().toDateString()
      const updateData = {
        lastLoginTime: new Date()
      }
      
      if (user.lastFreeDate !== today) {
        updateData.dailyFreeCount = 0
        updateData.lastFreeDate = today
      }
      
      await db.collection('users').doc(user._id).update({
        data: updateData
      })
      
      // 更新本地用户对象
      user.lastLoginTime = updateData.lastLoginTime
      if (updateData.dailyFreeCount !== undefined) {
        user.dailyFreeCount = updateData.dailyFreeCount
        user.lastFreeDate = updateData.lastFreeDate
      }
      
      console.log('匿名用户登录成功:', userId)
    }

    return {
      success: true,
      data: {
        userId: user._id,
        isAnonymous: user.isAnonymous,
        credits: user.credits,
        dailyFreeCount: user.dailyFreeCount,
        maxDailyFree: 5, // 每日免费次数上限
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        vipLevel: user.vipLevel
      }
    }

  } catch (error) {
    console.error('静默登录失败:', error)
    return { success: false, error: '静默登录失败' }
  }
}

// 用户登录/注册
async function userLogin(openid, userInfo = {}) {
  try {
    // 查找现有用户
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    let user

    if (userResult.data.length === 0) {
      // 获取新的UID
      const uid = await getNextUID()
      
      // 新用户注册
      const newUser = {
        uid: uid, // 添加自增UID
        openid: openid,
        nickName: userInfo.nickName || `用户${uid}`, // 使用UID作为默认昵称
        avatarUrl: userInfo.avatarUrl || '',
        credits: 100, // 新用户赠送100积分
        totalCredits: 100,
        isAnonymous: false, // 正式用户
        registerTime: new Date(),
        lastLoginTime: new Date(),
        vipLevel: 0,
        status: 'active'
      }

      const addResult = await db.collection('users').add({
        data: newUser
      })

      // 记录注册赠送积分
      await addCreditLog(addResult._id, 'earn', 100, 'register', null)

      user = { ...newUser, _id: addResult._id }
      
      console.log('新用户注册成功:', openid)
    } else {
      // 更新最后登录时间
      user = userResult.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          lastLoginTime: new Date(),
          // 更新用户信息（如果提供）
          ...(userInfo.nickName && { nickName: userInfo.nickName }),
          ...(userInfo.avatarUrl && { avatarUrl: userInfo.avatarUrl })
        }
      })
      
      console.log('用户登录成功:', openid)
    }

    return {
      success: true,
      data: {
        userId: user._id,
        credits: user.credits,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        vipLevel: user.vipLevel
      }
    }

  } catch (error) {
    console.error('用户登录失败:', error)
    return { success: false, error: '登录失败' }
  }
}

// 检查每日免费次数限制
async function checkDailyLimit(openid, deviceId) {
  try {
    const userId = openid || deviceId
    let userResult

    if (openid) {
      userResult = await db.collection('users').where({ openid: openid }).get()
    } else {
      userResult = await db.collection('users').where({ 
        deviceId: deviceId, 
        isAnonymous: true 
      }).get()
    }

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = userResult.data[0]
    const today = new Date().toDateString()
    
    // 如果是新的一天，重置免费次数
    if (user.lastFreeDate !== today) {
      await db.collection('users').doc(user._id).update({
        data: {
          dailyFreeCount: 0,
          lastFreeDate: today
        }
      })
      user.dailyFreeCount = 0
    }

    const maxDailyFree = 5
    const remainingFree = maxDailyFree - user.dailyFreeCount

    return {
      success: true,
      data: {
        dailyFreeCount: user.dailyFreeCount,
        maxDailyFree: maxDailyFree,
        remainingFree: remainingFree,
        canUseFree: remainingFree > 0,
        isAnonymous: user.isAnonymous || false
      }
    }
  } catch (error) {
    console.error('检查每日限制失败:', error)
    return { success: false, error: '检查每日限制失败' }
  }
}

// 使用免费配额
async function useFreeQuota(openid, deviceId, action) {
  try {
    const userId = openid || deviceId
    let userResult

    if (openid) {
      userResult = await db.collection('users').where({ openid: openid }).get()
    } else {
      userResult = await db.collection('users').where({ 
        deviceId: deviceId, 
        isAnonymous: true 
      }).get()
    }

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = userResult.data[0]
    const today = new Date().toDateString()
    
    // 检查是否是新的一天
    if (user.lastFreeDate !== today) {
      user.dailyFreeCount = 0
      user.lastFreeDate = today
    }

    // 检查免费次数是否用完
    if (user.dailyFreeCount >= 5) {
      return { 
        success: false, 
        error: '今日免费次数已用完', 
        needLogin: true 
      }
    }

    // 增加免费使用次数
    const newDailyCount = user.dailyFreeCount + 1

    await db.collection('users').doc(user._id).update({
      data: {
        dailyFreeCount: newDailyCount,
        lastFreeDate: today
      }
    })

    // 记录使用历史（免费使用）
    await addUsageHistory(user._id, action, '', null, 0) // 免费使用，积分消费为0

    return {
      success: true,
      data: {
        dailyFreeCount: newDailyCount,
        remainingFree: 5 - newDailyCount
      }
    }
  } catch (error) {
    console.error('使用免费配额失败:', error)
    return { success: false, error: '使用免费配额失败' }
  }
}

// 获取用户资料
async function getUserProfile(openid) {
  try {
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = userResult.data[0]
    return {
      success: true,
      data: {
        userId: user._id,
        credits: user.credits,
        totalCredits: user.totalCredits,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        vipLevel: user.vipLevel,
        registerTime: user.registerTime
      }
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return { success: false, error: '获取用户资料失败' }
  }
}

// 处理观看广告
async function handleWatchAd(openid, adType = 'reward') {
  try {
    // 查找用户
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = userResult.data[0]
    const rewardCredits = getAdRewardCredits(adType)

    // 更新用户积分
    const newCredits = user.credits + rewardCredits
    const newTotalCredits = user.totalCredits + rewardCredits

    await db.collection('users').doc(user._id).update({
      data: {
        credits: newCredits,
        totalCredits: newTotalCredits
      }
    })

    // 记录积分获得
    await addCreditLog(user._id, 'earn', rewardCredits, 'watch_ad', adType)

    return {
      success: true,
      data: {
        rewardCredits: rewardCredits,
        totalCredits: newCredits
      }
    }
  } catch (error) {
    console.error('处理观看广告失败:', error)
    return { success: false, error: '处理广告奖励失败' }
  }
}

// 消费积分
async function spendCredits(openid, amount, reason, relatedData = {}) {
  try {
    // 查找用户
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const user = userResult.data[0]

    // 检查积分余额
    if (user.credits < amount) {
      return { 
        success: false, 
        error: '积分不足',
        currentCredits: user.credits,
        requiredCredits: amount
      }
    }

    // 扣除积分
    const newCredits = user.credits - amount

    await db.collection('users').doc(user._id).update({
      data: {
        credits: newCredits
      }
    })

    // 记录积分消费
    await addCreditLog(user._id, 'spend', amount, reason, relatedData.relatedId)

    // 记录使用历史
    if (relatedData.url) {
      await addUsageHistory(user._id, reason, relatedData.url, relatedData.result, amount)
    }

    return {
      success: true,
      data: {
        remainingCredits: newCredits,
        spentCredits: amount
      }
    }
  } catch (error) {
    console.error('消费积分失败:', error)
    return { success: false, error: '积分消费失败' }
  }
}

// 获取积分记录
async function getCreditLogs(openid, page = 1, limit = 20) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取积分记录
    const logs = await db.collection('credit_logs')
      .where({
        userId: userId
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()

    return {
      success: true,
      data: logs.data
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
    return { success: false, error: '获取积分记录失败' }
  }
}

// 获取使用历史
async function getUsageHistory(openid, page = 1, limit = 20) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length === 0) {
      return { success: false, error: '用户不存在' }
    }

    const userId = userResult.data[0]._id

    // 获取使用历史
    const history = await db.collection('usage_history')
      .where({
        userId: userId
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()

    return {
      success: true,
      data: history.data
    }
  } catch (error) {
    console.error('获取使用历史失败:', error)
    return { success: false, error: '获取使用历史失败' }
  }
}

// 辅助函数：添加积分记录
async function addCreditLog(userId, type, amount, reason, relatedId) {
  return await db.collection('credit_logs').add({
    data: {
      userId: userId,
      type: type,
      amount: amount,
      reason: reason,
      relatedId: relatedId,
      createTime: new Date()
    }
  })
}

// 辅助函数：添加使用历史
async function addUsageHistory(userId, type, url, result, creditsSpent) {
  return await db.collection('usage_history').add({
    data: {
      userId: userId,
      type: type,
      url: url,
      result: result,
      creditsSpent: creditsSpent,
      createTime: new Date()
    }
  })
}

// 获取UID计数器状态 - 调试用
async function getUIDCounterStatus() {
  try {
    console.log('=== 获取UID计数器状态 ===')
    
    const counterRes = await db.collection('uid_counter').doc('user_counter').get()
    
    if (counterRes.data) {
      console.log('计数器状态:', JSON.stringify(counterRes.data, null, 2))
      return {
        success: true,
        data: {
          exists: true,
          counter: counterRes.data,
          message: '计数器状态正常'
        }
      }
    } else {
      console.log('计数器不存在')
      return {
        success: true,
        data: {
          exists: false,
          message: '计数器不存在，需要初始化'
        }
      }
    }
  } catch (error) {
    console.error('获取计数器状态失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 测试UID生成 - 调试用
async function testUIDGeneration() {
  try {
    console.log('=== 测试UID生成 ===')
    
    const uid1 = await getNextUID()
    const uid2 = await getNextUID()
    const uid3 = await getNextUID()
    
    console.log('生成的UID序列:', [uid1, uid2, uid3])
    
    return {
      success: true,
      data: {
        generatedUIDs: [uid1, uid2, uid3],
        message: 'UID生成测试完成'
      }
    }
  } catch (error) {
    console.error('UID生成测试失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 辅助函数：获取广告奖励积分
function getAdRewardCredits(adType) {
  switch (adType) {
    case 'reward':
      return 10 // 激励视频广告
    case 'banner':
      return 3  // 横幅广告
    case 'interstitial':
      return 5  // 插屏广告
    default:
      return 10
  }
}
