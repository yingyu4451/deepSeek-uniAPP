<script setup lang="ts">
import { chatWithAI, currentModel, isLoading } from '@/services/deepseek'
import { nextTick, onMounted, ref } from 'vue'

interface NutritionData {
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  gi: number
  giLevel: string
  advice: string
}

interface ChatMessage {
  content: string
  type: 'user' | 'ai'
  timestamp: number
  nutritionData?: NutritionData
  status?: 'sending' | 'sent' | 'error'
}

const STORAGE_KEY = 'food_nutrition_chat_history'
const messageList = ref<ChatMessage[]>([])
const inputMessage = ref('')
const error = ref('')
const scrollViewRef = ref<any>(null)

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

// 保存聊天记录到本地
function saveMessages() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(messageList.value))
  }
  catch (e) {
    console.error('保存聊天记录失败:', e)
  }
}

// 加载本地聊天记录
function loadMessages() {
  try {
    const storage = uni.getStorageSync(STORAGE_KEY)
    if (storage) {
      messageList.value = JSON.parse(storage)
    }
  }
  catch (e) {
    console.error('加载聊天记录失败:', e)
  }
}

// 在页面加载时读取历史记录
onMounted(() => {
  loadMessages()
})

function parseAIResponse(response: string): NutritionData | null {
  try {
    // 检查是否包含营养成分数据的标记
    if (!response.includes('【营养成分】')) {
      return null
    }

    const calories = Number(response.match(/热量：(\d+)卡路里/)?.[1] || 0)
    const protein = Number(response.match(/蛋白质：(\d+(?:\.\d*)?)克/)?.[1] || 0)
    const fat = Number(response.match(/脂肪：(\d+(?:\.\d*)?)克/)?.[1] || 0)
    const carbs = Number(response.match(/碳水：(\d+(?:\.\d*)?)克/)?.[1] || 0)
    const fiber = Number(response.match(/膳食纤维：(\d+(?:\.\d*)?)克/)?.[1] || 0)
    const gi = Number(response.match(/GI值：(\d+)/)?.[1] || 0)
    const giLevel = response.match(/GI值：\d+\s*\(([低中高])\)/)?.[1] || '未知'
    const advice = response.match(/【建议】\n•\s*(.+)/)?.[1] || ''

    // 检查是否成功解析到必要的营养数据
    if (calories === 0 && protein === 0 && fat === 0 && carbs === 0) {
      return null
    }

    return {
      calories,
      protein,
      fat,
      carbs,
      fiber,
      gi,
      giLevel,
      advice,
    }
  }
  catch {
    return null
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    const query = uni.createSelectorQuery()
    query.select('.message-list').boundingClientRect()
    query.selectViewport().scrollOffset((_res) => {})
    query.exec((res) => {
      if (res[0] && res[1]) {
        uni.pageScrollTo({
          scrollTop: res[0].height,
          duration: 300,
        })
      }
    })
  })
}

async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) { return }

  error.value = ''
  const userMsg = inputMessage.value
  inputMessage.value = ''

  // 添加用户消息
  messageList.value.push({
    content: userMsg,
    type: 'user',
    timestamp: Date.now(),
    status: 'sent',
  })

  // 添加AI临时消息
  messageList.value.push({
    content: '正在查询中',
    type: 'ai',
    timestamp: Date.now(),
    status: 'sending',
  })

  scrollToBottom()

  try {
    const aiResponse = await chatWithAI(userMsg)
    const nutritionData = parseAIResponse(aiResponse)

    // 更新AI消息
    messageList.value[messageList.value.length - 1] = {
      content: aiResponse,
      type: 'ai',
      timestamp: Date.now(),
      nutritionData: nutritionData || undefined,
      status: 'sent',
    }

    // 保存到本地存储
    saveMessages()
  }
  catch (e: any) {
    error.value = e.message || '获取回复失败，请重试'
    // 更新AI消息为错误状态
    messageList.value[messageList.value.length - 1] = {
      content: error.value,
      type: 'ai',
      timestamp: Date.now(),
      status: 'error',
    }

    // 保存到本地存储
    saveMessages()
  }

  scrollToBottom()
}
</script>

