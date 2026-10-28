import { describe, expect, it } from 'vitest';
import { layout } from '../src/core/layout';
import { LAYOUT } from '../src/core/config';
import type { NodeSpec } from '../src/core/types';

const node = (label: string, shape: NodeSpec['shape'] = 'square', branch = false): NodeSpec => ({
  shape,
  label,
  hasLink: false,
  branch,
});

describe('layout', () => {
  it('mengembalikan geometri aman untuk diagram kosong', () => {
    const g = layout([], []);
    expect(g.nodes).toEqual([]);
    expect(g.width).toBe(1);
    expect(g.height).toBe(1);
  });

  it('menumpuk node vertikal dengan gap konstan', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const g = layout(nodes, []);
    expect(g.nodes).toHaveLength(3);
    const [a, b, c] = g.nodes;
    expect(a && b && c).toBeTruthy();
    if (a && b && c) {
      expect(b.y).toBe(a.y + a.h + LAYOUT.gap);
      expect(c.y).toBe(b.y + b.h + LAYOUT.gap);
    }
  });

  it('merata tengahkan node yang lebih sempit dari kolom', () => {
    const nodes = [node('Pendek'), node('Label yang jauh lebih panjang sekali')];
    const g = layout(nodes, []);
    const maxW = g.width;
    for (const n of g.nodes) {
      expect(n.x).toBeCloseTo((maxW - n.w) / 2);
    }
    // Node terlebar menempati penuh lebar kolom.
    expect(Math.max(...g.nodes.map((n) => n.w))).toBe(maxW);
  });

  it('menghormati ukuran minimum & aturan per bentuk', () => {
    const g = layout([node('X', 'square'), node('X', 'diamond'), node('X', 'triangle')], []);
    const [square, diamond, triangle] = g.nodes;
    if (square) expect(square.w).toBeGreaterThanOrEqual(110);
    if (diamond) expect(diamond.w).toBeGreaterThanOrEqual(150);
    if (triangle) expect(triangle.h).toBeGreaterThanOrEqual(94);
  });

  it('memecah label multi-baris dan menyesuaikan tinggi', () => {
    const g = layout([node('Satu\nDua\nTiga')], []);
    const n = g.nodes[0];
    expect(n?.lines).toEqual(['Satu', 'Dua', 'Tiga']);
    expect(n && n.h).toBeGreaterThanOrEqual(3 * LAYOUT.lineHeight);
  });

  it('menyusun node horizontal kiri→kanan dengan gap konstan', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const g = layout(nodes, [], 'horizontal');
    expect(g.direction).toBe('horizontal');
    expect(g.nodes).toHaveLength(3);
    const [a, b, c] = g.nodes;
    if (a && b && c) {
      expect(b.x).toBe(a.x + a.w + LAYOUT.gap);
      expect(c.x).toBe(b.x + b.w + LAYOUT.gap);
    }
    // Lebar total = akumulasi lebar + gap; tinggi = node tertinggi.
    const last = g.nodes[g.nodes.length - 1];
    expect(g.width).toBe((last?.x ?? 0) + (last?.w ?? 0));
    expect(g.height).toBe(Math.max(...g.nodes.map((n) => n.h)));
  });

  it('merata tengahkan node yang lebih pendek pada baris horizontal', () => {
    const nodes = [node('Pendek'), node('Label yang jauh lebih panjang sekali\nEkstra')];
    const g = layout(nodes, [], 'horizontal');
    const maxH = g.height;
    for (const n of g.nodes) {
      expect(n.y).toBeCloseTo((maxH - n.h) / 2);
    }
  });

  it('default arah tetap vertikal bila parameter tidak diberikan', () => {
    const g = layout([node('A')], []);
    expect(g.direction).toBe('vertical');
  });
});
