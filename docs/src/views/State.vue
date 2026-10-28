<template>
  <div>
    <h1>State Diagram</h1>
    <p>State Diagram digunakan untuk memodelkan siklus hidup sebuah objek (seperti pesanan, pengguna, atau sistem) beserta transisi yang terjadi di antara status-status tersebut.</p>

    <h2>1. Sintaks Dasar</h2>
    <p>Gunakan direktif <code>[state]</code>, lalu definisikan transisi dengan format <code>Asal --> Tujuan : Label</code>.</p>
    <p>Gunakan <code>[*]</code> untuk menandai titik mulai (start) dan titik akhir (end).</p>
    
    <CodeBlock language="mermaid" :code="stateBasic" />

    <h2>2. Siklus Kompleks</h2>
    <p>MiniMermaid akan secara otomatis menata state dalam bentuk lingkaran (circular layout) agar transisi yang berulang (loop) tetap terlihat rapi.</p>

    <CodeBlock language="mermaid" :code="stateComplex" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';

const stateBasic = `[state]
[*] --> Idle
Idle --> Processing : Start
Processing --> [*] : Done`;

const stateComplex = `[state]
[*] --> Pending
Pending --> Paid : Confirm Payment
Paid --> Shipped : Ship Item
Shipped --> Delivered : Arrive
Delivered --> [*]

Pending --> Cancelled : Cancel Order
Paid --> Cancelled : Refund
Cancelled --> [*]`;
</script>