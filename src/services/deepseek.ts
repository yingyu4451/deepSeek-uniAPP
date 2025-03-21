import { ref } from 'vue'

const API_KEY = 'sk-8e7364afda544776bf3161f8f377063b'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

export const isLoading = ref(false)
export const currentModel = ref<'deepseek-chat' | 'deepseek-reasoner'>('deepseek-chat')

interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface RequestResponse {
  data: DeepseekResponse
  statusCode: number
}

const systemPrompt = `你是一个智能的营养与对话助手。请先判断用户的输入是否是食材：

1. 如果用户询问的是食材，请用以下格式回复：

【营养成分】(每100g)
• 热量：x卡路里
• 蛋白质：x克
• 脂肪：x克
• 碳水：x克
• 膳食纤维：x克

【升糖指数】
• GI值：x (低/中/高)

【建议】
• 专业的食用建议

2. 如果用户询问的不是食材，请直接用简洁的语言回答用户的问题，不需要遵循上述格式。`

export async function chatWithAI(userMessage: string): Promise<string> {
  isLoading.value = true

  try {
    const response = await uni.request({
      url: API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      data: {
        model: currentModel.value,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
    }) as unknown as RequestResponse

    if (response.statusCode === 200 && response.data.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content
    }
    else {
      throw new Error('API响应格式错误')
    }
  }
  catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw new Error('无法获取AI回复，请稍后重试')
  }
  finally {
    isLoading.value = false
  }
}
