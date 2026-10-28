<template>
  <pre class="hljs-pre"><code ref="codeEl" class="hljs" :class="language"></code></pre>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import hljs from 'highlight.js';
// Gunakan tema gelap ala GitHub
import 'highlight.js/styles/github-dark.css'; 

const props = defineProps<{
  code: string;
  language?: string;
}>();

const codeEl = ref<HTMLElement | null>(null);

const highlight = () => {
  if (codeEl.value) {
    // Set teks mentah, lalu biarkan highlight.js mewarnainya
    codeEl.value.textContent = props.code;
    hljs.highlightElement(codeEl.value);
  }
};

onMounted(() => {
  highlight();
});

// Re-highlight jika code berubah secara dinamis (misal di Playground)
watch(() => props.code, () => {
  nextTick(highlight);
});
</script>

<style scoped>
.hljs-pre {
  margin: 0 0 16px 0;
  border-radius: 8px;
  border: 1px solid var(--border);
  overflow: hidden;
}

.hljs {
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13.5px;
  background: #0d1117 !important; /* Samakan dengan tema background kita */
  color: #c9d1d9;
}
</style>