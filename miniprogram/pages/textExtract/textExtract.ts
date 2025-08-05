// miniprogram/pages/textExtract/textExtract.ts

interface HistoryItem {
  text: string;
  time: string;
}

Page({
  data: {
    link: '',
    isLoading: false,
    textContent: '',
    historyList: [] as HistoryItem[]
  },

  onLoad() {
    // 加载历史记录
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('textExtractHistory') || [];
    this.setData({
      historyList: history.slice(0, 5) // 只显示最近5条
    });
  },

  // 保存到历史记录
  saveToHistory(text: string) {
    const history = wx.getStorageSync('textExtractHistory') || [];
    const newItem: HistoryItem = {
      text: text,
      time: new Date().toLocaleString()
    };
    
    // 避免重复
    const existingIndex = history.findIndex((item: HistoryItem) => item.text === text);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    
    history.unshift(newItem);
    // 只保存最近10条记录
    if (history.length > 10) {
      history.splice(10);
    }
    
    wx.setStorageSync('textExtractHistory', history);
    this.loadHistory();
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
  extractText() {
    if (!this.data.link.trim()) {
      wx.showToast({
        title: '请输入链接后再试',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    this.setData({ isLoading: true, textContent: '' });

    // 调用云函数解析视频文案
    wx.cloud.callFunction({
      name: 'parseVideo',
      data: {
        link: this.data.link
      }
    }).then((result: any) => {
      console.log('云函数返回结果:', result);
      
      if (result.result.success && result.result.data.caption) {
        // 提取成功
        const textContent = result.result.data.caption;
        this.setData({
          isLoading: false,
          textContent: textContent
        });
        
        // 保存到历史记录
        this.saveToHistory(textContent);
        
        wx.showToast({
          title: '文案提取成功！',
          icon: 'success',
          duration: 2000
        });
      } else {
        // 提取失败
        this.setData({ isLoading: false });
        wx.showToast({
          title: result.result.error || '文案提取失败，请检查链接',
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

  // 复制文案
  copyText() {
    if (!this.data.textContent) {
      wx.showToast({
        title: '暂无文案内容',
        icon: 'error',
        duration: 2000
      });
      return;
    }

    wx.setClipboardData({
      data: this.data.textContent,
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

  // 复制历史文案
  copyHistoryText(e: WechatMiniprogram.TouchEvent) {
    const text = (e.currentTarget as any).dataset.text;
    if (!text) return;

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '文案已复制',
          icon: 'success',
          duration: 1500
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error',
          duration: 1500
        });
      }
    });
  }
});