<template>
  <view class="chat-container">
    <scroll-view
      ref="scrollViewRef"
      class="message-list"
      scroll-y
      scroll-with-animation
      enable-flex
      :scroll-top="messageList.length * 1000"
    >
      <view
        v-for="(msg, index) in messageList"
        :key="index"
        class="message-item"
        :class="[
          msg.type,
          { 'animate-fade-in': msg.status === 'sent' },
          { 'animate-pulse': msg.status === 'sending' },
        ]"
      >
        <!-- 只在用户消息显示时间 -->
        <view v-if="msg.type === 'user'" class="message-time">
          {{ formatTime(msg.timestamp) }}
        </view>
        <view
          class="message-content"
          :class="[
            { error: msg.status === 'error' },
            { 'opacity-60': msg.status === 'sending' },
          ]"
        >
          <template v-if="msg.type === 'ai'">
            <!-- 结构化的营养数据显示 -->
            <view v-if="msg.nutritionData" class="nutrition-card">
              <!-- 营养成分列表 -->
              <view class="nutrition-section">
                <view class="section-title">
                  营养成分分析
                </view>
                <view class="nutrition-list">
                  <view class="nutrition-item">
                    <view class="item-label">
                      热量
                    </view>
                    <view class="item-value">
                      {{ msg.nutritionData.calories }} 卡路里
                    </view>
                  </view>
                  <view class="nutrition-item">
                    <view class="item-label">
                      蛋白质
                    </view>
                    <view class="item-value">
                      {{ msg.nutritionData.protein }} 克
                    </view>
                  </view>
                  <view class="nutrition-item">
                    <view class="item-label">
                      脂肪
                    </view>
                    <view class="item-value">
                      {{ msg.nutritionData.fat }} 克
                    </view>
                  </view>
                  <view class="nutrition-item">
                    <view class="item-label">
                      碳水
                    </view>
                    <view class="item-value">
                      {{ msg.nutritionData.carbs }} 克
                    </view>
                  </view>
                  <view class="nutrition-item">
                    <view class="item-label">
                      膳食纤维
                    </view>
                    <view class="item-value">
                      {{ msg.nutritionData.fiber }} 克
                    </view>
                  </view>
                </view>
              </view>

              <!-- 升糖指数 -->
              <view class="gi-section">
                <view class="section-title">
                  升糖指数 (GI)
                </view>
                <view class="gi-meter">
                  <view
                    class="gi-progress"
                    :class="{
                      'bg-green-500': msg.nutritionData.giLevel === '低',
                      'bg-yellow-500': msg.nutritionData.giLevel === '中',
                      'bg-red-500': msg.nutritionData.giLevel === '高',
                    }"
                    :style="{ width: `${Math.min(msg.nutritionData.gi, 100)}%` }"
                  />
                </view>
                <view class="gi-value">
                  GI值: {{ msg.nutritionData.gi }}
                  <text
                    class="gi-level"
                    :class="{
                      'text-green-500': msg.nutritionData.giLevel === '低',
                      'text-yellow-500': msg.nutritionData.giLevel === '中',
                      'text-red-500': msg.nutritionData.giLevel === '高',
                    }"
                  >
                    ({{ msg.nutritionData.giLevel }})
                  </text>
                </view>
              </view>

              <!-- 建议 -->
              <view class="advice-section">
                <view class="section-title">
                  食用建议
                </view>
                <view class="advice-content">
                  {{ msg.nutritionData.advice }}
                </view>
              </view>
            </view>
            <!-- 非结构化回复的显示 -->
            <view v-else class="normal-message">
              <text class="whitespace-pre-wrap">{{ msg.content }}</text>
              <view v-if="msg.status === 'sending'" class="loading-dots ml-2">
                <text class="dot" />
                <text class="dot" />
                <text class="dot" />
              </view>
            </view>
          </template>
          <template v-else>
            <view class="flex items-center">
              <text>{{ msg.content }}</text>
              <view v-if="msg.status === 'sending'" class="loading-dots ml-2">
                <text class="dot" />
                <text class="dot" />
                <text class="dot" />
              </view>
            </view>
          </template>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <input
        v-model="inputMessage"
        class="message-input"
        type="text"
        placeholder="请输入您想了解的食物..."
        :disabled="isLoading"
        @confirm="sendMessage"
        @input="error = ''"
      >
      <button
        class="send-btn"
        :disabled="isLoading || !inputMessage.trim()"
        :class="[
          { loading: isLoading },
          { 'bg-green-300': !inputMessage.trim() },
          { 'hover:bg-green-600 active:bg-green-700': inputMessage.trim() && !isLoading },
        ]"
        @tap="sendMessage"
      >
        <view class="flex items-center justify-center">
          <text>{{ isLoading ? '' : '发送' }}</text>
          <view v-if="isLoading" class="loading-dots ml-1">
            <text class="dot" />
            <text class="dot" />
            <text class="dot" />
          </view>
        </view>
      </button>
    </view>
  </view>
