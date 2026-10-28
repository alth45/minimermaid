<template>
  <div class="layout">
    <aside>
      <h2>MiniMermaid Docs</h2>
      <ul>
        <li><router-link to="/">Pengenalan</router-link></li>
        
        <li class="menu-category">Tipe Diagram</li>
        <li><router-link to="/syntax">Flowchart (Dasar)</router-link></li>
        <li><router-link to="/swimlane">Swimlane Diagram</router-link></li>
        <li><router-link to="/sequence">Sequence Diagram</router-link></li>
        
        <li class="menu-category">Contoh Proyek</li>
        <li><router-link to="/examples/ecommerce">Alur E-Commerce</router-link></li>
        <li><router-link to="/examples/software">Arsitektur Software</router-link></li>
        <li><router-link to="/examples/uml">Desain Sistem (UML)</router-link></li>
        
        <li class="menu-category">Referensi</li>
        <li><router-link to="/api">API & JavaScript</router-link></li>
        <li><router-link to="/playground">Live Playground</router-link></li>
        <li><router-link to="/about">Tentang Proyek</router-link></li>
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

.menu-category {
  color: var(--muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 24px;
  margin-bottom: 8px;
  padding-left: 8px;
  font-weight: 700;
}
</style>