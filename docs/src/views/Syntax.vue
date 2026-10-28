<template>
  <div>
    <h1>Panduan Sintaks Flowchart</h1>
    <p>Semua diagram ditulis menggunakan teks murni dengan aturan indentasi yang ketat.</p>

    <h2>1. Node & Bentuk Dasar</h2>
    <p>Format: <code>->[bentuk]->icon["nama"]->text["Label"]->node</code></p>
    <CodeBlock language="mermaid" :code="basicSyntax" />

    <h2>2. Percabangan (Wajib [cabang])</h2>
    <p>Gunakan <code>[cabang]</code> diikuti indentasi untuk membuat dua sisi.</p>
    <CodeBlock language="mermaid" :code="nestedSyntax" />

    <h2>3. Rich Text (Tebal, Miring, Kode)</h2>
    <p>Gunakan sintaks Markdown sederhana untuk mempercantik teks di dalam node.</p>
    <CodeBlock language="mermaid" :code="richText" />

    <h2>4. Warna Kustom (Custom Colors)</h2>
    <p>Tambahkan titik dua dan nama warna (atau kode Hex) di dalam kurung bentuk.</p>
    <CodeBlock language="mermaid" :code="customColors" />

    <h2>5. Node Interaktif (Link & Tooltip)</h2>
    <p>Buat node bisa diklik dengan <code>->link["url"]</code>, dan tambahkan pesan hover dengan <code>->tooltip["pesan"]</code>.</p>
    <CodeBlock language="mermaid" :code="interactive" />

    <h2>6. Grouping (Kotak Pembungkus)</h2>
    <CodeBlock language="mermaid" :code="groupSyntax" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const basicSyntax = `->[round]->text["Mulai"]->node
->[diamond]->icon["help-circle"]->text["Cek Data?"]`;

const nestedSyntax = `[cabang]->[diamond]->text["Login?"]
  ->ya["Ya"]
    ->[square]->text["Dashboard"]
  ->tidak["Tidak"]
    ->[square]->text["Gagal"]`;

const richText = `->[round]->text["Status: **AKTIF**"]->node
->[diamond]->text["Cek *Koneksi*\\nDatabase?"]->node
->[square]->text["Ping \`192.168.1.1\`"]`;

const customColors = `->[round:green]->text["Sukses"]
->[square:red]->text["Error"]
->[triangle:#ff5722]->text["Peringatan"]`;

const interactive = `->[square]->text["Google"]
  ->link["https://google.com"]
  ->tooltip["Buka mesin pencari"]`;

const groupSyntax = `[group "Sistem Database"]
  ->[cylinder]->icon["database"]->text["PostgreSQL"]`;
</script>