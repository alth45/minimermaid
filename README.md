
# MiniMermaid — Diagram dari Teks

> Library *Diagram-as-Code* (TypeScript) yang ringan dan interaktif. Ubah teks sederhana menjadi diagram SVG yang indah, mendukung **9 jenis diagram**, ikon, tema terang/gelap, ekspor/impor dokumen, dan editor node visual — semua tanpa dependensi framework.

![Stack](https://img.shields.io/badge/TypeScript-strict-blue)
![Build](https://img.shields.io/badge/build-Vite%207-646CFF)
![Docs](https://img.shields.io/badge/docs-Vue%203-42b883)
![Diagrams](https://img.shields.io/badge/diagrams-9-brightgreen)
![Theme](https://img.shields.io/badge/theme-dark%20%2F%20light-purple)

---

## ✨ Fitur Utama

### Diagram & Sintaks
- **9 Tipe Diagram**: Flowchart, Swimlane, Sequence, Class (UML), State, Network Graph, **ER**, **Mindmap**, **Timeline**.
- **Interactive Nodes**: URL (`->link["..."]`) dan tooltip hover (`->tooltip["..."]`) langsung di dalam node.
- **Inline Styling**: Warna custom per-node (`[square:red]`, `[diamond:#ff5722]`).
- **Rich Text**: **Tebal**, *Miring*, dan `Kode` (Markdown-lite) di dalam label.
- **Edge Label**: Sintaks `-- label -->` untuk label pada panah flowchart.
- **Grouping & Swimlane**: Kotak `[group]` dan lane per-aktor `[lane]`.
- **Lucide Icons**: Ribuan ikon SVG *open-source* di dalam node (`->icon["user"]`).
- **Edge Style**: *Smooth* (melengkung), *Step* (siku), *Straight* (lurus).

### UX & Editor
- **Theme Switcher**: Gelap ↔ Terang, warna SVG di-*bake* ke markup (ekspor PNG/SVG konsisten).
- **Node Selector + Property Panel**: Klik node flowchart → edit bentuk, warna, ikon, label, link, tooltip secara visual.
- **Minimap Navigasi**: Mini-map di sudut preview dengan viewport rectangle draggable, auto-hide saat fit.
- **Zoom Controls**: In / Out / Reset + shortcut `Ctrl+=`, `Ctrl+-`, `Ctrl+0`.
- **Keyboard Shortcuts**: 13 pintasan lengkap + modal cheat-sheet (`Ctrl+/`).
- **Auto-save**: Sumber, tema, dan edge style tersimpan di `localStorage`.

### Interop & Distribusi
- **Share URL**: Source diagram di-encode base64 di URL hash — bagikan lewat tautan.
- **Copy SVG**: Salin markup SVG ke clipboard, tempel di Figma/Illustrator/HTML.
- **Export/Import `.mmd.json`**: Roundtrip lossless (source + tema + edgeStyle) + drag & drop ke preview.
- **PNG/SVG Export**: Unduh diagram dengan background tema-aware.
- **Zero DOM Core**: Logika *parsing* dan *layout* murni berjalan tanpa DOM — siap untuk pengujian Node.js dan SSR.

---

## 🚀 Instalasi & Penggunaan

### 1. Menggunakan NPM (Modular)
```bash
npm install minimermaid
```

```javascript
import MiniMermaid from 'minimermaid';

const kode = `
  [horizontal]
  ->[round:green]->text["Status: **Aktif**"]->node
  ->[diamond:orange]->text["Cek Sistem?"]
`;

// Render ke DOM
MiniMermaid.renderTo('#container', kode, { edgeStyle: 'smooth', themeName: 'dark' });

// Atau ambil string SVG-nya
const { svg, errors } = MiniMermaid.render(kode);
```

### 2. Menggunakan Tag Script (HTML Biasa)
```html
<script src="minimermaid.umd.js"></script>
<script>
  MiniMermaid.renderTo('#diagram', '->[square]->text["Hello World"]');
</script>
```

### 3. Public API

```typescript
// Render
MiniMermaid.render(source, options?) → { svg, errors }
MiniMermaid.renderTo(target, source, options?) → void

// Document
MiniMermaid.exportJson(source, options?) → string  // JSON pretty-print
MiniMermaid.importJson(raw) → { source, theme, edgeStyle, type, errors }
```

**CompileOptions:**
```typescript
{
  measure?: TextMeasurer;
  edgeStyle?: 'smooth' | 'step' | 'straight';
  getIcon?: (name: string) => string | undefined;
  theme?: ThemeColors;
  themeName?: 'dark' | 'light';
}
```

---

## 📊 Jenis Diagram & Sintaks

### 1. Flowchart (Dasar)
```text
[cabang]->[diamond]->text["Login?"]
  ->ya["Ya"]
    ->[square]->text["Dashboard"]
  ->tidak["Tidak"]
    ->[square]->text["Gagal"]
```

### 2. Swimlane (Aktor / Departemen)
```text
[horizontal]
[lane "Pelanggan"]
  ->[round]->text["Pesan Makanan"]
[lane "Restoran"]
  ->[square]->text["Masak"]
```

### 3. Sequence Diagram (Alur Waktu)
```text
[sequence]
participant Pengguna
participant Sistem

Pengguna -> Sistem: Login Request
loop HealthCheck
    Sistem --> Pengguna: Login Berhasil
end
```

### 4. Class Diagram (UML)
```text
[class]
class Animal {
  +int age
  +isMammal()
}
class Duck {
  +swim()
}
Animal <|-- Duck
note for Duck "Bisa berenang"
```

### 5. State Diagram (Siklus Hidup)
```text
[state]
[*] --> Idle
Idle --> Processing : Start
Processing --> [*] : Done
```

### 6. Network Graph (Jejaring)
```text
[network]
Pusat : "Kantor Pusat"
Cabang : "Cabang Jakarta"
Pusat --- Cabang : "Laporan"
```

### 7. ER Diagram (Entity Relationship) — 🆕
```text
[er]
entity User {
  PK id int
  name string
  email string
}
entity Post {
  PK id int
  FK user_id int
  title string
  content text
}
User 1 -- N Post : menulis
User 1 -- ? Profile : memiliki
Tag N -- M Post : label
```

**Kardinalitas:** `1` (one) · `N`/`M`/`*` (many) · `?`/`0..1` (optional)
**Notasi:** Crow's foot — tick (one), fan (many), circle (optional).
**Prefix atribut:** `PK`, `FK`, `PK/FK` (badge berwarna).

### 8. Mindmap (Peta Pikiran) — 🆕
```text
[mindmap]
Proyek Baru
  Riset
    Riset Pasar
    Kompetitor
  Desain
    Wireframe
    Mockup
  Development
    Backend
    Frontend
  Launch
```

- **Indentasi** (spasi/tab) = hierarki. Baris pertama = root.
- Root otomatis di tengah; cabang level-1 dibelah kiri/kanan.
- Level 2+ mewarisi arah & warna dari parent.

### 9. Timeline (Kronologi) — 🆕
```text
[timeline]
title : Sejarah MiniMermaid
2020 : Peluncuran Beta : 500 pengguna awal
2021 : Rilis 1.0 : 10K pengguna
2022 : Ekspansi Asia
2023 : Series A : $5M
2024 : Rilis 2.0
```

- `title : ...` (atau `judul : ...`) → judul opsional.
- Baris event: `tanggal : label` atau `tanggal : label : sublabel`.
- Kartu event bergantian otomatis di atas/bawah garis waktu.

---

## 🎨 Fitur Lanjutan (Flowchart)

**Warna & Rich Text:**
```text
->[round:green]->text["Status: **AKTIF**"]->node
->[diamond:#ff5722]->text["Ping `192.168.1.1`"]
```

**Label pada Panah:**
```text
->[round]->text["Mulai"]-- mulai -->
->[square]->text["Proses"]-- selesai -->
->[triangle]->text["Selesai"]
```

Bekerja juga di sub-cabang:
```text
  ->ya["Ya"]-- lanjut -->
    ->[square]->text["Dashboard"]
```

**Interaktivitas (Link & Tooltip):**
```text
->[square]->text["Google"]
  ->link["https://google.com"]
  ->tooltip["Buka mesin pencari"]->node
```

**Grouping:**
```text
[group "Payment Gateway"]
  ->[square]->text["Validasi Kartu"]
```

---

## 🖱 Editor Visual

### Node Selector + Property Panel

Klik salah satu node di preview diagram **flowchart** → panel properti muncul di pojok kanan-bawah.

**Field yang bisa diedit:**
| Field | Contoh |
|---|---|
| Bentuk | `square`, `round`, `diamond`, `cylinder`, … |
| Warna | `#58a6ff`, `red`, `green` |
| Ikon Lucide | `user`, `settings`, `check` |
| Label | `Proses Data\nLangkah 1` |
| Link | `https://example.com` |
| Tooltip | `Buka halaman detail` |

**Perubahan disuntik ke baris sumber secara surgical** — prefix `[cabang]`, indentasi, dan token akhir (`->node` / `-- label -->`) dipertahankan.

**Batasan:**
- Hanya untuk **flowchart** (state, class, ER, mindmap, timeline belum editable)
- Node sisi `->ya` / `->tidak` tidak editable (sintaks khusus)
- Node ber-link tidak selectable (klik membuka URL)

**Shortcut:** `Enter` di input → terapkan · `Esc` → tutup panel.

### Minimap Navigasi

Minimap kecil di pojok kiri-bawah preview menampilkan:
- **Render mini** seluruh diagram
- **Rectangle viewport** yang menandai bagian yang sedang terlihat
- **Klik** di luar rectangle → viewport melompat ke titik itu
- **Drag rectangle** → pan presisi

Minimap **muncul otomatis** saat zoom-in cukup dalam atau pan keluar layar, dan **disembunyikan** saat viewport sudah fit atau diagram terlalu kecil (< 400×300).

---

## ⌨ Pintasan Keyboard

| Shortcut | Aksi |
|---|---|
| `Ctrl / ⌘ + Enter` | Render ulang diagram |
| `Ctrl / ⌘ + S` | Bagikan URL (salin ke clipboard) |
| `Ctrl / ⌘ + O` | Impor dokumen `.mmd.json` |
| `Ctrl / ⌘ + E` | Ekspor dokumen `.mmd.json` |
| `Ctrl / ⌘ + Shift + S` | Unduh SVG |
| `Ctrl / ⌘ + Shift + P` | Unduh PNG |
| `Ctrl / ⌘ + B` | Sembunyikan / tampilkan sidebar editor |
| `Ctrl / ⌘ + Shift + L` | Ganti tema (terang / gelap) |
| `Ctrl / ⌘ + =` | Zoom in |
| `Ctrl / ⌘ + -` | Zoom out |
| `Ctrl / ⌘ + 0` | Reset zoom (fit-to-content) |
| `Ctrl / ⌘ + /` | Buka daftar pintasan |
| `Esc` | Tutup modal |

Tombol **`?`** (ikon keyboard) di header menampilkan daftar lengkap pintasan kapan saja.

---

## 💾 Format Dokumen `.mmd.json`

Simpan seluruh state diagram (source, tema, gaya edge) sebagai satu file portabel.

**Ekspor:** klik tombol **`.mmd.json`** di header → file `diagram.mmd.json` terunduh.

**Impor:** klik **Impor** di header, atau **drag & drop** file `.mmd.json` ke area preview.

**Contoh isi:**
```json
{
  "version": "1.0",
  "generator": "MiniMermaid",
  "type": "flowchart",
  "source": "->[round]->text[\"Mulai\"]->node\n->[triangle]->text[\"Selesai\"]",
  "theme": "dark",
  "edgeStyle": "smooth",
  "model": {
    "direction": "vertical",
    "nodes": [ /* ... */ ],
    "edges": [ /* ... */ ]
  }
}
```

Field `model` hanya **informatif** — diabaikan saat impor. Payload utama adalah `source`. Field `type` otomatis terdeteksi (`flowchart`, `sequence`, `class`, `state`, `network`, `er`, `mindmap`, `timeline`). Ketidakcocokan `version`/`type` akan memunculkan peringatan non-fatal.

---

## 🎨 Tema

Aplikasi mendukung **dua tema** yang bisa di-toggle via tombol **Terang/Gelap** di header atau shortcut `Ctrl+Shift+L`.

- Warna tema **di-*bake* ke markup SVG** (bukan CSS variable) → **ekspor PNG/SVG dan *copy SVG* selalu tampil benar**, terlepas dari konteks CSS.
- Warna UI (header, editor, modal, panel) menggunakan CSS variable → override instan via `body[data-theme="light"]`.
- Palet warna diagram (node, edge, group) berbeda per tema untuk kontras optimal.

---

## 🏗 Arsitektur

Proyek ini memisahkan *core engine* (bebas DOM) dengan *UI layer*, dan menyediakan *entry point* `lib.ts` untuk didistribusikan sebagai *library*.

```text
┌───────────────────────────────────────────────────────┐
│  lib.ts         API Publik (render / exportJson / ...)│
├───────────────────────────────────────────────────────┤
│  core/          DOMAIN MURNI — tanpa DOM, teruji      │
│    parser.ts ─── teks → model (nodes/edges)           │
│    layout.ts ─── ukur & tempatkan node                │
│    sequence / class / state / network                 │
│    er / mindmap / timeline ── engine per tipe         │
│    document.ts ── serialisasi .mmd.json               │
│    compile.ts ── pipeline parse → layout → render     │
├───────────────────────────────────────────────────────┤
│  rendering/     generator string SVG — tanpa DOM      │
│    shapes, text, edge, group, diagram — theme-aware   │
├───────────────────────────────────────────────────────┤
│  ui/            lapisan DOM (aplikasi playground)     │
│    app, preview, editor, property-panel, minimap,     │
│    shortcuts, url-state, document-io                  │
├───────────────────────────────────────────────────────┤
│  docs/          Dokumentasi Vue 3 + Vite (SPA)        │
└───────────────────────────────────────────────────────┘
```

**Alur Data:**
```text
source (string)
   │  compile(source, { theme, edgeStyle, measure })
   ▼
deteksi tipe diagram → engine yang sesuai
   │  parse() → layout() → render()
   ▼
{ markup, viewBox, errors } ──► Preview / Minimap / lib API
```

**Prinsip:**
1. **`core/` & `rendering/` tidak menyentuh `document`** — Memungkinkan pengujian di Node.js dan SSR.
2. **Error dikumpulkan sebagai data** — Bukan exception, sehingga UI bisa menampilkan semua error sekaligus.
3. **Renderer Modular** — Menambah tipe diagram baru cukup dengan membuat file *engine* baru di `core/` dan mendaftarkannya di `compile.ts`.
4. **Tema di-*bake* ke SVG** — Ekspor tetap konsisten di luar konteks CSS halaman.

---

## 📂 Struktur Proyek

```text
minimermaid/
├─ index.html                     # Shell aplikasi playground
├─ src/
│  ├─ lib.ts                      # Entry point library publik
│  ├─ main.ts                     # Bootstrap playground
│  ├─ core/
│  │  ├─ types.ts                 # Tipe domain (Shape, Theme, Document, …)
│  │  ├─ config.ts                # Konstanta, palette, THEMES.dark/light
│  │  ├─ shapes.ts                # Alias bentuk
│  │  ├─ parser.ts                # Flowchart & swimlane (+ edge label)
│  │  ├─ layout.ts                # Layout flowchart
│  │  ├─ squence.ts               # Layout sequence
│  │  ├─ class-diagram.ts         # Layout class (UML)
│  │  ├─ state-diagram.ts         # Layout state
│  │  ├─ network-diagram.ts       # Layout network graph
│  │  ├─ er-diagram.ts            # Layout ER (crow's foot)         🆕
│  │  ├─ mindmap.ts               # Layout mindmap (radial split)    🆕
│  │  ├─ timeline.ts              # Layout timeline (alternating)    🆕
│  │  ├─ document.ts              # Serialisasi .mmd.json            🆕
│  │  └─ compile.ts               # Pipeline utama
│  ├─ rendering/
│  │  ├─ svg-utils.ts             # Helper XML & format angka
│  │  ├─ shapes.ts                # Renderer 10 bentuk node
│  │  ├─ text.ts                  # Renderer teks (rich text & ikon)
│  │  ├─ edge.ts                  # Renderer garis & panah (theme-aware)
│  │  ├─ group.ts                 # Renderer group / lane
│  │  └─ diagram.ts               # Komposisi defs/edges/nodes
│  ├─ ui/
│  │  ├─ dom.ts                   # Helper query selector
│  │  ├─ editor.ts                # Pembungkus textarea
│  │  ├─ preview.ts               # Kanvas SVG + Zoom/Pan + selection
│  │  ├─ canvas-measurer.ts       # TextMeasurer berbasis canvas
│  │  ├─ property-panel.ts        # Editor properti node              🆕
│  │  ├─ minimap.ts               # Navigasi mini                     🆕
│  │  ├─ shortcuts.ts             # Registry pintasan + cheat-sheet   🆕
│  │  ├─ url-state.ts             # Encode/decode base64 + storage    🆕
│  │  ├─ document-io.ts           # File picker + download .mmd.json  🆕
│  │  └─ app.ts                   # Orkestrator UI
│  └─ styles/
│     └─ main.css                 # Tema gelap + terang
├─ docs/                          # Dokumentasi Vue 3 (siap deploy)
├─ tests/                         # Unit test (Vitest)
├─ package.json
└─ vite.config.ts
```

---

## 🧪 Testing

Proyek ini menggunakan **Vitest** untuk pengujian unit secara menyeluruh tanpa membutuhkan browser (Node environment).

```bash
npm test           # Jalankan seluruh test
npm run test:watch # Mode watch
```

Mencakup pengujian parser, layout, render SVG, injeksi measurer (untuk karakter CJK/emoji), hingga engine khusus (Sequence, State, Class, Network, **ER**, **Mindmap**, **Timeline**).

---

## 💻 Teknologi

| Komponen | Peran |
|---|---|
| **TypeScript (Strict)** | Tipisasi menyeluruh, zero runtime errors |
| **Vite** | Build tool & bundler (UMD / ESM) |
| **Vue 3** | Framework untuk halaman dokumentasi (`docs/`) |
| **Vitest** | Unit testing (Node environment) |
| **Lucide** | Penyedia ikon SVG |

---

## 📝 Changelog

### Batch 5B — Minimap Navigasi
- `ui/minimap.ts` — SVG viewBox sync + viewport rect draggable
- Klik background → jump, drag rect → pan presisi, auto-hide saat fit
- `preview.centerOn()`, `getViewState()`, `onViewChange`

### Batch 5A — Node Selector + Property Panel
- `NodeSpec.line` + `data-node-idx` di SVG
- Panel properti: bentuk, warna, ikon, label, link, tooltip
- Surgical line replacement (preserve prefix & end-token)

### Batch 4C — Timeline `[timeline]`
- Kartu alternating, milestone, judul opsional

### Batch 4B — Mindmap `[mindmap]`
- Parser indentasi → tree, auto-split kiri/kanan, warna per cabang

### Batch 4A — ER Diagram `[er]`
- Entity/atribut PK/FK, relasi kardinalitas (crow's foot)

### Batch 3B — Keyboard Shortcuts
- `ShortcutManager` + modal cheat-sheet (`Ctrl+/`)
- 13 shortcut, macOS `⌘` support, `Esc` pintar

### Batch 3A — Export/Import `.mmd.json`
- Format dokumen portabel (source + tema + edgeStyle)
- File picker + drag & drop ke preview

### Batch 2B — Theme Switcher
- `THEMES.dark` / `THEMES.light`, warna di-*bake* ke SVG
- Tema persisten di `localStorage`, PNG export tema-aware

### Batch 2A — Edge Label
- Sintaks `-- label -->` di flowchart & sub-cabang

### Batch 1 — UX Essentials
- Zoom controls, share URL, copy SVG, auto-save

---

## 📄 Lisensi

MIT — silakan dipakai, dimodifikasi, dan dibagikan secara bebas.

