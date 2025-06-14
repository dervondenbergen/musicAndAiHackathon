import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SoundscapeView from '../views/SoundscapeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/soundscape/:uuid',
      name: 'soundscape',
      component: SoundscapeView,
      props: true,
    },
  ],
})

export default router
