<template>
  <div>
    <h1>MiniMermaid <span class="badge">v1.2.0</span></h1>
    <p>Library TypeScript ringan untuk mengubah teks menjadi diagram SVG yang interaktif dan indah. Mendukung Flowchart, Swimlane, Sequence, Class, State, dan Network Graph.</p>

    <h2>Fitur Utama</h2>
    <ul>
      <li>🎨 <b>Custom Colors:</b> Beri warna spesifik pada node dengan <code>->[shape:red]</code>.</li>
      <li>✍️ <b>Rich Text:</b> Dukung format <b>Tebal</b>, <i>Miring</i>, dan <code>Kode</code> di dalam label.</li>
      <li>🔗 <b>Interactive Nodes:</b> Tambahkan URL (<code>->link["..."]</code>) dan Tooltip (<code>->tooltip["..."]</code>) ke node.</li>
      <li>📐 <b>6 Tipe Diagram:</b> Flowchart, Swimlane, Sequence, Class, State, dan Network Graph.</li>
    </ul>

    <h2>Instalasi</h2>
    <CodeBlock language="bash" :code="installCode" />

    <h2>Quick Start (JavaScript)</h2>
    <CodeBlock language="html" :code="quickStartCode" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const installCode = `npm install minimermaid
import MiniMermaid from 'minimermaid';`;

const quickStartCode = `<!-- HTML -->
<div id="diagram"></div>

// JavaScript
MiniMermaid.renderTo('#diagram', \`
  [horizontal]
  ->[round:green]->text["Status: **Aktif**"]->node
  ->[diamond:orange]->text["Cek *Sistem*?"]
\`);`;
</script>