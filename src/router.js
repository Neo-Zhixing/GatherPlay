import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
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
