// cloudfunctions/extractText/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 文案提取云函数
exports.main = async (event, context) => {
  const { action, link, executeId } = event

  try {
    if (action === 'start') {
      // 启动工作流
      if (!link || typeof link !== 'string') {
        return {
          success: false,
          error: '请提供有效的链接'
        }
      }

      console.log('启动文案提取工作流，链接:', link)
      const result = await startWorkflow(link)
      return result

    } else if (action === 'query') {
      // 查询工作流状态
      if (!executeId || typeof executeId !== 'string') {
        return {
          success: false,
          error: '请提供有效的执行ID'
        }
      }

      console.log('查询工作流状态，执行ID:', executeId)
      const result = await queryWorkflowStatus(executeId)
      return result

    } else {
      return {
        success: false,
        error: '无效的操作类型'
      }
    }

  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      success: false,
      error: '服务器内部错误，请稍后再试'
    }
  }
}

// 启动工作流
async function startWorkflow(link) {
  const COZE_API_TOKEN = 'sat_jqCvnpl4QKQc2NoeWNY8RHYc7rhxJs5dQOZUDg0yFk13vnkCZRUIxqQMvqSWlgLz'
  const WORKFLOW_ID = '7535294053631819826'
  
  try {
    console.log('开始启动Coze工作流，链接:', link)
    
    const startResponse = await axios.post('https://api.coze.cn/v1/workflow/run', {
      workflow_id: WORKFLOW_ID,
      parameters: {
        input: link
      },
      is_async: true
    }, {
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    })

    console.log('Coze API启动响应:', startResponse.data)

    if (startResponse.data.code !== 0) {
      throw new Error(`启动工作流失败: ${startResponse.data.msg || '未知错误'}`)
    }

    const executeId = startResponse.data.execute_id
    console.log('获得执行ID:', executeId)

    return {
      success: true,
      data: {
        executeId: executeId,
        url: link
      }
    }

  } catch (error) {
    console.error('启动工作流失败:', error)
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: '网络请求超时，请稍后再试'
      }
    } else if (error.response) {
      return {
        success: false,
        error: `API请求失败: ${error.response.data?.msg || error.message}`
      }
    } else {
      return {
        success: false,
        error: error.message || '启动工作流异常'
      }
    }
  }
}

// 查询工作流状态
async function queryWorkflowStatus(executeId) {
  const COZE_API_TOKEN = 'sat_jqCvnpl4QKQc2NoeWNY8RHYc7rhxJs5dQOZUDg0yFk13vnkCZRUIxqQMvqSWlgLz'
  const WORKFLOW_ID = '7535294053631819826'
  
  try {
    console.log('查询工作流状态，执行ID:', executeId)

    const queryResponse = await axios.get(
      `https://api.coze.cn/v1/workflows/${WORKFLOW_ID}/run_histories/${executeId}`,
      {
        headers: {
          'Authorization': `Bearer ${COZE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      }
    )

    console.log('查询结果完整响应:', JSON.stringify(queryResponse.data, null, 2))

    // 根据文档，成功响应格式：{"code":0, "data":[{...}], "msg":""}
    if (queryResponse.data.code === 0) {
      if (queryResponse.data.data && Array.isArray(queryResponse.data.data) && queryResponse.data.data.length > 0) {
        const historyData = queryResponse.data.data[0]
        
        console.log('执行状态:', historyData.execute_status)
        console.log('历史数据:', JSON.stringify(historyData, null, 2))
        
        if (historyData.execute_status === 'Success') {
          // 解析输出结果
          console.log('工作流执行成功，开始解析结果...')
          
          if (!historyData.output) {
            throw new Error('工作流执行成功但无输出结果')
          }
          
          try {
            const output = JSON.parse(historyData.output)
            console.log('解析的output:', output)
            
            const result = JSON.parse(output.Output)
            console.log('最终解析结果:', result)
            
            return {
              success: true,
              status: 'completed',
              data: {
                content: result.content || '暂无文案内容',
                title: result.title || '无标题'
              }
            }
          } catch (parseError) {
            console.error('解析输出结果失败:', parseError)
            throw new Error('解析工作流输出结果失败')
          }
          
        } else if (historyData.execute_status === 'Failed') {
          const errorMsg = historyData.error_message || '工作流执行失败'
          return {
            success: false,
            status: 'failed',
            error: errorMsg
          }
        } else {
          // 还在执行中
          console.log('工作流仍在执行中，状态:', historyData.execute_status)
          return {
            success: true,
            status: 'running',
            data: {
              executeStatus: historyData.execute_status
            }
          }
        }
      } else {
        // 可能还没有数据或者正在处理中
        console.log('查询成功但暂无执行数据，可能正在处理中')
        return {
          success: true,
          status: 'running',
          data: {
            executeStatus: 'Processing'
          }
        }
      }
    } else {
      throw new Error(`查询API返回错误: code=${queryResponse.data.code}, msg=${queryResponse.data.msg}`)
    }

  } catch (error) {
    console.error('查询工作流状态失败:', error)
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: '网络请求超时，请稍后再试'
      }
    } else if (error.response) {
      return {
        success: false,
        error: `API请求失败: ${error.response.data?.msg || error.message}`
      }
    } else {
      return {
        success: false,
        error: error.message || '查询工作流状态异常'
      }
    }
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
