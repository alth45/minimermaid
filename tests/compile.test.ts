import { describe, expect, it } from 'vitest';
import { compile } from '../src/core/compile';
import { ALL_SHAPES } from '../src/core/config';

describe('compile', () => {
  it('menghasilkan markup SVG + viewBox dari kode valid', () => {
    const r = compile('-> [square]->text["A"]->node\n-> [round]->text["B"]');
    expect(r.errors).toEqual([]);
    expect(r.markup).toContain('<marker id="arrow"');
    expect(r.markup).toContain('class="node"');
    expect(r.viewBox).toMatch(/^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/);
  });

  it('menghasilkan kanvas kosong untuk sumber kosong', () => {
    const r = compile('# hanya komentar\n');
    expect(r.markup).toBe('');
    expect(r.viewBox).toBe('0 0 100 100');
  });

  it('meng-escape karakter XML berbahaya di label', () => {
    const r = compile('-> [square]->text["<script>alert(1)</script>"]');
    expect(r.markup).not.toContain('<script>');
    expect(r.markup).toContain('&lt;script&gt;');
  });

  it('menggambar edge untuk node bertaut', () => {
    const r = compile('-> [square]->text["A"]->node\n-> [square]->text["B"]');
    expect(r.markup).toContain('marker-end="url(#arrow)"');
  });

  it.each(ALL_SHAPES)('merender bentuk %s dengan elemen SVG yang benar', (shape) => {
    const r = compile(`-> [${shape}]->text["X"]`);
    expect(r.errors).toEqual([]);
    const expectedTag =
      shape === 'circle' || shape === 'ellipse'
        ? '<ellipse'
        : shape === 'square' || shape === 'round'
          ? '<rect'
          : shape === 'cylinder' || shape === 'document'
            ? '<path'
            : '<polygon';
    expect(r.markup).toContain(expectedTag);
    expect(r.markup).toContain('>X</tspan>');
  });

  it('tetap mengembalikan hasil parsial saat ada error sintaks', () => {
    const r = compile('-> [square]->text["A"]\nbaris rusak');
    expect(r.errors).toHaveLength(1);
    expect(r.markup).toContain('class="node"');
  });
});
