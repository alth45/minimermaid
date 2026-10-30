
# Contributing to MiniMermaid Docs

Terima kasih atas minat Anda untuk berkontribusi! Dokumen ini menjelaskan cara
melaporkan bug, mengusulkan fitur, dan mengirim pull request ke proyek
**MiniMermaid Docs**.

---

## 📋 Daftar Isi

- [Kode Etik](#-kode-etik)
- [Cara Berkontribusi](#-cara-berkontribusi)
  - [Melaporkan Bug](#-melaporkan-bug)
  - [Mengusulkan Fitur](#-mengusulkan-fitur)
  - [Memperbaiki Dokumentasi](#-memperbaiki-dokumentasi)
  - [Mengirim Pull Request](#-mengirim-pull-request)
- [Setup Development](#-setup-development)
- [Struktur Proyek](#-struktur-proyek)
- [Konvensi Kode](#-konvensi-kode)
- [Konvensi Commit](#-konvensi-commit)
- [Proses Review](#-proses-review)
- [Sync Library Vendor](#-sync-library-vendor)
- [Lisensi](#-lisensi)

---

## 🤝 Kode Etik

Dengan berpartisipasi dalam proyek ini, Anda setuju untuk:

- Menggunakan bahasa yang sopan dan inklusif
- Menghargai perbedaan pendapat dan pengalaman
- Menerima kritik konstruktif dengan lapang dada
- Berfokus pada apa yang terbaik untuk komunitas
- Menunjukkan empati terhadap anggota komunitas lainnya

Perilaku yang tidak dapat diterima (pelecehan, ujaran kebencian, spam, dsb.) akan
ditindaklanjuti dengan penolakan kontribusi.

---

## 🚀 Cara Berkontribusi

### 🐛 Melaporkan Bug

Sebelum membuka issue, **cari dulu** di [issues](https://github.com/alth45/docs-minimermaid/issues)
untuk menghindari duplikat.

Saat melaporkan bug, sertakan:

1. **Judul jelas** — deskripsi singkat masalah (mis. "Timeline tidak render saat ada `<` di label")
2. **Langkah reproduksi** — numbered steps
3. **Perilaku yang diharapkan** vs **perilaku aktual**
4. **Screenshot/video** (jika visual)
5. **Environment**:
   - Browser & versi (Chrome 120, Firefox 121, dst.)
   - OS (Windows 11, macOS 14, Ubuntu 22.04)
   - Versi Node.js (`node -v`)
   - Commit hash / versi

**Template issue bug:**

```markdown
### Deskripsi
[Deskripsi singkat bug]

### Langkah Reproduksi
1. Buka halaman `...`
2. Ketik kode `...`
3. Klik `...`
4. Lihat error

### Perilaku Diharapkan
[...]

### Perilaku Aktual
[...]

### Environment
- Browser: Chrome 121
- OS: macOS 14.2
- Node: v20.10.0
```

### 💡 Mengusulkan Fitur

Untuk mengusulkan fitur baru:

1. **Cari dulu** di issues untuk ide serupa
2. **Buka discussion** atau issue dengan prefix `[Feature]`
3. Jelaskan:
   - **Masalah** yang ingin diselesaikan
   - **Solusi** yang diusulkan
   - **Alternatif** yang sudah dipertimbangkan
   - **Konteks** tambahan (mockup, referensi, dll.)

**Template issue fitur:**

```markdown
### Masalah
[Deskripsi masalah atau kebutuhan pengguna]

### Solusi yang Diusulkan
[...]

### Alternatif
[...]

### Konteks Tambahan
[Gambar, link referensi, contoh dari proyek lain]
```

### 📝 Memperbaiki Dokumentasi

Dokumentasi yang baik sama pentingnya dengan kode. Anda bisa berkontribusi dengan:

- Memperbaiki typo atau tata bahasa
- Menambah contoh yang lebih jelas
- Menerjemahkan ke bahasa lain (hubungi maintainer dulu)
- Menambah screenshot atau diagram
- Memperbaiki broken link

Untuk perubahan kecil (typo, format), Anda bisa langsung buka PR tanpa issue.
Untuk perubahan besar (struktur baru, halaman baru), buka issue dulu.

### 🔀 Mengirim Pull Request

Alur lengkap pull request:

#### 1. Fork repo

```bash
# Klik tombol "Fork" di GitHub, lalu:
git clone https://github.com/<username-anda>/docs-minimermaid.git
cd docs-minimermaid
```

#### 2. Tambahkan upstream remote

```bash
git remote add upstream https://github.com/alth45/docs-minimermaid.git
git remote -v
```

#### 3. Buat branch baru

Gunakan prefix yang sesuai:

```bash
# Fitur baru
git checkout -b feat/nama-fitur

# Perbaikan bug
git checkout -b fix/nama-bug

# Dokumentasi
git checkout -b docs/nama-perubahan

# Refactor
git checkout -b refactor/nama-refactor

# Chore / maintenance
git checkout -b chore/nama-chore
```

#### 4. Setup development

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` untuk melihat docs.

#### 5. Buat perubahan

- Edit file yang relevan
- Ikuti [konvensi kode](#-konvensi-kode)
- Test perubahan di browser (desktop & mobile view)
- Test dark & light theme

#### 6. Commit perubahan

```bash
git add .
git commit -m "feat: tambah preset Mindmap di Playground"
```

Lihat [konvensi commit](#-konvensi-commit) untuk format pesan.

#### 7. Push branch

```bash
git push origin feat/nama-fitur
```

#### 8. Buka Pull Request

- Kunjungi `https://github.com/alth45/docs-minimermaid`
- Klik **"Compare & pull request"**
- Isi template PR:
  - **Ringkasan** perubahan
  - **Motivasi** (kenapa perubahan ini penting)
  - **Testing** yang sudah dilakukan
  - **Screenshot** (jika visual)
  - **Issue terkait** (mis. `Closes #42`)

#### 9. Tunggu review

Maintainer akan me-review PR Anda. Siap untuk iterasi jika ada feedback.

---

## 🛠 Setup Development

### Prasyarat

- **Node.js** ≥ 18.x ([download](https://nodejs.org/))
- **npm** ≥ 9.x (bundled dengan Node) atau **pnpm** ≥ 8.x
- **Git** ≥ 2.30

### Instalasi

```bash
# Clone fork Anda
git clone https://github.com/<username>/docs-minimermaid.git
cd docs-minimermaid

# Install dependencies
npm install
```

### Perintah Tersedia

```bash
# Development server (hot reload)
npm run dev
# → http://localhost:5173

# Build production
npm run build

# Preview build production
npm run preview

# Type check (jika pakai vue-tsc)
npm run type-check
```

### Editor Rekomendasi

- **VS Code** dengan ekstensi:
  - [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## 📂 Struktur Proyek

```
docs-minimermaid/
├── index.html                    # Entry HTML
├── package.json
├── vite.config.ts                # Konfigurasi Vite + alias
├── vercel.json                   # SPA rewrite untuk deploy
├── tsconfig.json
├── LICENSE
├── CONTRIBUTING.md               # ← file ini
├── README.md
├── src/
│   ├── main.ts                   # Bootstrap Vue + anti-FOWT theme
│   ├── App.vue                   # Layout sidebar + main content
│   ├── router.ts                 # Vue Router config
│   ├── style.css                 # Design system (dark/light)
│   ├── components/
│   │   ├── CodeBlock.vue         # Code block + copy button
│   │   └── LiveDiagram.vue       # Preview SVG interaktif
│   ├── views/
│   │   ├── Home.vue              # Landing
│   │   ├── Syntax.vue            # Flowchart docs
│   │   ├── Swimlane.vue
│   │   ├── Sequence.vue
│   │   ├── Er.vue
│   │   ├── Mindmap.vue
│   │   ├── Timeline.vue
│   │   ├── Theme.vue
│   │   ├── Playground.vue
│   │   ├── Api.vue
│   │   ├── About.vue
│   │   └── Ex*.vue               # Contoh proyek
│   └── data/
│       └── api-examples.ts       # String contoh (hindari error </script>)
└── vendor/
    └── minimermaid/              # Library MiniMermaid (vendored)
        ├── lib.ts
        ├── core/
        ├── rendering/
        └── ui/canvas-measurer.ts
```

**Berkas penting yang sering diubah:**

| File | Untuk apa |
|---|---|
| `src/style.css` | Token warna, tipografi, komponen global |
| `src/App.vue` | Sidebar, routing menu, theme toggle |
| `src/router.ts` | Daftar route & page title |
| `src/views/*.vue` | Konten dokumentasi per halaman |
| `src/components/*.vue` | Komponen reusable (CodeBlock, LiveDiagram) |
| `vendor/minimermaid/` | Library (jangan edit langsung, lihat [Sync Library](#-sync-library-vendor)) |

---

## 🎨 Konvensi Kode

### Vue Components

- Gunakan `<script setup lang="ts">` (Composition API)
- Props via `defineProps<Props>()` dengan interface
- Style: `<style scoped>`
- Nama file PascalCase: `MyComponent.vue`

### TypeScript

- **Selalu** ketik eksplisit untuk function return
- Hindari `any` — pakai `unknown` + type guard jika perlu
- Gunakan `interface` untuk objek, `type` untuk union/alias
- Export function sebagai `function` named (bukan arrow) untuk better stack trace

### CSS

- Gunakan **CSS variable** dari `style.css`:
  - Warna: `var(--accent)`, `var(--panel)`, `var(--text)`, dll.
  - Spacing: `var(--radius)`, `var(--radius-sm)`, dll.
  - Typography: `var(--font-sans)`, `var(--font-mono)`
- **Jangan** hardcode warna tema — pakai variable agar light/dark otomatis
- Class naming: kebab-case (`.my-card`, `.code-block`)
- Gunakan scoped style untuk komponen

### Dokumentasi

- Heading: `<h1>` hanya 1 per halaman, `<h2>` untuk section, `<h3>` untuk sub
- Kode contoh: sertakan `LiveDiagram` di bawahnya bila menampilkan diagram
- Selalu tambah **Quick Reference** di atas halaman docs
- Akhiri halaman dengan **Next Steps** grid

### Format File

- **Indentasi**: 2 spasi (untuk `.vue`, `.ts`, `.css`)
- **Line ending**: LF (Unix)
- **Trailing whitespace**: dihapus
- **Final newline**: ada

---

## 📝 Konvensi Commit

Format: `type(scope): deskripsi singkat`

### Type

| Type | Kapan dipakai |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi |
| `style` | Format, whitespace, missing semicolon (bukan CSS) |
| `refactor` | Refactor tanpa mengubah behavior |
| `perf` | Peningkatan performa |
| `test` | Tambah/perbaiki test |
| `chore` | Maintenance (build, deps, config) |
| `build` | Perubahan build system |
| `ci` | Perubahan CI/CD |

### Scope (opsional)

Contoh scope: `playground`, `home`, `theme`, `er`, `mindmap`, `timeline`, `api`,
`sidebar`, `router`.

### Contoh

```bash
feat(playground): tambah preset Timeline
fix(theme): toggle tema tidak persist setelah refresh
docs(syntax): perbaiki contoh edge label
style(home): rapikan spacing di hero section
refactor(livediagram): ekstrak helper render ke fungsi terpisah
chore(deps): upgrade vite ke 7.1.0
```

### Breaking Change

Untuk breaking change, tambahkan `BREAKING CHANGE:` di footer commit:

```bash
feat(router): restrukturisasi route `/examples`

BREAKING CHANGE: route `/examples/eco` di-rename menjadi
`/examples/ecommerce`. Update bookmark Anda.
```

---

## 👀 Proses Review

Setelah PR dibuka, berikut yang akan diperiksa:

### Otomatis (CI)

- ✅ Build berhasil (`npm run build`)
- ✅ Tidak ada error TypeScript
- ✅ Tidak ada warning console saat runtime

### Manual (Maintainer)

- ✅ Perubahan sesuai deskripsi PR
- ✅ Kode mengikuti [konvensi](#-konvensi-kode)
- ✅ Dark & light theme sama-sama baik
- ✅ Responsive (desktop, tablet, mobile)
- ✅ Aksesibilitas (aria-label, semantic HTML)
- ✅ Tidak ada regresi di halaman lain

### Estimasi Waktu

- **Typo fix**: 1–2 hari
- **Dokumentasi baru**: 2–5 hari
- **Fitur kecil**: 3–7 hari
- **Fitur besar**: 1–2 minggu (dengan iterasi)

Jika PR Anda belum di-review setelah **7 hari**, silakan mention maintainer
(`@alth45`) di komentar — mungkin terlewat.

---

## 🔄 Sync Library Vendor

Folder `vendor/minimermaid/` berisi salinan library dari repo utama
(`minimermaid/`). **Jangan edit file di dalam `vendor/` secara langsung** —
perubahan akan hilang saat sync ulang.

Jika Anda perlu update library:

```bash
# Dari folder docs-minimermaid/
bash sync-lib.sh

# Atau manual (sesuaikan path ke monorepo library):
SOURCE="../src"
DEST="vendor/minimermaid"

rm -rf "$DEST"
mkdir -p "$DEST/ui"
cp "$SOURCE/lib.ts" "$DEST/"
cp -r "$SOURCE/core" "$DEST/"
cp -r "$SOURCE/rendering" "$DEST/"
cp "$SOURCE/ui/canvas-measurer.ts" "$DEST/ui/"

# Commit
git add vendor/
git commit -m "chore: sync library dari monorepo minimermaid"
git push
```

Jika Anda **bukan** maintainer library, cukup buka issue untuk request fitur
library — jangan sync sendiri.

---

## 🏷 Label Issue

Saat membuat issue, gunakan label yang sesuai agar mudah di-filter:

- `bug` — sesuatu tidak berjalan sesuai harapan
- `enhancement` — fitur baru atau peningkatan
- `documentation` — terkait dokumentasi
- `good first issue` — cocok untuk kontributor pertama kali
- `help wanted` — butuh bantuan komunitas
- `question` — pertanyaan
- `wontfix` — tidak akan diperbaiki (dengan alasan)

---

## ❓ Pertanyaan?

- 💬 **Diskusi umum**: buka [Discussions](https://github.com/alth45/docs-minimermaid/discussions)
- 🐛 **Bug**: buka [Issue](https://github.com/alth45/docs-minimermaid/issues)
- 📧 **Kontak langsung**: hubungi maintainer via GitHub (`@alth45`)

---

## 📄 Lisensi

Dengan berkontribusi ke proyek ini, Anda setuju bahwa kontribusi Anda akan
dilisensikan di bawah [MIT License](./LICENSE) — lisensi yang sama dengan
proyek ini.

Anda tetap memegang hak cipta atas kontribusi Anda, tapi memberikan izin
kepada maintainer dan pengguna lain untuk menggunakannya di bawah MIT.

---

## 🙏 Terima Kasih

Setiap kontribusi — sekecil apapun — sangat berarti. Baik itu:

- Laporan bug yang detail
- Koreksi typo
- Usulan fitur
- Pull request
- ⭐ Star di repo
- Share ke teman developer

Terima kasih telah membuat MiniMermaid lebih baik! 🚀
---



## 📋 Ringkasan Isi

| Section | Konten |
|---|---|
| **Kode Etik** | Standar perilaku komunitas |
| **Cara Berkontribusi** | 4 sub-bagian: bug, fitur, docs, PR + template issue |
| **Setup Development** | Prasyarat, instalasi, perintah npm, editor rekomendasi |
| **Struktur Proyek** | Tree file + tabel file penting |
| **Konvensi Kode** | Vue, TypeScript, CSS, dokumentasi, format file |
| **Konvensi Commit** | Format `type(scope): desc` + tabel type + contoh |
| **Proses Review** | Checklist, estimasi waktu, eskalasi |
| **Sync Library Vendor** | Cara update `vendor/minimermaid/` |
| **Label Issue** | Daftar label & kegunaan |
| **Pertanyaan** | Kanal komunikasi |
| **Lisensi** | Konfirmasi kontribusi = MIT |
| **Terima Kasih** | Penutup hangat |

---
