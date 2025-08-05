// miniprogram/pages/tasks/tasks.ts

Page({
  data: {
    userPoints: 0,
    adTaskProgress: 0,
    adTaskLimit: 5,
    inviteCount: 0,
    hasClaimedNewUserBonus: false
  },

  onLoad() {
    this.loadTaskData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadTaskData();
  },

  // 加载任务数据
  loadTaskData() {
    // 获取积分
    const points = wx.getStorageSync('userPoints') || 0;
    
    // 获取今日观看广告次数
    const today = new Date().toDateString();
    const adTaskKey = `adTask_${today}`;
    const adTaskProgress = wx.getStorageSync(adTaskKey) || 0;
    
    // 获取邀请人数
    const inviteCount = wx.getStorageSync('inviteCount') || 0;
    
    // 获取新用户奖励状态
    const hasClaimedNewUserBonus = wx.getStorageSync('hasReceivedNewUserBonus') || false;
    
    this.setData({
      userPoints: points,
      adTaskProgress: adTaskProgress,
      inviteCount: inviteCount,
      hasClaimedNewUserBonus: hasClaimedNewUserBonus
    });
  },

  // 更新积分
  updatePoints(points: number) {
    const newPoints = this.data.userPoints + points;
    this.setData({ userPoints: newPoints });
    wx.setStorageSync('userPoints', newPoints);
  },

  // 观看广告
  watchAd() {
    if (this.data.adTaskProgress >= this.data.adTaskLimit) {
      wx.showToast({
        title: '今日任务已完成',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 创建激励视频广告实例
    const videoAd = wx.createRewardedVideoAd({
      adUnitId: 'your-ad-unit-id' // 这里需要替换为真实的广告位ID
    });

    // 监听广告加载事件
    videoAd.onLoad(() => {
      console.log('激励视频广告加载成功');
    });

    // 监听广告播放错误
    videoAd.onError((err) => {
      console.error('激励视频广告加载失败:', err);
      wx.showToast({
        title: '广告加载失败，请稍后再试',
        icon: 'error',
        duration: 2000
      });
    });

    // 监听广告关闭事件
    videoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 用户完整观看了广告
        this.completeAdTask();
      } else {
        // 用户中途关闭了广告
        wx.showToast({
          title: '请观看完整广告才能获得奖励',
          icon: 'none',
          duration: 2000
        });
      }
    });

    // 显示广告
    videoAd.show().catch(() => {
      // 广告显示失败，模拟观看完成（仅开发测试用）
      wx.showModal({
        title: '模拟广告',
        content: '当前为开发模式，模拟观看广告完成',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          this.completeAdTask();
        }
      });
    });
  },

  // 完成观看广告任务
  completeAdTask() {
    const today = new Date().toDateString();
    const adTaskKey = `adTask_${today}`;
    const newProgress = this.data.adTaskProgress + 1;
    
    // 更新进度
    this.setData({ adTaskProgress: newProgress });
    wx.setStorageSync(adTaskKey, newProgress);
    
    // 增加积分
    this.updatePoints(10);
    
    wx.showToast({
      title: '获得10积分！',
      icon: 'success',
      duration: 2000
    });
  },

  // 邀请好友
  inviteFriend() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'error',
        duration: 2000
      });
      return;
    }
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showModal({
      title: '邀请好友',
      content: '点击右上角分享按钮，邀请好友使用蚂蚁下载器。好友成功使用后，您将获得20积分奖励！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 领取新用户福利
  claimNewUserBonus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'error',
        duration: 2000
      });
      return;
    }
    
    if (this.data.hasClaimedNewUserBonus) {
      wx.showToast({
        title: '已经领取过了',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 发放新用户奖励
    this.updatePoints(100);
    this.setData({ hasClaimedNewUserBonus: true });
    wx.setStorageSync('hasReceivedNewUserBonus', true);
    
    wx.showModal({
      title: '领取成功',
      content: '恭喜您获得新用户福利100积分！',
      showCancel: false,
      confirmText: '太棒了'
    });
  },



  // 前往积分明细
  goToPointsHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 微信分享配置
  onShareAppMessage() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      return {
        title: '我在使用蚂蚁下载器，超好用的无水印视频下载工具！',
        path: `/pages/index/index?inviteCode=${userInfo.openid}`,
        imageUrl: '/imgs/logo.png'
      };
    } else {
      return {
        title: '蚂蚁下载器 - 免费下载无水印视频',
        path: '/pages/index/index',
        imageUrl: '/imgs/logo.png'
      };
    }
  },

  onShareTimeline() {
    return {
      title: '蚂蚁下载器 - 免费下载无水印视频，还能赚积分！'
    };
  }
});