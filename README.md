
# MiniMermaid — Diagram dari Teks

> Library *Diagram-as-Code* (TypeScript) yang ringan dan interaktif. Ubah teks sederhana menjadi diagram SVG yang indah, mendukung Flowchart, Swimlane, Sequence, Class, State, dan Network Graph.

![Stack](https://img.shields.io/badge/TypeScript-strict-blue)
![Build](https://img.shields.io/badge/build-Vite%207-646CFF)
![Docs](https://img.shields.io/badge/docs-Vue%203-42b883)

---

## ✨ Fitur Utama

- **6 Tipe Diagram**: Flowchart, Swimlane, Sequence, Class, State, dan Network Graph.
- **Interactive Nodes**: Tambahkan URL (`->link["..."]`) dan pesan hover (`->tooltip["..."]`) langsung ke dalam node.
- **Inline Styling**: Beri warna khusus pada node secara instan (misal `[square:red]`).
- **Rich Text**: Dukung format **Tebal**, *Miring*, dan `Kode` (Markdown-lite) di dalam label.
- **Grouping & Swimlane**: Kelompokkan node dengan kotak `[group]` atau pisahkan berdasarkan aktor `[lane]`.
- **Lucide Icons**: Suntikkan ribuan ikon SVG *open-source* (misal `->icon["user"]`).
- **Edge Fleksibel**: Pilih gaya garis panah: *Smooth* (Melengkung), *Step* (Siku/Tegas), atau *Straight* (Lurus).
- **Zero DOM Core**: Logika *parsing* dan *layout* murni berjalan tanpa DOM, memudahkan pengujian dan rendering *Server-Side* (SSR).

---

## 🚀 Instalasi & Penggunaan

### 1. Menggunakan NPM (Modular)
```bash
npm install minimermaid
```
Gunakan di dalam kode JavaScript/TypeScript Anda:
```javascript
import MiniMermaid from 'minimermaid';

const kode = `
  [horizontal]
  ->[round:green]->text["Status: **Aktif**"]->node
  ->[diamond:orange]->text["Cek Sistem?"]
`;

// Render ke DOM
MiniMermaid.renderTo('#container', kode, { edgeStyle: 'smooth' });

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
Sistem --> Pengguna: Login Berhasil
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

---

## 🎨 Fitur Lanjutan (Flowchart)

**Warna & Rich Text:**
```text
->[round:green]->text["Status: **AKTIF**"]->node
->[diamond:#ff5722]->text["Ping `192.168.1.1`"]
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

*(Baca dokumentasi lengkap di folder `docs/`)*

---

## 🏗️ Arsitektur

Proyek ini memisahkan *core engine* (bebas DOM) dengan *UI layer*, dan menyediakan *entry point* `lib.ts` untuk didistribusikan sebagai *library*.

```text
┌─────────────────────────────────────────────────────┐
│  lib.ts         API Publik (MiniMermaid.render)     │
├─────────────────────────────────────────────────────┤
│  core/          DOMAIN MURNI — tanpa DOM, teruji    │
│    parser.ts ─── teks → model (nodes/edges)         │
│    layout.ts ─── ukur & tempatkan node              │
│    sequence.ts, class-diagram.ts, state-diagram.ts, │
│    network-diagram.ts ── engine layout khusus       │
│    compile.ts ── pipeline parse → layout → render   │
├─────────────────────────────────────────────────────┤
│  rendering/     generator string SVG — tanpa DOM    │
│    shapes.ts, text.ts, edge.ts, diagram.ts, group.ts│
├─────────────────────────────────────────────────────┤
│  ui/            lapisan DOM (aplikasi playground)   │
│    app.ts, preview.ts, editor.ts                    │
├─────────────────────────────────────────────────────┤
│  docs/          Dokumentasi Vue 3 + Vite (SPA)      │
└─────────────────────────────────────────────────────┘
```

**Alur Data:**
```text
source (string)
   │  parse()
   ▼
{ nodes, edges, errors }
   │  layout()
   ▼
{ nodes terposisi, dimensi total }
   │  renderDiagram()
   ▼
{ markup, viewBox } ──► UI / MiniMermaid.render()
```

**Prinsip:**
1. **`core/` & `rendering/` tidak menyentuh `document`** — Memungkinkan pengujian di Node.js dan SSR.
2. **Error dikumpulkan sebagai data** — Bukan exception, sehingga UI bisa menampilkan semua error sekaligus.
3. **Renderer Modular** — Menambah tipe diagram baru cukup dengan membuat file *engine* baru di `core/` dan memanggilnya di `compile.ts`.

---

## 📂 Struktur Proyek

```text
minimermaid/
├─ index.html                 # Shell aplikasi playground
├─ src/
│  ├─ lib.ts                  # Entry point library publik
│  ├─ main.ts                 # Bootstrap aplikasi playground
│  ├─ core/                   # Parser & Layout engine
│  ├─ rendering/              # SVG string generators
│  ├─ ui/                     # Logika antarmuka playground
│  └─ styles/
├─ docs/                      # Dokumentasi Vue 3 (Siap deploy ke Vercel)
│  ├─ src/views/              # Halaman dokumentasi (Home, Syntax, Examples)
│  └─ vite.config.ts
├─ tests/                     # Unit test (Vitest)
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

Mencakup pengujian parser, layout, render SVG, injeksi measurer (untuk karakter CJK/emoji), hingga engine khusus (Sequence, State, Class).

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

## 📄 Lisensi

MIT — silakan dipakai, dimodifikasi, dan dibagikan secara bebas.