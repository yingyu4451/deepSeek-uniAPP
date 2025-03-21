<script setup lang="ts">
import { onMounted, ref } from 'vue'

const userInfo = ref({
  avatarUrl: '',
  nickName: '未登录',
})

// 获取用户信息
function getUserInfo() {
  uni.getUserInfo({
    success: (res) => {
      userInfo.value = res.userInfo
    },
    fail: () => {
      uni.showToast({
        title: '获取用户信息失败',
        icon: 'none',
      })
    },
  })
}

// 清除缓存
function clearStorage() {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({
          title: '清除成功',
          icon: 'success',
        })
        uni.reLaunch({
          url: '/pages/index/index',
        })
      }
    },
  })
}

// 页面加载时获取用户信息
onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <view class="account-container">
    <view class="user-info">
      <image class="avatar" :src="userInfo.avatarUrl || '../../static/img/default-avatar.jpg'" mode="aspectFill" />
      <text class="nickname">{{ userInfo.nickName }}</text>
    </view>

    <view class="action-list">
      <button class="clear-btn" @click="clearStorage">
        清除缓存
      </button>
    </view>
  </view>
</template>

<style scoped>
.account-container {
  padding: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 15px;
}

.nickname {
  font-size: 18px;
  color: #333;
}

.action-list {
  margin-top: 30px;
}

.clear-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background-color: #f8f8f8;
  color: #333;
  border-radius: 8px;
  font-size: 16px;
}
</style>
