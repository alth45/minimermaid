<template>
  <div>
    <h1>Panduan Sintaks</h1>
    <p>Semua diagram ditulis menggunakan teks murni dengan aturan indentasi yang ketat.</p>

    <h2>1. Node & Bentuk Dasar</h2>
    <CodeBlock language="mermaid" :code="basicSyntax" />

    <h2>2. Percabangan Bertingkat (Nested)</h2>
    <CodeBlock language="mermaid" :code="nestedSyntax" />

    <h2>3. Grouping (Kotak Pembungkus)</h2>
    <CodeBlock language="mermaid" :code="groupSyntax" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const basicSyntax = `->[round]->text["Mulai"]->node
->[diamond]->icon["help-circle"]->text["Cek Data?"]`;

const nestedSyntax = `[cabang]->[diamond]->text["Login?"]
  ->ya["Ya"]
    [cabang]->[diamond]->text["Admin?"]
      ->ya["Ya"]
        ->[square]->text["Dashboard"]
      ->tidak["Tidak"]
        ->[square]->text["Home"]
  ->tidak["Tidak"]
    ->[square]->text["Gagal"]`;

const groupSyntax = `[group "Sistem Database"]
  ->[cylinder]->icon["database"]->text["PostgreSQL"]`;
</script>