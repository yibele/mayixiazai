// cloudfunctions/parseVideo/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { link } = event
  
  // 参数验证
  if (!link || typeof link !== 'string') {
    return {
      success: false,
      error: '链接参数不能为空'
    }
  }

  try {
    // 调用 Coze API
    const response = await axios({
      method: 'POST',
      url: 'https://api.coze.cn/v1/workflow/run',
      headers: {
        'Authorization': 'Bearer sat_jqCvnpl4QKQc2NoeWNY8RHYc7rhxJs5dQOZUDg0yFk13vnkCZRUIxqQMvqSWlgLz',
        'Content-Type': 'application/json'
      },
      data: {
        workflow_id: '7535017326866415642',
        parameters: {
          input: link
        },
        is_async: false
      }
    })

    const result = response.data
    

    console.log(result);
    // 检查API响应
    if (result.code !== 0) {
      console.error('Coze API 错误:', result)
      return {
        success: false,
        error: result.msg || '解析服务暂时不可用'
      }
    }

    // 解析返回的数据
    let videoData
    try {
      videoData = JSON.parse(result.data)
    } catch (parseError) {
      console.error('解析数据出错:', parseError)
      return {
        success: false,
        error: '数据格式错误'
      }
    }

    // 构造返回数据
    const videoInfo = {
      cover: videoData.output || '', // 封面图
      title: videoData.title || '未知标题',
      author: videoData.nickname || '未知作者', // 使用API返回的nickname
      authorAvatar: videoData.avatar || '', // 使用API返回的avatar
      caption: videoData.title || '', // 使用标题作为文案
      downloadUrl: videoData.cover_url || '' // 实际的视频下载链接
    }

    return {
      success: true,
      data: videoInfo
    }

  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      error: '网络请求失败，请稍后重试' + error
    }
  }
}