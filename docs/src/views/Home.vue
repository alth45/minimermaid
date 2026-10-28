<template>
  <div>
    <h1>MiniMermaid <span class="badge">v1.0.0</span></h1>
    <p>Library TypeScript ringan untuk mengubah teks menjadi diagram SVG. Mendukung percabangan bertingkat, ikon, dan grouping tanpa dependensi framework.</p>

    <h2>Instalasi (NPM)</h2>
    <CodeBlock language="bash" :code="installCode" />

    <h2>Quick Start (JavaScript)</h2>
    <CodeBlock language="html" :code="quickStartCode" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const installCode = `npm install minimermaid
import MiniMermaid from 'minimermaid';`;

// PERBAIKAN: Hapus tag <script> literal agar tidak dibaca sebagai penutup blok oleh Vite
const quickStartCode = `<!-- HTML -->
<div id="diagram"></div>

// JavaScript
MiniMermaid.renderTo('#diagram', \`
  ->[round]->text["Mulai"]->node
  ->[diamond]->text["Selesai?"]
\`);`;
</script>