// miniprogram/pages/index/index.ts
import Dialog from 'tdesign-miniprogram/dialog/index';
import userManager from '../../utils/userManager';

// 定义视频信息接口
interface VideoInfo {
  cover: string;
  title: string;
  author: string;
  authorAvatar: string;
  caption: string;
  downloadUrl: string; // 添加视频下载链接
}

Page({
  data: {
    link: '',
    isLoading: false,
    videoInfo: null as VideoInfo | null,
    showFeatureCards: true, // 明确控制功能卡片显示
    showResultPopup: false, // 控制解析结果弹窗显示
    // videoInfo: {
    //   cover: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    //   title: '这是一个示例视频标题，这是一个示例视频标题，这是一个示例视频标题',
    //   author: '示例作者',
    //   authorAvatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/logo.png',
    //   caption: '这是示例视频的文案，点击可以复制哦。'
    // },
  },

  onLoad() {
    // 调试：打印当前数据状态
    console.log('页面数据状态:', {
      isLoading: this.data.isLoading,
      videoInfo: this.data.videoInfo,
      shouldShowCards: !this.data.isLoading && !this.data.videoInfo
    });
  },

  onShow() {
    // 每次页面显示时，检查剪贴板内容
    // this.checkClipboard();
    
    // 确保功能卡片状态正确
    if (!this.data.isLoading && !this.data.videoInfo) {
      this.setData({
        showFeatureCards: true
      });
    }
  },

  checkClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const clipboardText = res.data;
        // 简单判断是否为链接
        if (clipboardText.startsWith('http://') || clipboardText.startsWith('https://')) {
          Dialog.confirm({
            title: '检测到链接',
            content: `是否粘贴剪贴板中的链接进行解析？\n${clipboardText}`,
            confirmBtn: '立即粘贴',
            cancelBtn: '取消',
          })
          .then(() => {
            this.setData({ link: clipboardText });
            this.startParse();
          })
          .catch(() => {});
        }
      },
    });
  },

  onLinkInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      link: e.detail.value,
    });
  },

  // 清空输入框
  clearInput() {
    this.setData({
      link: '',
      videoInfo: null,
      showFeatureCards: true,
      showResultPopup: false
    });
    wx.showToast({
      title: '已清空',
      icon: 'success',
      duration: 1000
    });
  },

  // 一键粘贴剪贴板内容
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

  // 核心：开始分析
  async startParse() {
    if (!this.data.link.trim()) {
      wx.showToast({
        title: '请输入链接后再试',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    // 检查用户权限（免费次数或积分）
    const canUse = await userManager.ensureCanUseFeature('video_parse', 0);
    if (!canUse) {
      console.log('用户权限不足，取消解析');
      return;
    }

    this.setData({ 
      isLoading: true, 
      videoInfo: null,
      showFeatureCards: false,
      showResultPopup: false
    });

    console.log('开始分析链接:', this.data.link);

    // 调用云函数解析视频
    wx.cloud.callFunction({
      name: 'parseVideo',
      data: {
        link: this.data.link
      }
    }).then((result: any) => {
      console.log('云函数返回结果:', result);
      
      if (result.result.success) {
        // 解析成功
        this.setData({
          isLoading: false,
          videoInfo: result.result.data,
          showFeatureCards: false,
          showResultPopup: true // 显示解析结果弹窗
        });
        wx.showToast({
          title: '解析成功！',
          icon: 'success',
          duration: 2000
        });
      } else {
        // 解析失败
        this.setData({ 
          isLoading: false,
          showFeatureCards: true,
          showResultPopup: false
        });
        wx.showToast({
          title: result.result.error || '解析失败，请检查链接或稍后再试',
          icon: 'error',
          duration: 2500
        });
      }
    }).catch((error: any) => {
      console.error('云函数调用失败:', error);
      this.setData({ 
        isLoading: false,
        showFeatureCards: true,
        showResultPopup: false
      });
      wx.showToast({
        title: '网络错误，请稍后再试',
        icon: 'error',
        duration: 2500
      });
    });
  },

  // 弹窗控制方法
  hideResultPopup() {
    this.setData({
      showResultPopup: false,
      showFeatureCards: true
    });
  },

  onResultPopupVisibleChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      showResultPopup: e.detail.visible
    });
    // 当弹窗关闭时，重新显示功能卡片
    if (!e.detail.visible) {
      this.setData({
        showFeatureCards: true
      });
    }
  },

  // 跳转到下载页面
  goToDownload() {
    if (!this.data.videoInfo) {
      wx.showToast({
        title: '请先解析视频',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    // 将视频信息传递到下载页面
    const videoData = encodeURIComponent(JSON.stringify(this.data.videoInfo));
    wx.navigateTo({
      url: `/pages/download/download?videoData=${videoData}`
    });
  },

  // 复制文案
  copyText() {
    if (!this.data.videoInfo?.caption) {
      wx.showToast({
        title: '暂无文案内容',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.videoInfo.caption,
      success: () => {
        wx.showToast({
          title: '文案已复制到剪贴板',
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

  // 功能卡片导航方法
  goToTextExtract() {
    wx.navigateTo({
      url: '/pages/textExtract/textExtract'
    });
  },

  goToBatchAnalysis() {
    wx.navigateTo({
      url: '/pages/batchAnalysis/batchAnalysis'
    });
  },

  goToTutorial() {
    wx.navigateTo({
      url: '/pages/tutorial/tutorial'
    });
  },

  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    wx.showToast({
      title: '点击右上角分享给朋友',
      icon: 'none',
      duration: 2000
    });
  },

  // 微信分享配置
  onShareAppMessage() {
    return {
      title: '蚂蚁下载器 - 免费下载无水印视频',
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