<template>
  <div>
    <h1>Live Playground</h1>
    <p>Ubah kode di kiri, diagram di kanan akan ter-update secara reaktif.</p>
    
    <div class="playground">
      <textarea v-model="code" spellcheck="false"></textarea>
      <div ref="previewEl" class="playground-preview"></div>
    </div>

    <h2 style="margin-top: 40px;">Kode JavaScript yang Dijalankan:</h2>
    <CodeBlock language="javascript" :code="jsOutput" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import CodeBlock from '../components/CodeBlock.vue';
import MiniMermaid from 'minimermaid';

// Kode default sekarang menggunakan fitur Warna, Rich Text, dan Interaktif
const code = ref(`[horizontal]
[group "Sistem Autentikasi"]
  [cabang]->[diamond:orange]->text["Cek *Kredensial*?"]
    ->ya["Valid"]
      ->[round:green]->text["Login **Sukses**"]->node
      ->[square]->text["Dashboard Admin"]
    ->tidak["Invalid"]
      ->[square:red]->text["Akses Ditolak"]->node
      ->[square]->text["Buka Halaman Login"]->link["https://example.com/login"]->tooltip["Kembali ke Login"]`);

const previewEl = ref<HTMLElement | null>(null);
const jsOutput = ref('');

const renderDiagram = () => {
  if (!previewEl.value) return;
  
  MiniMermaid.renderTo(previewEl.value, code.value, {
    edgeStyle: 'smooth',
    getIcon: MiniMermaid.getLucideIcon
  });

  jsOutput.value = `MiniMermaid.renderTo(previewEl, \`${code.value}\`, {
  edgeStyle: 'smooth',
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