// miniprogram/utils/userManager.ts
// 用户管理工具类

interface UserInfo {
  uid: number; // 自增UID
  userId: string;
  credits: number;
  nickName: string;
  avatarUrl: string;
  vipLevel: number;
  isAnonymous?: boolean;
  dailyFreeCount?: number;
  maxDailyFree?: number;
}

// 云函数返回结果类型定义
interface CloudFunctionResult {
  result: {
    success: boolean;
    data?: any;
    error?: string;
    needLogin?: boolean;
    requiredCredits?: number;
    currentCredits?: number;
  };
}

class UserManager {
  private userInfo: UserInfo | null = null;
  private deviceId: string = '';

  // 初始化用户管理器
  async init() {
    try {
      // 生成设备ID
      this.deviceId = this.getDeviceId();
      
      // 从本地存储获取用户信息
      const localUserInfo = wx.getStorageSync('userInfo');
      if (localUserInfo) {
        this.userInfo = localUserInfo;
        // 刷新用户信息
        await this.refreshUserInfo();
      } else {
        // 执行静默登录
        await this.silentLogin();
      }
    } catch (error) {
      console.error('初始化用户管理器失败:', error);
    }
  }

  // 获取设备ID（基于系统信息生成唯一标识）
  private getDeviceId(): string {
    let deviceId = wx.getStorageSync('deviceId');
    if (!deviceId) {
      // 生成新的设备ID
      const systemInfo = wx.getSystemInfoSync();
      const timestamp = Date.now();
      deviceId = `device_${systemInfo.platform}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      wx.setStorageSync('deviceId', deviceId);
    }
    return deviceId;
  }

  // 静默登录（匿名用户）
  async silentLogin(): Promise<boolean> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'silentLogin',
          deviceId: this.deviceId
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        this.userInfo = result.result.data;
        wx.setStorageSync('userInfo', this.userInfo);
        console.log('静默登录成功:', this.userInfo);
        return true;
      } else {
        throw new Error(result.result?.error || '静默登录失败');
      }
    } catch (error) {
      console.error('静默登录失败:', error);
      return false;
    }
  }

  // 用户登录
  async login(): Promise<boolean> {
    try {
      // 获取微信授权
      await wx.login();
      
      // 调用云函数登录
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'login'
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        this.userInfo = result.result.data;
        wx.setStorageSync('userInfo', this.userInfo);
        return true;
      } else {
        throw new Error(result.result?.error || '登录失败');
      }
    } catch (error) {
      console.error('用户登录失败:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      });
      return false;
    }
  }

  // 刷新用户信息
  async refreshUserInfo(): Promise<boolean> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'getProfile'
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        this.userInfo = result.result.data;
        wx.setStorageSync('userInfo', this.userInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      return false;
    }
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return this.userInfo !== null;
  }

  // 获取用户信息
  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  // 获取用户积分
  getCredits(): number {
    return this.userInfo?.credits || 0;
  }

  // 检查积分是否足够
  hasEnoughCredits(required: number): boolean {
    return this.getCredits() >= required;
  }

  // 检查是否为匿名用户
  isAnonymous(): boolean {
    return this.userInfo?.isAnonymous || false;
  }

  // 获取今日免费次数
  getDailyFreeCount(): number {
    return this.userInfo?.dailyFreeCount || 0;
  }

  // 获取剩余免费次数
  getRemainingFreeCount(): number {
    const maxFree = this.userInfo?.maxDailyFree || 5;
    const used = this.getDailyFreeCount();
    return Math.max(0, maxFree - used);
  }

  // 检查是否还有免费次数
  hasFreeTimes(): boolean {
    return this.getRemainingFreeCount() > 0;
  }

  // 检查每日免费次数限制
  async checkDailyLimit(): Promise<{ canUseFree: boolean; remainingFree: number; needLogin: boolean }> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'checkDailyLimit',
          deviceId: this.deviceId
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        const data = result.result.data;
        // 更新本地用户信息
        if (this.userInfo) {
          this.userInfo.dailyFreeCount = data.dailyFreeCount;
          this.userInfo.maxDailyFree = data.maxDailyFree;
          wx.setStorageSync('userInfo', this.userInfo);
        }
        
        return {
          canUseFree: data.canUseFree,
          remainingFree: data.remainingFree,
          needLogin: !data.canUseFree && data.isAnonymous
        };
      } else {
        return { canUseFree: false, remainingFree: 0, needLogin: true };
      }
    } catch (error) {
      console.error('检查每日限制失败:', error);
      return { canUseFree: false, remainingFree: 0, needLogin: true };
    }
  }

  // 使用免费配额
  async useFreeQuota(actionType: string): Promise<boolean> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'useFreeQuota',
          deviceId: this.deviceId,
          actionType: actionType
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        // 更新本地用户信息
        if (this.userInfo) {
          this.userInfo.dailyFreeCount = result.result.data.dailyFreeCount;
          wx.setStorageSync('userInfo', this.userInfo);
        }
        return true;
      } else {
        if (result.result?.needLogin) {
          this.showLoginRequiredDialog();
        }
        return false;
      }
    } catch (error) {
      console.error('使用免费配额失败:', error);
      return false;
    }
  }

  // 观看广告获得积分
  async watchAd(adType: string = 'reward'): Promise<{ success: boolean; credits?: number }> {
    try {
      // 先显示广告
      const adSuccess = await this.showRewardAd();
      if (!adSuccess) {
        return { success: false };
      }

      // 调用云函数记录观看广告
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'watchAd',
          adType: adType
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        // 更新本地用户信息
        if (this.userInfo) {
          this.userInfo.credits = result.result.data.totalCredits;
          wx.setStorageSync('userInfo', this.userInfo);
        }
        
        return {
          success: true,
          credits: result.result.data.rewardCredits
        };
      } else {
        throw new Error(result.result?.error || '观看广告失败');
      }
    } catch (error) {
      console.error('观看广告失败:', error);
      return { success: false };
    }
  }

  // 消费积分
  async spendCredits(amount: number, reason: string, relatedData: any = {}): Promise<boolean> {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userSystem',
        data: {
          action: 'spendCredits',
          amount: amount,
          reason: reason,
          relatedData: relatedData
        }
      }) as unknown as CloudFunctionResult;

      if (result.result?.success) {
        // 更新本地用户信息
        if (this.userInfo) {
          this.userInfo.credits = result.result.data.remainingCredits;
          wx.setStorageSync('userInfo', this.userInfo);
        }
        return true;
      } else {
        // 如果是积分不足，提示用户
        if (result.result?.error === '积分不足') {
          this.showInsufficientCreditsDialog(result.result.requiredCredits || 0, result.result.currentCredits || 0);
        } else {
          wx.showToast({
            title: result.result?.error || '操作失败',
            icon: 'error'
          });
        }
        return false;
      }
    } catch (error) {
      console.error('消费积分失败:', error);
      return false;
    }
  }

  // 显示激励视频广告
  private showRewardAd(): Promise<boolean> {
    return new Promise((resolve) => {
      // 创建激励视频广告实例
      const rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-c5b4b65dd04c3f7e' // 需要替换为真实的广告位ID
      });

      // 监听广告关闭事件
      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 用户看完广告
          resolve(true);
        } else {
          // 用户中途关闭
          wx.showToast({
            title: '请看完广告获得奖励',
            icon: 'none'
          });
          resolve(false);
        }
      });

      // 监听广告错误
      rewardedVideoAd.onError((err) => {
        console.error('广告加载失败:', err);
        wx.showToast({
          title: '广告加载失败',
          icon: 'error'
        });
        resolve(false);
      });

      // 显示广告
      rewardedVideoAd.show().catch(() => {
        // 广告可能需要重新加载
        rewardedVideoAd.load().then(() => rewardedVideoAd.show());
      });
    });
  }

  // 显示积分不足对话框
  private showInsufficientCreditsDialog(required: number, current: number) {
    wx.showModal({
      title: '积分不足',
      content: `当前积分：${current}\n需要积分：${required}\n\n观看广告可获得10积分`,
      confirmText: '观看广告',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          const adResult = await this.watchAd();
          if (adResult.success) {
            wx.showToast({
              title: `获得${adResult.credits}积分`,
              icon: 'success'
            });
          }
        }
      }
    });
  }

  // 显示需要登录的对话框
  private showLoginRequiredDialog() {
    wx.showModal({
      title: '需要登录',
      content: '今日免费次数已用完\n\n登录后可获得100积分继续使用',
      confirmText: '立即登录',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 跳转到个人中心页面进行登录
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      }
    });
  }

  // 检查并确保用户可以使用功能（包含免费次数和积分检查）
  async ensureCanUseFeature(reason: string, creditsRequired: number = 0): Promise<boolean> {
    if (!this.isLoggedIn()) {
      await this.silentLogin();
    }

    // 如果是匿名用户，优先检查免费次数
    if (this.isAnonymous()) {
      const limitCheck = await this.checkDailyLimit();
      
      if (limitCheck.canUseFree) {
        // 还有免费次数，使用免费配额
        return await this.useFreeQuota(reason);
      } else if (limitCheck.needLogin) {
        // 免费次数用完，需要登录
        this.showLoginRequiredDialog();
        return false;
      }
    }

    // 正式用户或免费次数用完的情况，检查积分
    if (creditsRequired > 0) {
      return await this.ensureCredits(creditsRequired, reason);
    }

    return true;
  }

  // 检查并确保用户有足够积分（包含观看广告流程）
  async ensureCredits(required: number, reason: string): Promise<boolean> {
    // 如果积分不足，引导用户观看广告
    if (!this.hasEnoughCredits(required)) {
      const shortfall = required - this.getCredits();
      const adsNeeded = Math.ceil(shortfall / 10);
      
      return new Promise((resolve) => {
        wx.showModal({
          title: '积分不足',
          content: `${reason}需要${required}积分\n当前积分：${this.getCredits()}\n\n观看${adsNeeded}个广告即可获得足够积分`,
          confirmText: '观看广告',
          cancelText: '取消',
          success: async (res) => {
            if (res.confirm) {
              const adResult = await this.watchAd();
              if (adResult.success) {
                wx.showToast({
                  title: `获得${adResult.credits}积分`,
                  icon: 'success'
                });
                // 递归检查是否还需要更多积分
                resolve(await this.ensureCredits(required, reason));
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          }
        });
      });
    }

    return true;
  }

  // 登出
  logout() {
    this.userInfo = null;
    wx.removeStorageSync('userInfo');
  }
}

// 导出单例
export default new UserManager();
