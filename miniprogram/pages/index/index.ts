// miniprogram/pages/index/index.ts
import Dialog from 'tdesign-miniprogram/dialog/index';

// 定义视频信息接口
interface VideoInfo {
  cover: string;
  title: string;
  author: string;
  authorAvatar: string;
  caption: string;
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

    // --- 模拟后端API调用 ---
    // 在实际开发中，您应该在这里调用云函数
    // wx.cloud.callFunction({ name: 'parseVideo', data: { link: this.data.link } })
    console.log('开始分析链接:', this.data.link);

    setTimeout(() => {
      // 模拟成功或失败
      const isSuccess = Math.random() > 0.2; // 80%成功率

      if (isSuccess) {
        // 模拟成功返回的数据
        this.setData({
          isLoading: false,
          videoInfo: {
            cover: 'https://img.zcool.cn/community/017a715c8f19f0a801214168c39713.jpg@1280w_1l_2o_100sh.jpg',
            title: '【模拟数据】风景如画，感受大自然的鬼斧神工！',
            author: '旅行摄影师',
            authorAvatar: 'https://pic.qqtn.com/up/2018-1-24/15167598424698395.jpg',
            caption: '【模拟文案】这趟旅行，我被大自然的壮丽景色深深震撼。每一帧都是一幅画，希望你也喜欢。 #旅行 #风景 #摄影'
          }
        });
        wx.showToast({
          title: '解析成功！',
          icon: 'success',
          duration: 2000
        });
      } else {
        // 模拟失败
        this.setData({ isLoading: false });
        wx.showToast({
          title: '解析失败，请检查链接或稍后再试',
          icon: 'error',
          duration: 2500
        });
      }
    }, 1500); // 模拟1.5秒的网络延迟
  },

  // 下载视频
  downloadVideo() {
    wx.showToast({
      title: '已开始下载，请留意授权提示',
      icon: 'success',
      duration: 2000
    });
    // 在这里添加调用 wx.saveVideoToPhotosAlbum 的逻辑
    // wx.showLoading({ title: '下载中...' });
    // wx.downloadFile({
    //   url: '模拟的视频URL',
    //   success(res) {
    //     wx.saveVideoToPhotosAlbum({
    //       filePath: res.tempFilePath,
    //       success() { wx.hideLoading(); Toast(...) },
    //       fail() { wx.hideLoading(); Toast(...) }
    //     })
    //   }
    // })
  },

  // 复制文案
  copyCaption() {
    if (this.data.videoInfo && this.data.videoInfo.caption) {
      wx.setClipboardData({
        data: this.data.videoInfo.caption,
        success: () => {
          wx.showToast({
            title: '文案已复制',
            icon: 'success',
            duration: 2000
          });
        },
      });
    }
  },

  // 跳转到历史记录页
  navigateToHistory() {
    wx.navigateTo({
      url: '/pages/history/history', // 假设历史记录页面路径
    });
  }
});