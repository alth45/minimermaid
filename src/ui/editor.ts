/* =========================================================
   EDITOR — pembungkus textarea untuk kode diagram.
   ========================================================= */

/** Kontrol area teks sumber diagram. */
export class Editor {
  constructor(private readonly el: HTMLTextAreaElement) {}

  get value(): string {
    return this.el.value;
  }

  set value(v: string) {
    this.el.value = v;
  }

  /** Daftarkan listener perubahan teks. */
  onInput(listener: () => void): void {
    this.el.addEventListener('input', listener);
  }
}
