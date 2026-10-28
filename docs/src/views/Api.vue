<template>
  <div>
    <h1>Referensi API</h1>
    
    <h2>1. <code>MiniMermaid.renderTo(target, source, options)</code></h2>
    <p>Merender langsung ke dalam DOM.</p>
    <CodeBlock language="javascript" :code="apiRenderTo" />

    <h2>2. <code>MiniMermaid.render(source, options)</code></h2>
    <p>Mengembalikan string SVG murni (Cocok untuk React/Vue).</p>
    <CodeBlock language="javascript" :code="apiRenderReact" />

    <h2>Opsi Konfigurasi (options)</h2>
    <ul>
      <li><code>edgeStyle</code>: Mengatur bentuk panah. Pilihan: <code>'smooth'</code>, <code>'step'</code>, <code>'straight'</code>. Default: <code>'smooth'</code>.</li>
      <li><code>getIcon</code>: Fungsi pengambil ikon. Disarankan menggunakan bawaan library: <code>MiniMermaid.getLucideIcon</code>.</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const apiRenderTo = `MiniMermaid.renderTo('#container', kodeMermaid, {
  edgeStyle: 'straight',
  getIcon: MiniMermaid.getLucideIcon
});`;

const apiRenderReact = `import { useEffect, useState } from 'react';
import MiniMermaid from 'minimermaid';

function DiagramComponent() {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    const { svg, errors } = MiniMermaid.render('->[round]->text["React"]');
    if (errors.length === 0) setSvg(svg);
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}`;
</script>