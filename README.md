# MiniMermaid — Diagram dari Teks

> Tulis kode sederhana di kiri, dapatkan diagram flowchart SVG di kanan.
> Konversi **TypeScript** dari versi HTML tunggal, dengan arsitektur berlapis,
> build tooling modern, dan unit test.

![Stack](https://img.shields.io/badge/TypeScript-strict-blue)
![Build](https://img.shields.io/badge/build-Vite%207-646CFF)
![Tests](https://img.shields.io/badge/tests-Vitest-40%2F40%20lulus-brightgreen)

---

## Fitur

- **10 bentuk node**: `square`, `round`, `circle`, `ellipse`, `diamond`, `triangle`, `hexagon`, `parallelogram`, `cylinder`, `document`
- **Alias Indonesia & Inggris**: `kotak`, `segitiga`, `db`, `dokumen`, `belahketupat`, …
- **Arah layout**: tulis `[horizontal]` (atau `[vertikal]`) di baris pertama untuk menata diagram kiri→kanan; default tetap atas→bawah
- **Percabangan ya/tidak**: awali baris dengan `[cabang]` untuk membuat node keputusan dengan dua sisi berlabel (default "Ya"/"Tidak", boleh diganti)
- **Sambungan otomatis**: tambahkan `->node` di akhir baris untuk menyambung ke node berikutnya
- **Label multi-baris** dengan `\n`, **komentar** `#` dan `//`
- **Error non-fatal**: pesan error ditampilkan di panel sambil tetap merender hasil parsial
- **Download SVG** satu klik
- **Tema gelap** ala GitHub + tata letak responsif (mobile: editor di atas, preview di bawah)
- **Tanpa dependensi runtime** — murni TypeScript, hasil build ringan (HTML + CSS + JS)

---

## Cara Menjalankan

Prasyarat: [Node.js](https://nodejs.org/) 20+ dan npm.

```bash
npm install        # instalasi dependensi
npm run dev        # server development (Vite) + hot reload
npm run build      # typecheck (tsc --noEmit) lalu build produksi ke dist/
npm run preview    # pratinjau hasil build
npm test           # jalankan seluruh unit test (Vitest)
npm run test:watch # test mode watch
npm run typecheck  # hanya typecheck tanpa build
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`), tulis kode
di editor, dan lihat hasilnya langsung di panel pratinjau.

---

## Sintaks Diagram

Satu node per baris:

```
->[bentuk]->text["Label"]->node
```

| Bagian | Wajib? | Keterangan |
|---|---|---|
| `->[bentuk]` | ✔ | Bentuk node, lihat daftar di bawah |
| `->text["Label"]` | ✔ | Label; kata `text`/`label`/`txt` bisa diganti atau dihilangkan |
| `->node` | ✘ | Sambungkan otomatis ke node pada baris berikutnya |

### Contoh

```
# Alur utama
->[round]->text["Mulai"]->node
->[diamond]->text["Kondisi\nterpenuhi?"]->node
->[square]->text["Proses data"]->node
->[triangle]->text["Selesai"]

# Bentuk lain, tanpa sambungan
->[cylinder]->text["Database"]
->[hexagon]->text["Service A"]->node
->[parallelogram]->text["Service B"]
```

Aturan tambahan:

- Baris kosong diabaikan.
- Komentar diawali `#` atau `//`.
- Tulis `\n` di dalam label untuk membuat baris baru.
- Node terakhir dengan `->node` akan menghasilkan peringatan (tidak ada node berikutnya untuk disambung).

### Direktif Arah `[horizontal]`

Tulis direktif pada **baris pertama** (sebelum node mana pun) untuk mengubah arah tata letak:

```
[horizontal]
->[round]->text["Mulai"]->node
->[diamond]->text["Kondisi?"]->node
->[square]->text["Proses data"]
```

Diagram di atas tersusun **kiri→kanan**; tanpa direktif, node ditumpuk **atas→bawah** (vertikal).

| Direktif | Efek |
|---|---|
| `[horizontal]` (alias: `[horiz]`, `[lr]`) | Node dibariskan kiri→kanan, edge digambar dari sisi kanan ke sisi kiri node berikutnya |
| `[vertikal]` / `[vertical]` (alias: `[tb]`) | Default — node ditumpuk atas→bawah |

Catatan:

- Direktif bersifat case-insensitive dan boleh diberi teks tambahan di belakangnya (mis. `[horizontal] flowchart LR`).
- Hanya dikenali sebelum node pertama; jika ditulis setelah ada node, baris tersebut dilaporkan sebagai sintaks tidak dikenal.
- Percabangan juga didukung pada layout horizontal: kedua sisi ditata dalam lajur sejajar kiri→kanan.

### Percabangan `[cabang]`

Awali baris dengan `[cabang]` (alias: `[branch]`, `[if]`) untuk membuat node keputusan yang menghasilkan **dua edge berlabel** ke dua node berikutnya:

```
->[round]->text["Mulai"]->node
[cabang]->[diamond]->text["Lulus?"]
->ya["Ya"]->node
->tidak["Tidak"]
->[square]->text["Selesai"]
```

| Bagian | Keterangan |
|---|---|
| `[cabang]->[bentuk]->text["Label"]` | Node sumber percabangan (biasanya `diamond`) |
| `->ya["Label"]` / `->yes[...]` | Sisi "ya"; label pada kurung menjadi teks edge (default: `Ya`). Baris boleh ditutup `->node` agar sisi ini menyambung ke node berikutnya |
| `->tidak["Label"]` / `->no[...]` | Sisi "tidak"; aturan sama seperti `->ya` |

Aturan main:

- Kedua sisi boleh ditulis sebagian; sisi yang tidak ditulis memakai label default (`Ya`/`Tidak`) dan bentuk bawaan (`round` untuk ya, `diamond` untuk tidak).
- Baris `->ya[...]` / `->tidak[...]` boleh ditutup `->node`; jika tidak, node sisi menjadi terminal dan baris selanjutnya melanjutkan alur dari node terakhir.
- Tersedia pula gaya satu-baris penuh: sumber + kedua sisi ditulis sekaligus dengan segmen `[ya]`/`[tidak]`:

  ```
  [cabang]->[diamond]->text["Login?"]->node->[ya]->text["OK"]->node->[tidak]->text["Gagal"]
  ```

  Pada gaya ini label dalam kurung (`"OK"`/`"Gagal"`) dipakai sebagai teks edge, dan token `[ya]`/`[tidak]` sendiri belum terdaftar sebagai bentuk sehingga memunculkan pesan *fallback* non-fatal.

### Daftar Bentuk & Alias

| Bentuk | Alias yang diterima |
|---|---|
| `square` | `rect`, `box`, `kotak`, `persegi` |
| `round` | `rounded`, `stadium`, `pill`, `kapsul` |
| `circle` | `lingkaran`, `bulat` |
| `ellipse` | `elips`, `oval` |
| `diamond` | `decision`, `rhombus`, `belah`, `belahketupat` |
| `triangle` | `segitiga` |
| `hexagon` | `segienam` |
| `parallelogram` | `jajargenjang` |
| `cylinder` | `database`, `db`, `silinder` |
| `document` | `doc`, `dokumen` |

Bentuk tak dikenal otomatis di-`fallback` ke `square` disertai pesan error.

---

## Arsitektur

Proyek ini memakai pemisahan berlapis agar logika inti bebas DOM dan mudah dites:

```
┌─────────────────────────────────────────────────────┐
│  ui/            lapisan DOM (tipis, imperatif)      │
│    app.ts ────── orkestrasi event & download        │
│    editor.ts ─── pembungkus textarea                │
│    preview.ts ── menampilkan SVG + daftar error     │
├─────────────────────────────────────────────────────┤
│  core/          DOMAIN MURNI — tanpa DOM, teruji    │
│    parser.ts ─── teks → model (nodes/edges/errors)  │
│    layout.ts ─── ukur & tempatkan node (vertikal/   │
│                  horizontal, blok percabangan)      │
│    compile.ts ── pipeline parse → layout → render   │
│    shapes.ts ─── registry alias bentuk              │
│    types.ts ──── definisi tipe domain               │
│    config.ts ─── konstanta (palette, gap, contoh)   │
├─────────────────────────────────────────────────────┤
│  rendering/     generator string SVG — tanpa DOM    │
│    shapes.ts ─── registry renderer 10 bentuk        │
│    text.ts ───── label multi-baris (<tspan>)        │
│    edge.ts ───── kurva bezier + marker panah        │
│    diagram.ts ── komposisi defs/edges/nodes/viewBox │
│    svg-utils.ts ─ escape XML & format angka         │
└─────────────────────────────────────────────────────┘
```

Alur data (pipeline murni, tanpa efek samping):

```
source (string)
   │  parse()         src/core/parser.ts
   ▼
{ nodes, edges, errors }
   │  layout()        src/core/layout.ts
   ▼
{ nodes terposisi, dimensi total }
   │  renderDiagram() src/rendering/diagram.ts
   ▼
{ markup, viewBox } ──► UI menampilkan SVG + error
```

Prinsip yang dipegang:

1. **`core/` dan `rendering/` tidak menyentuh `document`** — semua fungsi murni, sehingga seluruh unit test bisa berjalan di Node tanpa browser.
2. **Error dikumpulkan sebagai data** (array string), bukan exception, agar UI bisa menampilkan semua masalah sekaligus sambil tetap merender hasil parsial.
3. **Menambah bentuk baru** hanya perlu: tambahkan 1 entri di `ShapeKind` (`core/types.ts`), 1 alias di `core/shapes.ts`, 1 ukuran minimum di `core/layout.ts`, dan 1 renderer di `rendering/shapes.ts`.

---

## Struktur Proyek

```
diagram/
├─ index.html                 # shell tipis (tanpa inline CSS/JS)
├─ package.json
├─ tsconfig.json              # TypeScript strict
├─ vite.config.ts             # konfigurasi Vite + Vitest
├─ legacy/                    # backup versi HTML asli (opsional, boleh dihapus)
├─ src/
│  ├─ main.ts                 # bootstrap
│  ├─ core/
│  │  ├─ types.ts  config.ts  shapes.ts
│  │  ├─ parser.ts  layout.ts  compile.ts
│  ├─ rendering/
│  │  ├─ svg-utils.ts  shapes.ts  text.ts
│  │  ├─ edge.ts  diagram.ts
│  ├─ ui/
│  │  ├─ dom.ts  editor.ts  preview.ts  app.ts
│  └─ styles/main.css         # tema gelap + layout responsif
└─ tests/
   ├─ parser.test.ts          # sintaks, alias, komentar, direktif arah, error
   ├─ layout.test.ts          # penumpukan vertikal/horizontal, centering, ukuran minimum
   ├─ compile.test.ts         # ujung-ke-ujung: teks → SVG, escape, edge berarah
   └─ _verify.test.ts         # skrip dump internal (debug, bukan test regresi)
```

---

## Testing

```bash
npm test
```

Cakupan test (40 test, seluruhnya lulus — 39 kasus regresi di 3 file plus 1 test dump internal `tests/_verify.test.ts`):

- **Parser (14)** — tokenisasi bentuk/label/link, alias Indonesia, komentar, eskap `\n`, rantai edge, pesan error bernomor baris, direktif arah `[horizontal]`/`[vertikal]` beserta alias dan posisinya.
- **Layout (8)** — penumpukan vertikal & horizontal dengan gap konstan, rata tengah, ukuran minimum per bentuk, pemecahan label multi-baris, default arah.
- **Compile/Render (17)** — viewBox valid, kanvas kosong untuk sumber kosong, escape karakter XML berbahaya (`<script>` → `&lt;script&gt;`), marker panah pada edge bertaut, ke-10 bentuk menghasilkan elemen SVG yang benar (via `it.each`), edge horizontal (kanan→kiri) saat `[horizontal]`, hasil parsial saat ada error, kesetaraan `[vertikal]` eksplisit dengan default.

---

## Teknologi

| Komponen | Versi | Peran |
|---|---|---|
| TypeScript | 5.x (strict) | Tipisasi menyeluruh, tanpa runtime |
| Vite | 7.x | Dev server + bundler produksi |
| Vitest | 3.x | Unit test berbasis Node |

Tanpa dependensi runtime — hasil build murni HTML + CSS + JS.

---

## Lisensi

MIT — silakan dipakai, dimodifikasi, dan dibagikan.
