// app.ts
import userManager from './utils/userManager'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      });
    }

    // 初始化用户管理器（静默登录）
    this.initUserSystem();

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },

  // 初始化用户系统
  async initUserSystem() {
    try {
      await userManager.init();
      console.log('用户系统初始化成功');
    } catch (error) {
      console.error('用户系统初始化失败:', error);
    }
  }
})