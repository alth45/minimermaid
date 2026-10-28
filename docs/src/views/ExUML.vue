<template>
  <div>
    <h1>Contoh Proyek: Desain Sistem (UML)</h1>
    <p>Studi kasus ini mendemonstrasikan <b>Class Diagram</b> untuk memodelkan struktur data, dan <b>State Diagram</b> untuk melacak siklus hidup sebuah entitas.</p>

    <h2>1. Class Diagram (Struktur)</h2>
    <CodeBlock language="mermaid" :code="classCode" />
    <LiveDiagram :code="classCode" />

    <h2>2. State Diagram (Siklus Hidup)</h2>
    <CodeBlock language="mermaid" :code="stateCode" />
    <LiveDiagram :code="stateCode" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';
import LiveDiagram from '../components/LiveDiagram.vue';

const classCode = `[class]
class Kendaraan {
  +String mesin
  +start()
  +stop()
}

class Mobil {
  +int pintu
  +bukaJendela()
}

class Motor {
  +bool adaSideMirror
  +wheelie()
}

Kendaraan <|-- Mobil
Kendaraan <|-- Motor
note for Motor "Motor bisa menyelip\\ndi jalan macet"`;

const stateCode = `[state]
[*] --> Draft : Buat Artikel
Draft --> Review : Kirim ke Editor

Review : Menunggu Persetujuan
Review --> Published : Setujui
Review --> Draft : Revisi

Published : Artikel Tayang
Published --> Archived : Arsipkan
Archived --> [*]`;
</script>