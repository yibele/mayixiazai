// miniprogram/pages/batchAnalysis/batchAnalysis.ts

interface VideoItem {
  id: string;
  title: string;
  cover: string;
  publishTime: string;
  playCount: string;
  downloadUrl: string;
  selected: boolean;
}

interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
  currentTitle: string;
}

Page({
  data: {
    profileLink: '',
    isLoading: false,
    isLoadingMore: false,
    isDownloading: false,
    videoList: [] as VideoItem[],
    selectedVideos: [] as VideoItem[],
    isSelectAll: false,
    hasMore: true,
    downloadProgress: {
      current: 0,
      total: 0,
      percentage: 0,
      currentTitle: ''
    } as DownloadProgress
  },

  onLoad() {
    // 页面初始化
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 输入主页链接
  onProfileLinkInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      profileLink: e.detail.value
    });
  },

  // 一键粘贴
  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const clipboardText = res.data;
        if (clipboardText.trim()) {
          this.setData({ profileLink: clipboardText });
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



  // 开始批量解析
  startBatchAnalysis() {
    if (!this.data.profileLink.trim()) {
      wx.showToast({
        title: '请输入主页链接',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    this.setData({ 
      isLoading: true,
      videoList: [],
      selectedVideos: [],
      isSelectAll: false
    });

    // 调用云函数进行批量解析
    wx.cloud.callFunction({
      name: 'batchAnalysis',
      data: {
        profileLink: this.data.profileLink
      }
    }).then((result: any) => {
      console.log('批量解析结果:', result);
      
      if (result.result.success) {
        // 解析成功
        const videoList = result.result.data.map((video: any, index: number) => ({
          ...video,
          id: `video_${index}`,
          selected: false
        }));
        
        this.setData({
          isLoading: false,
          videoList: videoList,
          hasMore: result.result.hasMore || false
        });
        
        wx.showToast({
          title: `成功解析${videoList.length}个视频`,
          icon: 'success',
          duration: 2000
        });
      } else {
        // 解析失败
        this.setData({ isLoading: false });
        wx.showToast({
          title: result.result.error || '解析失败，请检查链接',
          icon: 'error',
          duration: 2500
        });
      }
    }).catch((error: any) => {
      console.error('批量解析失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '网络错误，请稍后再试',
        icon: 'error',
        duration: 2500
      });
    });
  },

  // 加载更多视频
  loadMoreVideos() {
    if (!this.data.hasMore || this.data.isLoadingMore) return;
    
    this.setData({ isLoadingMore: true });
    
    // 这里应该调用云函数获取更多视频
    setTimeout(() => {
      this.setData({ 
        isLoadingMore: false,
        hasMore: false // 模拟没有更多数据
      });
    }, 1000);
  },

  // 视频选择
  onVideoSelect(e: WechatMiniprogram.CustomEvent) {
    const index = e.currentTarget.dataset.index;
    const selected = e.detail.value;
    const videoList = [...this.data.videoList];
    videoList[index].selected = selected;
    
    const selectedVideos = videoList.filter(video => video.selected);
    const isSelectAll = selectedVideos.length === videoList.length;
    
    this.setData({
      videoList,
      selectedVideos,
      isSelectAll
    });
  },

  // 全选/取消全选
  toggleSelectAll() {
    const isSelectAll = !this.data.isSelectAll;
    const videoList = this.data.videoList.map(video => ({
      ...video,
      selected: isSelectAll
    }));
    const selectedVideos = isSelectAll ? videoList : [];
    
    this.setData({
      videoList,
      selectedVideos,
      isSelectAll
    });
  },

  // 批量下载
  async batchDownload() {
    if (this.data.selectedVideos.length === 0) {
      wx.showToast({
        title: '请选择要下载的视频',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    const selectedVideos = this.data.selectedVideos;
    this.setData({
      isDownloading: true,
      downloadProgress: {
        current: 0,
        total: selectedVideos.length,
        percentage: 0,
        currentTitle: ''
      }
    });

    // 逐个下载视频
    for (let i = 0; i < selectedVideos.length; i++) {
      const video = selectedVideos[i];
      const progress = {
        current: i + 1,
        total: selectedVideos.length,
        percentage: Math.round(((i + 1) / selectedVideos.length) * 100),
        currentTitle: video.title
      };
      
      this.setData({ downloadProgress: progress });
      
      try {
        // 下载视频
        await this.downloadVideo(video);
        
        wx.showToast({
          title: `${video.title} 下载完成`,
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        console.error('下载失败:', error);
        wx.showToast({
          title: `${video.title} 下载失败`,
          icon: 'error',
          duration: 1000
        });
      }
      
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.setData({ isDownloading: false });
    wx.showToast({
      title: '批量下载完成',
      icon: 'success',
      duration: 2000
    });
  },

  // 下载单个视频
  downloadVideo(video: VideoItem): Promise<void> {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: video.downloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => resolve(),
              fail: (error) => reject(error)
            });
          } else {
            reject(new Error('下载失败'));
          }
        },
        fail: (error) => reject(error)
      });
    });
  }
});