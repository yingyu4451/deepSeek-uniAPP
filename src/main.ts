import * as Pinia from 'pinia'
import { createSSRApp } from 'vue'
import App from './App.vue'
import { useUserStore } from './stores/userInfo'

export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  const userStore = useUserStore()
  return {
    app,
    Pinia,
    userStore,
  }
}
