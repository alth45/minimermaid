<template>
  <div class="live-diagram-wrapper">
    <div ref="canvasEl" class="live-diagram-canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MiniMermaid from 'minimermaid';

const props = defineProps<{ code: string }>();
const canvasEl = ref<HTMLElement | null>(null);

onMounted(() => {
  if (canvasEl.value) {
    MiniMermaid.renderTo(canvasEl.value, props.code, {
      edgeStyle: 'smooth',
      getIcon: MiniMermaid.getLucideIcon
    });
  }
});
</script>

<style scoped>
.live-diagram-wrapper {
  background: #0d1117;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  /* Latar belakang titik-titik ala canvas */
  background-image: radial-gradient(circle at 1px 1px, #21262d 1px, transparent 0);
  background-size: 22px 22px;
}
.live-diagram-canvas {
  width: 100%;
  min-height: 300px;
}
</style>