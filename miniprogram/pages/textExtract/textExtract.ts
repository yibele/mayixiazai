// miniprogram/pages/textExtract/textExtract.ts
import userManager from '../../utils/userManager'

interface TextResult {
  content: string;
  title: string;
  url: string;
}

Page({
  // 页面实例属性，用于存储定时器ID
  pollingTimer: null as number | null,
  
  data: {
    link: '',
    isLoading: false,
    showTextPopup: false,
    textResult: null as TextResult | null,
    // 轮询相关状态
    currentExecuteId: '',
    pollingCount: 0,
    maxPollingCount: 300, // 最多轮询300次（10分钟，每2秒一次）
    loadingText: '正在提取文案中...',
    // 用户状态显示
    userStatus: {
      isAnonymous: true,
      remainingFree: 5,
      credits: 0
    }
  },

  onLoad() {
    // 页面初始化
    this.updateUserStatus();
  },

  onUnload() {
    // 页面卸载时清理定时器
    this.clearPollingTimer();
  },

  onHide() {
    // 页面隐藏时暂停轮询，避免无效请求
    this.clearPollingTimer();
  },

  onShow() {
    // 页面显示时，如果有正在进行的任务，恢复轮询
    if (this.data.currentExecuteId && this.data.isLoading) {
      this.startPolling();
    }
    // 刷新用户状态
    this.updateUserStatus();
  },

  // 更新用户状态显示
  async updateUserStatus() {
    try {
      if (userManager.isLoggedIn()) {
        const userInfo = userManager.getUserInfo();
        if (userInfo) {
          if (userInfo.isAnonymous) {
            // 匿名用户，检查免费次数
            const limitCheck = await userManager.checkDailyLimit();
            this.setData({
              userStatus: {
                isAnonymous: true,
                remainingFree: limitCheck.remainingFree,
                credits: userInfo.credits
              }
            });
          } else {
            // 正式用户，显示积分
            this.setData({
              userStatus: {
                isAnonymous: false,
                remainingFree: 0,
                credits: userInfo.credits
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 输入链接
  onLinkInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      link: e.detail.value
    });
  },

  // 一键粘贴
  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const clipboardText = res.data;
        if (clipboardText.trim()) {
          this.setData({ link: clipboardText });
          wx.showToast({
            title: '粘贴成功',
            icon: 'success',
            duration: 1000
          });
        } else {
          wx.showToast({
            title: '剪贴板为空',
            icon: 'error',
            duration: 1000
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '读取剪贴板失败',
          icon: 'error',
          duration: 1000
        });
      }
    });
  },

  // 提取文案
  async extractText() {
    if (!this.data.link.trim()) {
      wx.showToast({
        title: '请输入链接后再试',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    // 如果已经在处理中，先停止之前的轮询
    if (this.data.isLoading) {
      this.stopExtraction();
    }

    // 检查用户权限（免费次数或积分）
    const canUse = await userManager.ensureCanUseFeature('text_extract', 0);
    if (!canUse) {
      console.log('用户权限不足，取消提取');
      return;
    }

    this.setData({ 
      isLoading: true, 
      showTextPopup: false,
      pollingCount: 0,
      loadingText: '正在启动工作流...'
    });

    // 第一步：启动工作流
    wx.cloud.callFunction({
      name: 'extractText',
      data: {
        action: 'start',
        link: this.data.link
      }
    }).then((result: any) => {
      console.log('启动工作流结果:', result);
      
      if (result.result.success) {
        // 启动成功，开始轮询
        const executeId = result.result.data.executeId;
        this.setData({
          currentExecuteId: executeId,
          loadingText: '工作流已启动，正在处理中...'
        });
        
        // 开始轮询查询结果
        this.startPolling();
        
      } else {
        // 启动失败
        this.setData({ isLoading: false });
        wx.showToast({
          title: result.result.error || '启动工作流失败',
          icon: 'error',
          duration: 2500
        });
      }
    }).catch((error: any) => {
      console.error('启动工作流失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '网络错误，请稍后再试',
        icon: 'error',
        duration: 2500
      });
    });
  },

  // 开始轮询
  startPolling() {
    if (!this.data.currentExecuteId) {
      console.log('无执行ID，无法开始轮询');
      return;
    }

    this.pollingQuery();
  },

  // 轮询查询
  pollingQuery() {
    // 检查是否已经被取消
    if (!this.data.isLoading || !this.data.currentExecuteId) {
      console.log('任务已被取消，停止轮询');
      return;
    }

    if (this.data.pollingCount >= this.data.maxPollingCount) {
      // 超时
      this.setData({ isLoading: false });
      wx.showToast({
        title: '处理超时，请稍后再试',
        icon: 'error',
        duration: 2500
      });
      return;
    }

    const currentCount = this.data.pollingCount + 1;
    this.setData({ 
      pollingCount: currentCount,
      loadingText: `正在提取文案中...`
    });

    console.log(`第${currentCount}次轮询查询`);

    wx.cloud.callFunction({
      name: 'extractText',
      data: {
        action: 'query',
        executeId: this.data.currentExecuteId
      }
    }).then((result: any) => {
      console.log(`第${currentCount}次查询结果:`, result);
      
      // 再次检查是否已经被取消（防止查询期间被取消）
      if (!this.data.isLoading || !this.data.currentExecuteId) {
        console.log('查询完成时发现任务已被取消');
        return;
      }
      
      if (result.result.success) {
        const status = result.result.status;
        
        if (status === 'completed') {
          // 完成
          const textData = {
            content: result.result.data.content,
            title: result.result.data.title,
            url: this.data.link
          };
          
          this.setData({
            isLoading: false,
            textResult: textData,
            showTextPopup: true,
            currentExecuteId: ''
          });

          // 刷新用户状态（免费次数已被扣除）
          this.updateUserStatus();
          
          wx.showToast({
            title: '文案提取成功！',
            icon: 'success',
            duration: 2000
          });
          
        } else if (status === 'failed') {
          // 失败
          this.setData({ 
            isLoading: false,
            currentExecuteId: ''
          });
          wx.showToast({
            title: result.result.error || '工作流执行失败',
            icon: 'error',
            duration: 2500
          });
          
        } else if (status === 'running') {
          // 继续运行，设置下次轮询（但要先检查是否被取消）
          if (this.data.isLoading && this.data.currentExecuteId) {
            this.setPollingTimer();
          }
        }
        
      } else {
        // 查询失败，继续重试（但要先检查是否被取消）
        console.log('查询失败，继续重试:', result.result.error);
        if (this.data.isLoading && this.data.currentExecuteId) {
          this.setPollingTimer();
        }
      }
      
    }).catch((error: any) => {
      console.error('轮询查询失败:', error);
      // 网络错误，继续重试（但要先检查是否被取消）
      if (this.data.isLoading && this.data.currentExecuteId) {
        this.setPollingTimer();
      }
    });
  },

  // 设置轮询定时器
  setPollingTimer() {
    this.clearPollingTimer();
    this.pollingTimer = setTimeout(() => {
      this.pollingQuery();
    }, 2000);
  },

  // 清理轮询定时器
  clearPollingTimer() {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
      console.log('定时器已清理');
    }
  },

  // 停止提取
  stopExtraction() {
    console.log('用户主动取消提取');
    this.clearPollingTimer();
    this.setData({
      isLoading: false,
      currentExecuteId: '',
      pollingCount: 0
    });
    
    wx.showToast({
      title: '已取消提取',
      icon: 'success',
      duration: 1500
    });
  },

  // 弹窗控制方法
  hideTextPopup() {
    this.setData({
      showTextPopup: false
    });
  },

  onTextPopupVisibleChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      showTextPopup: e.detail.visible
    });
  },

  // 复制完整文案（标题+内容）
  copyAllText() {
    if (!this.data.textResult) {
      wx.showToast({
        title: '暂无文案内容',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    const { title, content } = this.data.textResult;
    const fullText = title ? `【${title}】\n\n${content}` : content;

    wx.setClipboardData({
      data: fullText,
      success: () => {
        wx.showToast({
          title: '完整文案已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请稍后再试',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  // 仅复制内容
  copyContentOnly() {
    if (!this.data.textResult?.content) {
      wx.showToast({
        title: '暂无文案内容',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.textResult.content,
      success: () => {
        wx.showToast({
          title: '文案内容已复制',
          icon: 'success',
          duration: 2000
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请稍后再试',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  // 复制文案（兼容旧版本）
  copyText() {
    this.copyAllText();
  }
});