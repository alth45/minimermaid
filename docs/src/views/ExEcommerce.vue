<template>
  <div>
    <h1>Contoh Proyek: Alur E-Commerce</h1>
    <p>Studi kasus ini mendemonstrasikan penggunaan <b>Swimlane</b> (pemisahan aktor), <b>Grouping</b>, <b>Warna Kustom</b>, dan <b>Rich Text</b> dalam satu diagram alur pemesanan barang.</p>

    <h2>Kode Diagram</h2>
    <CodeBlock language="mermaid" :code="code" />

    <h2>Hasil Render</h2>
    <LiveDiagram :code="code" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';
import LiveDiagram from '../components/LiveDiagram.vue';

const code = `[horizontal]

[lane "Pelanggan"]
  ->[round]->icon["user"]->text["Mulai"]->node
  ->[square]->icon["shopping-cart"]->text["Pesan Barang"]->node
  ->[square:green]->icon["package-check"]->text["Terima Barang"]

[lane "Sistem"]
  [group "Payment Gateway"]
    [cabang]->[diamond:orange]->icon["credit-card"]->text["Pembayaran?"]
      ->ya["Lunas"]
        ->[square]->icon["check-circle"]->text["Validasi"]->node
        ->[square]->icon["truck"]->text["Pilih Kurir"]
      ->tidak["Gagal"]
        ->[square:red]->icon["x-circle"]->text["Batalkan"]

[lane "Gudang"]
  ->[square]->icon["box"]->text["Kemas Barang"]->node
  ->[square]->text["Serah Terima"]`;
</script>