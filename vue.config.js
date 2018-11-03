const WebpackCdnPlugin = require('webpack-cdn-plugin')
const express = require('express')

module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      },
    },
    setup (app) {
      app.use('/node_modules', express.static('./node_modules'))
    },
  },
  integrity: true,
  configureWebpack: {
    plugins: [
      new WebpackCdnPlugin({
        publicPath: '/node_modules',
        prod: process.env.NODE_ENV === 'production',
        modules: [
          { name: 'vue', var: 'Vue', path: 'dist/vue.runtime.min.js' },
          { name: 'vue-router', var: 'VueRouter', path: 'dist/vue-router.min.js' },
          { name: 'vuex', var: 'Vuex', path: 'dist/vuex.min.js' },
          { name: 'three', var: 'THREE', path: 'build/three.min.js' },
          { name: 'leaflet', var: 'L', path: 'dist/leaflet.js', style: 'dist/leaflet.css' },
          { name: 'axios', path: 'dist/axios.min.js' },
          {
            name: 'firebaseui',
            path: 'firebaseui.js',
            style: 'firebaseui.css',
            prodUrl: 'https://cdn.firebase.com/libs/firebaseui/:version/:path',
            devUrl: ':name/dist/:path',
          },
          {
            name: 'firebase',
            var: 'firebase',
            paths: [
              'firebase-app.js',
              'firebase-auth.js',
              'firebase-firestore.js',
              'firebase-functions.js',
            ],
            prodUrl: 'https://www.gstatic.com/firebasejs/:version/:path',
          },
        ],
      }),
    ]
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
}
