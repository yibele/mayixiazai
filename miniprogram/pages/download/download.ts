// miniprogram/pages/download/download.ts

// 定义视频信息接口
interface VideoInfo {
  cover: string;
  title: string;
  author: string;
  authorAvatar: string;
  caption: string;
  downloadUrl: string;
}

Page({
  data: {
    videoInfo: null as VideoInfo | null,
  },

  onLoad(options: any) {
    // 从路由参数获取视频信息
    if (options.videoData) {
      try {
        const videoInfo = JSON.parse(decodeURIComponent(options.videoData));
        this.setData({ videoInfo });
      } catch (error) {
        console.error('解析视频信息失败:', error);
        wx.showToast({
          title: '页面数据异常',
          icon: 'error',
          duration: 2000
        });
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } else {
      wx.showToast({
        title: '缺少视频信息',
        icon: 'error',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 下载视频到相册
  downloadVideo() {
    if (!this.data.videoInfo || !this.data.videoInfo.downloadUrl) {
      wx.showToast({
        title: '视频信息不完整，无法下载',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.showLoading({ 
      title: '下载中...', 
      mask: true 
    });

    // 下载视频文件
    wx.downloadFile({
      url: this.data.videoInfo.downloadUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存视频到相册
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '视频已保存到相册',
                icon: 'success',
                duration: 2000
              });
            },
            fail: (error) => {
              wx.hideLoading();
              console.error('保存视频失败:', error);
              
              if (error.errMsg.includes('auth')) {
                // 权限问题
                wx.showModal({
                  title: '需要授权',
                  content: '请允许访问相册权限以保存视频',
                  showCancel: false,
                  confirmText: '去设置',
                  success: () => {
                    wx.openSetting();
                  }
                });
              } else {
                wx.showModal({
                  title: '下载失败',
                  content: '视频可能不在小程序白名单中，建议复制链接到浏览器下载',
                  showCancel: true,
                  cancelText: '我知道了',
                  confirmText: '复制链接',
                  success: (res) => {
                    if (res.confirm) {
                      this.copyVideoUrl();
                    }
                  }
                });
              }
            }
          });
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '下载失败',
            content: '网络请求失败，建议复制链接到浏览器下载',
            showCancel: true,
            cancelText: '我知道了',
            confirmText: '复制链接',
            success: (res) => {
              if (res.confirm) {
                this.copyVideoUrl();
              }
            }
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('下载视频失败:', error);
        wx.showModal({
          title: '下载失败',
          content: '该视频域名不在小程序白名单中，请复制链接到浏览器下载',
          showCancel: true,
          cancelText: '我知道了',
          confirmText: '复制链接',
          success: (res) => {
            if (res.confirm) {
              this.copyVideoUrl();
            }
          }
        });
      }
    });
  },

  // 复制无水印视频链接
  copyVideoUrl() {
    if (!this.data.videoInfo || !this.data.videoInfo.downloadUrl) {
      wx.showToast({
        title: '暂无可复制的链接',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.videoInfo.downloadUrl,
      success: () => {
        wx.showToast({
          title: '视频链接已复制',
          icon: 'success',
          duration: 2000
        });
      },
    });
  },

  // 复制封面链接
  copyCoverUrl() {
    if (!this.data.videoInfo || !this.data.videoInfo.cover) {
      wx.showToast({
        title: '暂无可复制的封面',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.videoInfo.cover,
      success: () => {
        wx.showToast({
          title: '封面链接已复制',
          icon: 'success',
          duration: 2000
        });
      },
    });
  },

  // 复制标题文案
  copyTitle() {
    if (!this.data.videoInfo || !this.data.videoInfo.title) {
      wx.showToast({
        title: '暂无可复制的标题',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.videoInfo.title,
      success: () => {
        wx.showToast({
          title: '标题文案已复制',
          icon: 'success',
          duration: 2000
        });
      },
    });
  }
});