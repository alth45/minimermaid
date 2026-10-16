import { describe, expect, it } from 'vitest';
import { compile } from '../src/core/compile';
import { heuristicMeasurer, layout } from '../src/core/layout';
import { LAYOUT } from '../src/core/config';
import type { NodeSpec, TextMeasurer } from '../src/core/types';

const node = (label: string, shape: NodeSpec['shape'] = 'square'): NodeSpec => ({
  shape,
  label,
  link: false,
  branch: false,
});

/** Measurer tiruan: lebar = jumlah "kode-unit" × faktor — meniru metrik font
 *  di mana karakter CJK/emoji terhitung dua kali lebih lebar dari ASCII. */
const doubleWidthCJK: TextMeasurer = {
  measure(text: string): number {
    let units = 0;
    for (const ch of text) units += ch.charCodeAt(0) > 0xff ? 2 : 1;
    return units * LAYOUT.charWidth;
  },
};

describe('TextMeasurer (Issue #6)', () => {
  it('heuristik bawaan tetap panjang × charWidth', () => {
    expect(heuristicMeasurer.measure('abc')).toBeCloseTo(3 * LAYOUT.charWidth);
    // karakter lebar TETAP dihitung 1 satuan oleh heuristik lama (akarnya bug)
    expect(heuristicMeasurer.measure('漢字')).toBeCloseTo(2 * LAYOUT.charWidth);
  });

  it('layout memakai measurer yang disuntik untuk memperlebar node', () => {
    const nodes = [node('漢字テスト')]; // 5 karakter CJK
    const gDefault = layout(nodes, []);
    const gMeasured = layout(nodes, [], 'vertical', doubleWidthCJK);
    const wDefault = gDefault.nodes[0]?.w ?? 0;
    const wMeasured = gMeasured.nodes[0]?.w ?? 0;
    // 10 "unit" vs 5 "unit": node harus ikut melebar sesuai metrik sebenarnya
    expect(wMeasured).toBeGreaterThan(wDefault);
    expect(wMeasured).toBeCloseTo(10 * LAYOUT.charWidth + LAYOUT.padX);
  });

  it('measurer yang mengembalikan 0 tidak membuat node lebih kecil dari minimum', () => {
    const zero: TextMeasurer = { measure: () => 0 };
    const g = layout([node('ABCDEF')], [], 'vertical', zero);
    expect(g.nodes[0]?.w).toBe(LAYOUT.minW);
    expect(g.nodes[0]?.h).toBe(LAYOUT.minH);
  });

  it('measurer multi-baris memakai baris terpanjang hasil pengukuran', () => {
    const g = layout([node('ab\ncd')], [], 'vertical', doubleWidthCJK);
    // kedua baris sama-sama 2 unit → teks 2×8.4, belum melewati minW
    expect(g.nodes[0]?.w).toBe(LAYOUT.minW);
    const gWide = layout([node('ab\n漢字漢字漢字')], [], 'vertical', doubleWidthCJK);
    expect(gWide.nodes[0]?.w).toBeCloseTo(12 * LAYOUT.charWidth + LAYOUT.padX);
  });

  it('compile() meneruskan opsi measure ke layout', () => {
    const src = '-> [square]->text["漢字テスト"]';
    const rDefault = compile(src);
    const rMeasured = compile(src, { measure: doubleWidthCJK });
    expect(rMeasured.markup).not.toBe(rDefault.markup);
    // viewBox hasil compile dengan measurer lebar harus lebih luas
    const vbW = (vb: string) => Number(vb.split(' ')[2]);
    expect(vbW(rMeasured.viewBox)).toBeGreaterThan(vbW(rDefault.viewBox));
  });

  it('compile() tanpa opsi tetap identik dengan perilaku lama (regresi default)', () => {
    const src = '-> [square]->text["Hello World"]';
    expect(compile(src).markup).toBe(compile(src, {}).markup);
  });
});
