<template>
  <div>
    <h1>Live Playground</h1>
    <p>Ubah kode di kiri, diagram di kanan akan ter-update secara reaktif.</p>
    
    <div class="playground">
      <textarea v-model="code" spellcheck="false"></textarea>
      <div ref="previewEl" class="playground-preview"></div>
    </div>

    <h2 style="margin-top: 40px;">Kode JavaScript yang Dijalankan:</h2>
    <!-- Gunakan CodeBlock di sini -->
    <CodeBlock language="javascript" :code="jsOutput" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';
import MiniMermaid from 'minimermaid';

const code = ref(`[group "Core System"]
  [cabang]->[diamond]->icon["shield"]->text["Autentikasi?"]
    ->ya["Ya"]
      ->[round]->icon["check"]->text["Akses Diterima"]
    ->tidak["Tidak"]
      ->[hexagon]->icon["alert-triangle"]->text["Blokir IP"]`);

const previewEl = ref<HTMLElement | null>(null);
const jsOutput = ref('');

const renderDiagram = () => {
  if (!previewEl.value) return;
  
  MiniMermaid.renderTo(previewEl.value, code.value, {
    edgeStyle: 'step',
    getIcon: MiniMermaid.getLucideIcon
  });

  // Update string JS output agar ter-highlight
  jsOutput.value = `MiniMermaid.renderTo(previewEl, \`${code.value}\`, {
  edgeStyle: 'step',
  getIcon: MiniMermaid.getLucideIcon
});`;
};

onMounted(() => renderDiagram());

let timeout: any;
watch(code, () => {
  clearTimeout(timeout);
  timeout = setTimeout(renderDiagram, 300);
});
</script>