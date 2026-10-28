<template>
  <div>
    <h1>Contoh Proyek: Arsitektur Perangkat Lunak</h1>
    <p>Studi kasus ini mendemonstrasikan penggunaan <b>Network Graph</b> untuk memetakan hubungan antar *service*, dan <b>Sequence Diagram</b> untuk memodelkan alur komunikasi data.</p>

    <h2>1. Network Graph (Arsitektur)</h2>
    <CodeBlock language="mermaid" :code="networkCode" />
    <LiveDiagram :code="networkCode" />

    <h2>2. Sequence Diagram (Alur API)</h2>
    <CodeBlock language="mermaid" :code="sequenceCode" />
    <LiveDiagram :code="sequenceCode" />
  </div>
</template>

<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';
import LiveDiagram from '../components/LiveDiagram.vue';

const networkCode = `[network]
be : "Backend API"
fe : "Frontend (React)"
db : "Database SQL"
cache : "Redis Cache"
queue : "RabbitMQ"
auth : "Auth Service"

fe --- be : "REST API"
be --> db : "Baca/Tulis"
be --> cache : "Caching"
be --> queue : "Publish Event"
be --> auth : "Validasi Token"
auth --> db : "Cek User"`;

const sequenceCode = `[sequence]
participant Pengguna
participant API
participant Database

Pengguna -> API: POST /login
API -> Database: SELECT * FROM users
Database --> API: Data User
API --> Pengguna: 200 OK (Token JWT)

Pengguna -> API: GET /profile
API --> Pengguna: 200 OK (Data Profil)`;
</script>