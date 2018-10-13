<template>
  <div id="visualization-container"></div>
</template>

<script>
import visualizationDrawer from '@/visualizations'
export default {
  name: 'Visualization',
  mounted () {
    visualizationDrawer(this.$el)
  }
}
</script>

<style scoped>
  #visualization-container {
    height: 100%;
    width: 100%;
  }
</style>
