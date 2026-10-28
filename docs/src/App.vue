<template>
  <div class="layout">
    <aside>
      <h2>MiniMermaid Docs</h2>
      <ul>
        <li><router-link to="/">Pengenalan & Instalasi</router-link></li>
        <li><router-link to="/syntax">Sintaks Diagram</router-link></li>
        <li><router-link to="/api">API & JavaScript</router-link></li>
        <li><router-link to="/playground">Live Playground</router-link></li>
        <li><router-link to="/about">Tentang Proyek</router-link></li> <!-- Menu Baru -->
      </ul>
    </aside>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
.router-link-active {
  color: var(--accent);
  background: rgba(88, 166, 255, 0.1);
  font-weight: 600;
}
</style>