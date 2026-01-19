// api/chat.js - Coze API后端代理
export default async function handler(req, res) {
  // 允许跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { question } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ error: '问题不能为空' });
    }
    
    // 从环境变量获取API密钥
    const apiKey = process.env.CHAT_API_KEY || process.env.CHAT_API_KEY;
    const workflowId = process.env.WORKFLOW_ID || '7596631871829393448';
    const appId = process.env.APP_ID || '7596359108564320290';
    
    if (!apiKey) {
      return res.status(500).json({ error: '服务器配置错误' });
    }
    
    // 调用Coze API
    const cozeResponse = await fetch('https://api.coze.cn/v1/workflows/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        app_id: appId,
        parameters: {
          CONVERSATION_NAME: "resume",
          USER_INPUT: question
        },
        additional_messages: [
          {
            content: question,
            content_type: "text",
            role: "user",
            type: "question"
          }
        ]
      }),
    });
    
    const data = await cozeResponse.json();
    
    // 提取回答
    let answer = "抱歉，AI助手暂时无法回答这个问题。";
    
    if (data.code === 0 && data.data && data.data.messages && data.data.messages.length > 0) {
      // 尝试提取AI回答
      const messages = data.data.messages;
      for (const msg of messages) {
        if (msg.role === 'assistant' && msg.content) {
          answer = msg.content;
          break;
        }
      }
    } else if (data.message) {
      answer = `API返回错误：${data.message}`;
    }
    
    return res.status(200).json({ 
      success: true, 
      answer: answer,
      raw: data // 用于调试
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message 
    });
  }
}
