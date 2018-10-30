import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/event/:event_id',
      name: 'event',
      component: () => import(/* webpackChunkName: "event" */ './views/Event.vue'),
    },
    {
      path: '/',
      name: 'visualization',
      component: () => import(/* webpackChunkName: "visualization" */ './views/Visualization.vue'),
    }
  ]
})
