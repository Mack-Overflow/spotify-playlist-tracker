<template>
  <div ref="vantaRef" class="vanta-bg" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

let vantaEffect = null
const vantaRef = ref(null)

onMounted(async () => {
  // 1) Import three.js (ES module)
  const THREEmod = await import('three')
  const THREE = THREEmod.default || THREEmod

  // 2) Dynamically load the UMD bundle — it will put VANTA on window
  await import('vanta/dist/vanta.waves.min.js')

  // 3) Instantiate the effect
  vantaEffect = window.VANTA.WAVES({
    el: vantaRef.value,
    THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x226628
  })
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy()
})

onBeforeUnmount(() => {
  if (vantaEffect) vantaEffect.destroy();
});
</script>

<style scoped>
.vanta-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  margin: 0;
  padding: 0;
}
</style>
