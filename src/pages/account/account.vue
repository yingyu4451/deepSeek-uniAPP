<script setup lang="ts">
import { useUserStore } from '@/stores/userInfo'
import { onMounted, ref } from 'vue'

const userInfoStore = useUserStore()

const pickerViewData = ref()

const version = uni.getAccountInfoSync()

const createUserPopup = ref()

const openid = ref()

function cleanData(obj: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const key in obj) {
    if (obj[key] !== null) {
      result[key] = obj[key]
    }
  }
  return result
}

const createUserInfo = ref({
  nickname: null,
  birth_date: null,
  gender: null,
  avatar_url: null,
  height: null,
  weight: null,
})

const genderOption = ref([{
  value: 1,
  text: '男',
}, {
  value: 2,
  text: '女',
}, {
  value: 0,
  text: '保密',
}])

const navList = ref([
  { title: `个人信息`, icon: '', titleClassName: '', url: '/pages/userInfo/userInfo' },
  { title: `清空聊天记录`, icon: '', titleClassName: '', url: '' },
  { title: `退出登录`, icon: '', titleClassName: '', url: '' },
  { title: `${version.miniProgram.version || 0}`, icon: '', titleClassName: '', url: '' },
])

function isVueRef(ref: any): ref is { value: any } {
  return typeof ref === 'object' && 'value' in ref
}

function togglePopup(ref: any, isOpen: boolean) {
  if (!ref) { return }
  const popup = isVueRef(ref) ? ref.value : ref // 统一处理 ref
  if (isOpen) {
    popup.open()
  }
  else {
    popup.close()
  }
}

