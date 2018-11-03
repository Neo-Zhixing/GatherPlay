import Vue from 'vue'
import Router from 'vue-router'
import store from '@/store'
Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/e/:event_id',
      name: 'event',
      components: {
        default: () => import(/* webpackChunkName: "event" */ '@/views/Event.vue'),
        nav: () => import(/* webpackChunkName: "event" */ '@/components/EventNavDrawer.vue'),
      }
    },
    {
      path: '/nearby',
      name: 'nearby',
      component: () => import(/* webpackChunkName: "event" */ '@/views/Nearby.vue')
    },
    {
      path: '/',
      name: 'visualization',
      component: () => import(/* webpackChunkName: "event" */ '@/views/Visualization.vue'),
    },
  ]
})
router.afterEach((to, from) => {
  const title = to.meta.title
  const titleToSet = typeof title === "function" ? title() : title
  document.title = (titleToSet ? (titleToSet + ' - ') : '') + 'GatherPlay'
  if (title !== null) store.commit('updateTitle', titleToSet || 'Gather Play')
})
export default router
