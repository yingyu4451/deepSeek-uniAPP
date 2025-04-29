<script setup lang="ts">
onLaunch(() => {
  console.log('App Launch')
  const updateManager = uni.getUpdateManager()

  updateManager.onCheckForUpdate((res) => {
  // 请求完新版本信息的回调
    if (res.hasUpdate) {
      updateManager.onUpdateReady(() => {
        uni.showToast({
          title: '发现新版本',
          success() {
            updateManager.applyUpdate()
          },
        })
      })
    }
  })
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@use 'tailwindcss/base';
@use 'tailwindcss/components';
@use 'tailwindcss/utilities';

button::after {
  @apply border-none;
}

/*  #ifdef  H5  */
svg {
  display: initial;
}

/*  #endif  */

@layer components {
  .raw-btn {
    // 注意 after: 后面不能加任何空格，有些格式化工具可能会在这里自动加一个空格
    @apply after:border-none inline-flex items-center gap-2 rounded text-sm font-semibold transition-all;
  }

  .btn {
    // 使用上面定义的 raw-btn
    @apply raw-btn bg-gradient-to-r from-[#9e58e9] to-blue-500 px-2 py-1 text-white;
  }
}
</style>