async function getCheckSessionKey(code2Session) {
  uni.request({
    url: 'https://panyy.xyz/api/checkSessionKey',
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

function getUserData() {
  uni.request({
    url: `https://panyy.xyz/api/getUserData/${openid.value}`,
    success(res) {
      console.log('getUserData api/getUserData', res.data)

      userInfoStore.userLogin()
      if (res.data.data.length === 0) {
        uni.hideLoading()
        togglePopup(createUserPopup, true)
      }
      else {
        console.log('res.data.data[0]', res.data.data[0])

        userInfoStore.userInfo = res.data.data[0]
        // console.log('useUserStore().userInfo', useUserStore().userInfo)
        // console.log('userinfo', userInfo)

        uni.hideLoading()
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000,
        })
      }
    },
  })
}

function userLogin() {
  // 获取临时登录凭证
  uni.showLoading({
    title: '登录中...',
  })
  uni.login({
    provider: 'weixin',
    success(loginRes) {
      console.log('userLogin uni.login', loginRes)

      // 获取用户唯一标识ID和会话密钥
      uni.request({
        url: 'https://panyy.xyz/api/userLogin',
        method: 'POST',
        data: {
          code: loginRes.code,
        },
        success(result) {
          console.log('userLogin api/userLogin', result.data)
          console.log(result.data.openid)

          openid.value = result.data.openid
          getUserData()
        },
        fail(result) {
          uni.hideLoading()
          uni.showToast({
            title: '登录失败,请重试',
            icon: 'fail',
            duration: 2000,
          })
        },
      })
    },
  })
}

function createUser() {
  uni.showLoading({
    title: '注册中',
  })
  uni.request({
    url: `https://panyy.xyz/api/createUser/${openid.value}`,
    method: 'POST',
    data: {
      openid: openid.value,
      birth_date: createUserInfo.value.birth_date,
      weight: createUserInfo.value.weight,
      height: createUserInfo.value.height,
      nickname: createUserInfo.value.nickname,
      avatar_url: userInfoStore.userInfo.avatar_url,
      gender: createUserInfo.value.gender,
    },
    success(res) {
      console.log(res)
      uni.hideLoading()
      userInfoStore.getUserData()
      togglePopup(createUserPopup, false)
    },
  })
}

function cancelCreateUser() {
  uni.showLoading({
    title: '注册中',
  })
  console.log('openid.value', openid.value)

  uni.request({
    url: `https://panyy.xyz/api/createUser/${openid.value}`,
    method: 'POST',
    data: {
      openid: openid.value,
    },
    success(res) {
      console.log(res)
      uni.hideLoading()
      userInfoStore.getUserData()
      togglePopup(createUserPopup, false)
    },
  })
}

function navigateTo(path) {
  if (path.trim() !== '') {
    uni.navigateTo({
      url: path,
    })
  }
}

function handleNavClick(item) {
  switch (item.title) {
    case '个人信息':
      navigateTo(item.url)
      break
    case '退出登录':
      uni.showModal({
        title: '提示',
        content: '确定退出登录吗？',
        showCancel: true,
        success: (res) => {
          if (res.confirm) {
            userInfoStore.userLogOut()
            userInfoStore.initUserData()
          }
        },
      })
      break
    case '清空聊天记录':
      uni.showModal({
        title: '提示',
        content: '确定清空数据吗？',
        showCancel: true,
        success: ({ confirm, cancel }) => {
          if (confirm) {
            uni.removeStorage({ key: 'food_nutrition_chat_history' })
            uni.reLaunch({ url: '/pages/index/index' })
          }
        },
      })
  }
}

// 页面加载时获取用户信息
onMounted(async () => {
  uni.checkSession({
    success(result) {
      console.log('checkSession', result)
    },
  })
})
</script>

<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-info">
      <view class="left">
        <!-- 用户头像 -->
        <image class="avatar" :src="userInfoStore.userInfo.avatar_url" />
      </view>
      <view v-if="userInfoStore.isLogin" class="right">
        <!-- 用户昵称 -->
        <text v-if="userInfoStore.userInfo.nickname.includes('微信用户')" class="nickname">{{ userInfoStore.userInfo.nickname + userInfoStore.userInfo.id.slice(0, 5) }}</text>
        <text v-else class="nickname">{{ userInfoStore.userInfo.nickname }}</text>
      </view>
      <view v-else class="right" @click="userLogin">
        点击登录
      </view>
    </view>
    <!-- 选项列表 -->
    <view class="nav">
      <view v-for="(navItem, navItemIndex) in navList" :key="navItemIndex">
        <button
          v-if="userInfoStore.isLogin || navItem.title === '清空聊天记录'" class="nav-item"
          :class="navItem.titleClassName"
          @click="handleNavClick(navItem)"
        >
          <text class="nav-text">{{ navItem.title }}</text>
        </button>
      </view>
    </view>
    <!-- 创建新用户弹窗 -->
    <uni-popup
      ref="createUserPopup" type="bottom" background-color="#fff" borderRadius="20px 20px 0 0"
      immediate-change="false"
    >
      <view class="mt-4 text-center text-base">
        请输入基本信息
      </view>
      <view class="input-list">
        <!-- 用户名输入框 -->
        <uni-section type="line" title="用户名">
          <view class="input-item">
            <uni-easyinput v-model="createUserInfo.nickname" type="nickname" placeholder="请输入用户名" />
          </view>
        </uni-section>
        <!-- 性别选择框 -->
        <uni-section type="line" title="性别">
          <view class="input-item">
            <uni-data-select v-model="createUserInfo.gender" :localdata="genderOption" placeholder="请选择性别" />
          </view>
        </uni-section>
        <!-- 出生日期 -->
        <uni-section type="line" title="出生日期">
          <view class="input-item">
            <uni-datetime-picker v-model="createUserInfo.birth_date" type="date" :clear-icon="false" />
          </view>
        </uni-section>
        <!-- 身高输入框 -->
        <uni-section type="line" title="身高/cm">
          <view class="input-item">
            <uni-easyinput v-model="createUserInfo.height" type="text" placeholder="请输入身高/cm" />
          </view>
        </uni-section>
        <!-- 体重输入框 -->
        <uni-section type="line" title="体重/kg">
          <view class="input-item">
            <uni-easyinput v-model="createUserInfo.weight" type="text" placeholder="请输入体重/kg" />
          </view>
        </uni-section>
      </view>
      <view class="button-list grid grid-cols-2">
        <button class="mx-auto" @click="cancelCreateUser">
          稍后再填
        </button>
        <button class="mx-auto" @click="createUser">
          确 定
        </button>
      </view>
    </uni-popup>
  </view>
</template>

<style scoped>
.container {
  @apply bg-gray-100 p-3 space-y-4 h-screen;
}

.user-info {
  @apply rounded-md flex flex-row space-x-4;

  view {
    @apply rounded-md bg-white p-4 align-middle bg-white shadow shadow-gray-400;
  }

  .left {
    @apply basis-1/3;
  }

  .right {
    @apply basis-2/3;
  }
}

.avatar {
  @apply w-20 h-20 rounded-md align-middle;
}

.nickname {
  @apply text-lg align-top text-ellipsis;
}

.nav {
  @apply space-y-4 text-base;
}

.nav-item {
  @apply px-5 py-1 text-left rounded-md bg-white shadow shadow-gray-400;
}

.input-item {
  @apply relative mx-auto w-4/5;
}

.button-list {
  @apply pb-2 pt-6;

  button {
    @apply bg-white shadow rounded-md shadow-gray-400;
  }
}
</style>
