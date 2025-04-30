<script setup lang="ts">
import { useUserStore } from '@/stores/userInfo'
import { ref } from 'vue'

const updateUserPopup = ref()

const userInfoStore = useUserStore()

const navList = ref([
  { title: `用户名`, icon: '', value: '', key: 'nickname' },
  { title: `性 别`, icon: '', value: '', key: 'gender' },
  { title: `手机号`, icon: '', value: '', key: 'phone' },
  { title: `出生日期`, icon: '', value: '', key: 'birth_date' },
  { title: `身 高`, icon: '', value: '', key: 'height' },
  { title: `体 重`, icon: '', value: '', key: 'weight' },
])

const currentNavSelect = ref({
  key: '',
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

function updateUserData() {
  const updateKey = currentNavSelect.value.key
  uni.request({
    url: `https://panyy.xyz/api/updateUserData/${userInfoStore.userInfo.openid}`,
    method: 'POST',
    data: {
      [updateKey]: currentNavSelect.value.value,
    },
    success(result) {
      console.log('updateUserData', result)
      userInfoStore.getUserData()
      togglePopup(updateUserPopup, false)
    },
  })
}

function getFileData(tempPath) {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath: tempPath,
      encoding: 'base64', // 或 'binary' 获取ArrayBuffer
      success: (res) => {
        resolve(res.data)
      },
      fail: reject,
    })
  })
}

async function onChooseAvatar(e) {
  console.log(e)

  const { avatarUrl } = e.detail
  userInfoStore.userInfo.avatar_url = avatarUrl

  const { tempFilePath } = await uni.downloadFile({
    url: avatarUrl,
  })
  // 2. 读取文件为 Base64 或 ArrayBuffer
  const fileData = getFileData(tempFilePath)

  console.log('onChooseAvatar filedata', fileData)

  // 3. 准备上传数据
  const formData = {
    file: `data:image/jpeg;base64,${fileData}`,
    fileName: `avatar/${userInfoStore.userInfo.openid}.jpg`,
    fileType: 'image/jpeg',
  }

  // 4. 调用 Nuxt3 API 上传到 Supabase
  try {
    const response = await uni.request({
      url: 'https://panyy.xyz/api/uploadImage', // 替换为你的 Nuxt3 API 地址
      method: 'POST',
      data: formData,
      header: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加你的认证头
      },
    })

    console.log('上传成功:', response.data)
    // 处理成功响应
  }
  catch (error) {
    console.error('上传失败:', error)
    // 处理错误
  }
}

function editInfo(infoItem) {
  console.log(infoItem)

  currentNavSelect.value = infoItem
  togglePopup(updateUserPopup, true)
}
</script>

<template>
  <view class="container">
    <view class="nav">
      <view
        class="nav-item"
      >
        <text class="nav-text">头 像</text>
        <button
          class="justify-self-end "
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            class="size-20 rounded-md align-middle"
            :src="userInfoStore.userInfo.avatar_url"
          />
        </button>
      </view>
      <view
        v-for="(navItem, navItemIndex) in navList" :key="navItemIndex" class="nav-item"
        @click="editInfo(navItem)"
      >
        <text class="nav-text">{{ navItem.title }}</text>
        <text v-if="navItem.key !== 'gender'" class="nav-text justify-self-end">{{ userInfoStore.userInfo[navItem.key] || '未填写' }}</text>
        <text v-else class="nav-text justify-self-end">{{ userInfoStore.StringGender || '未填写' }}</text>
      </view>
    </view>
  </view>
  <uni-popup
    ref="updateUserPopup" type="bottom" background-color="#fff" borderRadius="20px 20px 0 0"
    immediate-change="false"
  >
    <view class="mt-4 text-center text-base">
      请输入基本信息
    </view>
    <view class="input-list">
      <!-- 性别选择框 -->
      <uni-section v-if="currentNavSelect.key === 'gender'" type="line" title="性别">
        <view class="input-item">
          <uni-data-select v-model="currentNavSelect.value" :localdata="genderOption" placeholder="请选择性别" />
        </view>
      </uni-section>
      <!-- 出生日期 -->
      <uni-section v-if="currentNavSelect.key === 'birth_date'" type="line" title="出生日期">
        <view class="input-item">
          <uni-datetime-picker v-model="currentNavSelect.value" type="date" :clear-icon="false" />
        </view>
      </uni-section>
      <!-- 用户名输入框 -->
      <uni-section v-if="!['gender', 'birth_date'].includes(currentNavSelect.key)" type="line" :title="currentNavSelect.title">
        <view class="input-item">
          <uni-easyinput v-model="currentNavSelect.value" type="nickname" placeholder="请输入用户名" />
        </view>
      </uni-section>
    </view>
    <view class="button-list grid grid-cols-2">
      <button class="mx-auto" @click="togglePopup(updateUserPopup, false)">
        取消
      </button>
      <button class="mx-auto" @click="updateUserData">
        确 定
      </button>
    </view>
  </uni-popup>
</template>

<style scoped>
.container {
  @apply bg-gray-100 p-3 space-y-4;
}

.nav {
  @apply space-y-4 text-base;
}

.nav-item {
  @apply grid grid-cols-2 py-4 px-5 text-left rounded-md bg-white shadow shadow-gray-400;
}

button {
  @apply p-0 m-0 bg-none;
}
</style>
