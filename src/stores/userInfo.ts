import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('counter', () => {
  const userInfo = ref({
    id: '',
    openid: '',
    avatar_url: '../../static/img/default-avatar.jpg',
    nickname: '未登录',
    gender: 0,
    points: '0',
    level: '0',
    birth_date: '',
    height: '',
    weight: '',
    name: '',
    phone: '',
    qq: '',
  })

  const StringGender = computed(() => {
    const map = { 0: '保密', 1: '男', 2: '女' }
    return map[userInfo.value.gender]
  })

  function getUserData() {
    uni.request({
      url: `http://localhost:3000/api/getUserData/${userInfo.value.openid}`,
      success(res) {
        console.log('getUserData api/getUserData', res.data)

        if (res.data.data.length === 0) {
          uni.hideLoading()
        }
        else {
          console.log('res.data.data[0]', res.data.data[0])

          userInfo.value = res.data.data[0]

          // console.log('useUserStore().userInfo', useUserStore().userInfo)
          // console.log('userinfo', userInfo)
        }
      },
    })
  }

  return { userInfo, getUserData, StringGender }
})
