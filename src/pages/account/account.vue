<script setup lang="ts">
import { onMounted, ref } from 'vue'

const userInfo = ref({
  avatarUrl: '',
  nickName: '未登录',
})
const version = uni.getAccountInfoSync()

async function getCheckSessionKey(code2Session) {
  uni.request({
    url: 'http://panyy.xyz/api/checkSessionKey',
    method: 'POST',
    data: {
      openid: code2Session.openid,
      session_key: code2Session.session_key,
    },
    success(result) {
      console.log('getAccessToken', result)
    },
  })
}

async function getData() {
  // 获取临时登录凭证
  uni.login({
    provider: 'weixin',
    success(loginRes) {
      console.log('loginRes', loginRes)

      // 获取用户唯一标识ID和会话密钥
      uni.request({
        url: 'http://panyy.xyz/api/appLogin',
        method: 'POST',
        data: {
          code: loginRes.code,
        },
        success(result) {
          console.log('appLogin', result.data)
          getCheckSessionKey(result.data)
        },
      })
    },
  })
}

function onGetUserInfo(event) {
  console.log('onGetUserInfo', event)

  uni.getUserInfo({
    provider: 'weixin',
    withCredentials: true,
    success(result) {
      console.log('uni.getUserInfo', result)
    },
  })
}

function onChooseAvatar(e) {
  const { avatarUrl } = e.detail
  userInfo.value.avatarUrl = avatarUrl
}

// 页面加载时获取用户信息
onMounted(async () => {
  getData()
})
</script>

<template>
  <view class="account-container">
    <view class="user-info">
      <button class="avatar" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
        <image :src="userInfo.avatarUrl" />
      </button>
      <input type="nickname" class="weui-input" placeholder="请输入昵称">
      <button @click="getData">
        getdata
      </button>
      <button open-type="getUserInfo" @getuserinfo="onGetUserInfo">
        onGetUserInfo
      </button>
    </view>

    <view class="version">
      版本号：{{ version.miniProgram.version }}
    </view>
  </view>
</template>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.avatar {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  border-radius: 50%;
}

.avatar image {
  @apply w-full h-full;
}

.nickname {
  font-size: 18px;
  color: #333;
}

.version {
  @apply absolute bottom-4 left-0 mx-auto w-full text-center;
}
</style>
