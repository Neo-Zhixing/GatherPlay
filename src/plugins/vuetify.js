import Vue from 'vue'
import {
  Vuetify,
  VApp,
  VNavigationDrawer,
  VFooter,
  VList,
  VBtn,
  VIcon,
  VGrid,
  VToolbar,
  VProgressCircular,
  VDialog,
  VCard,
  VAvatar,
  VDivider,
  VAutocomplete,
  VSubheader,
  VMenu,
  VTextField,
  VChip,
  transitions
} from 'vuetify'
import 'vuetify/src/stylus/app.styl'

Vue.use(Vuetify, {
  components: {
    VApp,
    VNavigationDrawer,
    VFooter,
    VList,
    VBtn,
    VIcon,
    VGrid,
    VToolbar,
    VProgressCircular,
    VDialog,
    VCard,
    VAvatar,
    VDivider,
    VAutocomplete,
    VSubheader,
    VMenu,
    VTextField,
    VChip,
    transitions
  },
  theme: {
    primary: '#000000',
    secondary: '#FAFAFA',
    accent: '#000000',
    error: '#000000',
    warning: '#000000',
    info: '#000000',
    success: '#000000'
  },
  customProperties: true,
  iconfont: 'md',
})
