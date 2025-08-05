// miniprogram/pages/profile/profile.ts

interface UserInfo {
  nickName: string;
  avatarUrl: string;
  openid: string;
}

Page({
  data: {
    isLogin: false,
    userInfo: {} as UserInfo,
    userPoints: 0,
    dailyUsage: 0,
    dailyLimit: 10,
    totalDownloads: 0,
    version: '1.0.0'
  },

  onLoad() {
    this.checkLoginStatus();
    this.loadUserData();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadUserData();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      this.setData({
        isLogin: true,
        userInfo: userInfo
      });
    }
  },

  // 加载用户数据
  loadUserData() {
    // 获取积分
    const points = wx.getStorageSync('userPoints') || 0;
    
    // 获取今日使用次数
    const today = new Date().toDateString();
    const dailyUsageKey = `dailyUsage_${today}`;
    const dailyUsage = wx.getStorageSync(dailyUsageKey) || 0;
    
    // 获取累计下载数
    const totalDownloads = wx.getStorageSync('totalDownloads') || 0;
    
    this.setData({
      userPoints: points,
      dailyUsage: dailyUsage,
      totalDownloads: totalDownloads
    });
  },

  // 处理登录
  handleLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 调用云函数进行登录
        wx.cloud.callFunction({
          name: 'login',
          success: (loginRes: any) => {
            console.log('登录成功:', loginRes);
            
            const userInfo = {
              nickName: res.userInfo.nickName,
              avatarUrl: res.userInfo.avatarUrl,
              openid: loginRes.result.openid
            };
            
            // 保存用户信息
            wx.setStorageSync('userInfo', userInfo);
            
            this.setData({
              isLogin: true,
              userInfo: userInfo
            });
            
            // 新用户送积分
            this.giveNewUserBonus();
            
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            });
          },
          fail: (error) => {
            console.error('登录失败:', error);
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'error',
              duration: 2000
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '取消登录',
          icon: 'none',
          duration: 1000
        });
      }
    });
  },

  // 新用户奖励
  giveNewUserBonus() {
    const hasReceivedBonus = wx.getStorageSync('hasReceivedNewUserBonus');
    if (!hasReceivedBonus) {
      const currentPoints = this.data.userPoints;
      const newPoints = currentPoints + 100;
      
      wx.setStorageSync('userPoints', newPoints);
      wx.setStorageSync('hasReceivedNewUserBonus', true);
      
      this.setData({ userPoints: newPoints });
      
      wx.showModal({
        title: '新用户福利',
        content: '恭喜您获得新用户奖励100积分！',
        showCancel: false,
        confirmText: '太棒了'
      });
    }
  },

  // 前往设置
  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 前往下载历史
  goToDownloadHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 前往积分记录
  goToPointsHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 前往邀请好友
  goToInvite() {
    if (!this.data.isLogin) {
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

  // 前往意见反馈
  goToFeedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1000
    });
  },

  // 前往关于我们
  goToAbout() {
    wx.showModal({
      title: '关于蚂蚁下载器',
      content: '蚂蚁下载器是一款专业的无水印视频下载工具，支持抖音、快手、小红书、B站等主流平台。\n\n版本：v1.0.0\n\n如有问题请联系客服',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 微信分享配置
  onShareAppMessage() {
    const shareContent = this.data.isLogin 
      ? `我在使用蚂蚁下载器，超好用的无水印视频下载工具！快来试试吧~`
      : '蚂蚁下载器 - 免费下载无水印视频';
    
    return {
      title: shareContent,
      path: '/pages/index/index',
      imageUrl: '/imgs/logo.png'
    };
  },

  onShareTimeline() {
    return {
      title: '蚂蚁下载器 - 免费下载无水印视频'
    };
  }
});