</template>

<style>
/* 基础布局 */
.chat-container {
  @apply flex flex-col h-screen bg-gray-100;
}

.message-list {
  @apply flex-1 px-3 py-4  overflow-y-auto;
}

/* 消息项样式 */
.message-item {
  @apply mb-3 flex flex-col w-full;
}

.message-time {
  @apply text-xs text-gray-500 mb-1 px-2;
}

.message-item.user {
  @apply items-end pr-5;
}

.message-item.user .message-time {
  @apply text-right;
}

.message-item.ai {
  @apply items-start;
}

.message-item.ai .message-time {
  @apply text-left;
}

/* 消息内容样式 */
.message-content {
  @apply max-w-[75%] rounded-xl px-3 py-2 text-sm break-words shadow-md transition-all duration-200;
}

.user .message-content {
  @apply bg-green-500 text-white mr-1;
}

.ai .message-content {
  @apply bg-white text-gray-800 ml-1;
}

.error.message-content {
  @apply bg-red-500 text-white;
}

/* 营养卡片样式 */
.nutrition-card {
  @apply w-full space-y-4;
}

.section-title {
  @apply text-base font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200;
}

/* 营养列表样式 */
.nutrition-section {
  @apply bg-white pt-2 rounded-lg overflow-hidden;
}

.nutrition-list {
  @apply divide-y divide-gray-100;
}

.nutrition-item {
  @apply flex items-center justify-between py-3 px-2 hover:bg-gray-50 transition-colors duration-200;
}

.item-label {
  @apply text-sm text-gray-600 font-medium;
}

.item-value {
  @apply text-sm font-bold text-gray-900;
}

/* 升糖指数样式 */
.gi-section {
  @apply mt-4 bg-white rounded-lg p-3;
}

.gi-meter {
  @apply w-full bg-gray-100 rounded-full h-4 overflow-hidden mt-3;
}

.gi-progress {
  @apply h-full rounded-full transition-all duration-500;
}

.gi-value {
  @apply text-sm text-gray-700 mt-2 font-semibold;
}

.gi-level {
  @apply ml-1 font-bold;
}

/* 建议部分样式 */
.advice-section {
  @apply mt-4 bg-gray-50 rounded-lg p-3;
}

.advice-content {
  @apply text-sm text-gray-700 leading-relaxed mt-2 px-1;
}

/* 输入区域样式 */
.input-area {
  @apply sticky bottom-0 p-4 bg-white flex items-center gap-3 border-t border-gray-200;
}

.message-input {
  @apply flex-1 h-10 bg-gray-100 rounded-full px-4 text-sm transition-all duration-200;
}

.message-input:focus {
  @apply bg-white shadow-inner outline-none;
}

.message-input[disabled] {
  @apply bg-gray-200 cursor-not-allowed;
}

/* 模型切换按钮样式 */
.model-switch {
  @apply w-[3.5rem] h-10 rounded-full text-sm bg-gray-100 text-gray-600 flex items-center justify-center gap-[0.1rem]
    transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95;
}

.model-switch.active {
  @apply bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg;
}

/* 发送按钮样式 */
.send-btn {
  @apply w-14 h-10 rounded-full bg-green-500 text-white text-sm flex items-center justify-center transition-all duration-200 whitespace-nowrap;
}

.send-btn:not([disabled]):hover {
  @apply transform scale-105 bg-green-600;
}

.send-btn:not([disabled]):active {
  @apply transform scale-95 bg-green-700;
}

.send-btn[disabled] {
  @apply bg-gray-300 cursor-not-allowed;
}

.send-btn.loading {
  @apply bg-green-300;
}

/* 动画效果 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* 加载动画 */
.loading-dots {
  @apply flex space-x-1 ml-1;
}

.loading-dots .dot {
  @apply w-1 h-1 bg-current rounded-full;
  animation: dotPulse 1.5s infinite;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.5);
    opacity: 0.5;
  }
}

/* 普通消息样式 */
.normal-message {
  @apply text-sm leading-relaxed whitespace-pre-wrap;
}

.normal-message .loading-dots {
  @apply inline-flex ml-1;
}
</style>
