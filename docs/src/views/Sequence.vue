<template>
  <div>
    <h1>Sequence Diagram</h1>
    <p>Sequence Diagram digunakan untuk memodelkan interaksi antar objek (atau aktor) dalam urutan waktu tertentu. MiniMermaid mendeteksi direktif <code>[sequence]</code> di baris pertama dan secara otomatis beralih ke <i>engine rendering</i> khusus sequence.</p>

    <h2>1. Partisipan (Aktor)</h2>
    <p>Anda bisa mendefinisikan aktor secara eksplisit menggunakan kata kunci <code>participant</code> atau <code>actor</code>, beserta alias (nama tampilan) menggunakan kata kunci <code>as</code>.</p>
    
    <CodeBlock language="mermaid" :code="seqParticipant" />

    <h2>2. Interaksi Antar Aktor</h2>
    <p>Gunakan format <code>AktorA -> AktorB: Pesan</code> untuk membuat panah panggilan (solid).</p>
    <p>Gunakan format <code>AktorA --> AktorB: Pesan</code> untuk membuat panah kembalian (putus-putus).</p>

    <CodeBlock language="mermaid" :code="seqInteraction" />

    <h2>3. Contoh Lengkap</h2>
    <p>Berikut adalah contoh alur autentikasi pengguna yang melibatkan tiga aktor. Perhatikan bahwa aktor yang tidak dideklarasikan secara eksplisit akan dibuatkan kotaknya secara otomatis.</p>


        <h2>4. Blok Loop (Perulangan)</h2>
    <p>Gunakan <code>loop [Label]</code> dan tutup dengan <code>end</code> untuk membungkus interaksi ke dalam sebuah kotak perulangan. Mendukung juga <i>self-message</i> (Aktor mengirim pesan ke dirinya sendiri).</p>

    <CodeBlock language="mermaid" :code="seqFull" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const seqParticipant = `[sequence]
participant U as "Pengguna"
participant S as "Sistem Utama"
actor DB as "Database"`;

const seqInteraction = `[sequence]
Pengguna -> Sistem: Login Request
Sistem --> Pengguna: Login Berhasil`;

const seqFull = `[sequence]
participant Pengguna
participant Sistem
participant Database

Pengguna -> Sistem: Login Request
Sistem -> Database: Cek Kredensial
Database --> Sistem: Data Valid
Sistem --> Pengguna: Login Berhasil

Pengguna -> Sistem: Ambil Data
Sistem -> Database: Query SELECT
Database --> Sistem: Hasil Query
Sistem --> Pengguna: Tampilkan Data`;
</script>