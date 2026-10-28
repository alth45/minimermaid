<template>
  <div>
    <h1>Swimlane Diagram</h1>
    <p>Swimlane (Bagan Lintas) digunakan untuk memetakan proses bisnis yang melibatkan beberapa aktor atau departemen yang berbeda. Setiap aktor memiliki "jalur" (lane) tersendiri.</p>

    <h2>1. Cara Penggunaan</h2>
    <p>Gunakan direktif <code>[lane "Nama Aktor"]</code> diikuti dengan indentasi (spasi). Semua node di bawah indentasi tersebut akan dimasukkan ke dalam kotak lane yang bersangkutan.</p>
    
    <CodeBlock language="mermaid" :code="swimlaneBasic" />

    <h2>2. Kombinasi dengan Fitur Lain</h2>
    <p>Swimlane sangat cocok digabungkan dengan arah <code>[horizontal]</code> dan fitur <b>Grouping</b> atau <b>Percabangan</b> (Cabang) di dalamnya.</p>

    <CodeBlock language="mermaid" :code="swimlaneAdvanced" />

    <h2>3. Tips</h2>
    <ul>
      <li>Karena lane membentang secara horizontal, sangat disarankan menggunakan direktif <code>[horizontal]</code> di baris paling atas agar lane tersusun ke bawah seperti tabel.</li>
      <li>Gunakan <code>->node</code> untuk menyambungkan alur dari satu lane ke lane lainnya.</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const swimlaneBasic = `[horizontal]

[lane "Customer"]
  ->[round]->text["Pesan Makanan"]

[lane "Restoran"]
  ->[square]->text["Masak Makanan"]

[lane "Kurir"]
  ->[square]->text["Antar Makanan"]`;

const swimlaneAdvanced = `[horizontal]

[lane "Pelanggan"]
  ->[round]->text["Mulai"]->node
  ->[square]->icon["shopping-cart"]->text["Pesan Barang"]->node
  ->[square]->icon["package-check"]->text["Terima Barang"]

[lane "Sistem"]
  [group "Payment Gateway"]
    [cabang]->[diamond]->icon["credit-card"]->text["Pembayaran?"]
      ->ya["Lunas"]
        ->[square]->icon["check-circle"]->text["Validasi"]->node
        ->[square]->icon["truck"]->text["Pilih Kurir"]
      ->tidak["Gagal"]
        ->[square]->icon["x-circle"]->text["Batalkan"]

[lane "Gudang"]
  ->[square]->icon["box"]->text["Kemas Barang"]->node
  ->[square]->text["Serah Terima"]`;
</script>