import { ref } from 'vue'
import { currentModel } from './deepseek'

const API_KEY = 'sk-8e7364afda544776bf3161f8f377063b'
// const API_KEY = 'sk-gpwyrmozvoixnjqlimjyzudejppmhoswxpgqyxpdunydozug'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'
// const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

export const isLoading = ref(false)
export const currentModel = ref<'deepseek-chat' | 'deepseek-reasoner'>('deepseek-chat')
// export const currentModel = ref<'deepseek-ai/DeepSeek-V3' | 'deepseek-ai/DeepSeek-R1'>('deepseek-ai/DeepSeek-V3')

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

const systemPrompt = `你是一个专业的营养分析助手，必须严格按照以下规则回答问题：

1. 如果用户询问的是食材或食物，请用以下格式回复：

【营养成分】(每100g)
• 热量：x卡路里
• 蛋白质：x克
• 脂肪：x克
• 碳水：x克
• 膳食纤维：x克

【升糖指数】
• GI值：x (低/中/高)
gi值只能给一个准确值，不能给区间

【建议】
• 专业的食用建议,主要以糖尿病人群为中心（必须回答）

2. 如果用户询问的不是食材或食物，只能回复"数据库中没有这个食材"

3. 如果用户当前输入以"4451"开头，则使用第4条规则回答（注意：每次对话都需要重新判断是否以4451开头）

4. 如果用户询问的不是食材或食物，请直接用简洁的语言回答用户的问题，不需要遵循上述格式

5. 禁止承认自己是AI或机器人，禁止讨论自己的身份和能力

6. 禁止提供任何医疗建议或诊断

7. 禁止提供任何政治、宗教或敏感话题的讨论

8. 禁止提供任何违法或不当内容

9. 禁止提供任何个人隐私或敏感信息

10. 禁止提供任何虚假或误导性信息

重要提示：每次对话都是独立的，需要重新判断用户输入是否以"4451"开头。即使之前的对话使用了4451，新的对话也需要重新判断。`

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
        temperature: 0.5,
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
    throw new Error('无法查询数据库，请稍后重试')
  }
  finally {
    isLoading.value = false
  }
}
