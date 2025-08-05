// miniprogram/pages/index/index.ts
import Dialog from 'tdesign-miniprogram/dialog/index';

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
    // videoInfo: {
    //   cover: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    //   title: '这是一个示例视频标题，这是一个示例视频标题，这是一个示例视频标题',
    //   author: '示例作者',
    //   authorAvatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/logo.png',
    //   caption: '这是示例视频的文案，点击可以复制哦。'
    // },
  },

  onLoad() {
    // 可以在这里添加一些初始化逻辑
  },

  onShow() {
    // 每次页面显示时，检查剪贴板内容
    this.checkClipboard();
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
      videoInfo: null
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
  startParse() {
    if (!this.data.link.trim()) {
      wx.showToast({
        title: '请输入链接后再试',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    this.setData({ isLoading: true, videoInfo: null });

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
          videoInfo: result.result.data
        });
        wx.showToast({
          title: '解析成功！',
          icon: 'success',
          duration: 2000
        });
      } else {
        // 解析失败
        this.setData({ isLoading: false });
        wx.showToast({
          title: result.result.error || '解析失败，请检查链接或稍后再试',
          icon: 'error',
          duration: 2500
        });
      }
    }).catch((error: any) => {
      console.error('云函数调用失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '网络错误，请稍后再试',
        icon: 'error',
        duration: 2500
      });
    });
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


});