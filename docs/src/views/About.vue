<template>
  <div>
    <h1>Tentang MiniMermaid</h1>
    <p>MiniMermaid adalah library diagram teks-ke-SVG yang ringan, cepat, dan dibuat khusus untuk developer. Mengambil inspirasi dari Mermaid.js, library ini dirancang agar dapat berjalan tanpa dependensi framework apa pun, sehingga bisa disisipkan ke proyek HTML biasa, React, Vue, maupun Node.js.</p>

    <h2>Fitur Unggulan</h2>
    <ul>
      <li><b>Percabangan Bertingkat (Nested):</b> Buat bagan keputusan kompleks dengan indentasi sederhana.</li>
      <li><b>Grouping:</b> Bungkus node ke dalam kotak penjelas tanpa memutus alur panah.</li>
      <li><b>Ikon Lucide:</b> Suntikkan ribuan ikon SVG open-source langsung ke dalam node.</li>
      <li><b>Gaya Panah Fleksibel:</b> Pilih antara garis mulus (smooth), siku (step), atau lurus (straight).</li>
      <li><b>Zero DOM Dependencies (Core):</b> Logika parsing dan layout murni berjalan di atas string, memudahkan pengujian dan rendering server-side.</li>
    </ul>

    <h2>Teknologi yang Digunakan</h2>
    <div class="tech-stack">
      <div class="tech-item">
        <strong>TypeScript</strong>
        <span>Bahasa utama (strict mode)</span>
      </div>
      <div class="tech-item">
        <strong>SVG</strong>
        <span>Format rendering diagram</span>
      </div>
      <div class="tech-item">
        <strong>Lucide</strong>
        <span>Penyedia ikon vektor</span>
      </div>
      <div class="tech-item">
        <strong>Vue 3 & Vite</strong>
        <span>Dokumentasi interaktif ini</span>
      </div>
    </div>

    <h2>Lisensi</h2>
    <p>Proyek ini bersifat open-source dan dilisensikan di bawah <b>MIT License</b>. Anda bebas menggunakannya untuk keperluan pribadi maupun komersial.</p>
  </div>
</template>

<style scoped>
.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.tech-item {
  background: var(--panel);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.tech-item strong {
  color: var(--accent);
  font-size: 16px;
  margin-bottom: 4px;
}

.tech-item span {
  color: var(--muted);
  font-size: 13px;
}
</style>