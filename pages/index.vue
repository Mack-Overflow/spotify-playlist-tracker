<script setup lang="ts">
import PlaylistComponent from '~/components/PlaylistComponent.vue';

</script>

<template>
    <VantaBackground />
  
    <PlaylistComponent />
  </template>
  
  <style scoped>  
  .site-title {
    font-family: "Ancizar Sans", sans-serif;
    font-weight: 200;
    font-size: 1.5rem;
    color: white;
    text-underline-offset: 4px;
    text-decoration-thickness: 2px;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  </style>