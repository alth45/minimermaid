import { describe, expect, it } from 'vitest';
import { parse } from '../src/core/parser';

describe('parse', () => {
  it('mengurai bentuk, label, dan link', () => {
    const r = parse('-> [round] -> text ["Mulai"] -> node\n-> [diamond]->text["Ok?"]');
    expect(r.errors).toEqual([]);
    expect(r.nodes).toEqual([
      { shape: 'round', label: 'Mulai', link: true },
      { shape: 'diamond', label: 'Ok?', link: false },
    ]);
    expect(r.edges).toEqual([{ from: 0, to: 1 }]);
  });

  it('mengenali alias Indonesia', () => {
    const r = parse('-> [kotak]->text["A"]\n-> [db]->text["B"]');
    expect(r.nodes.map((n) => n.shape)).toEqual(['square', 'cylinder']);
  });

  it('melewati baris kosong dan komentar', () => {
    const r = parse('# komentar\n\n// komentar lain\n-> [square]->text["A"]');
    expect(r.errors).toEqual([]);
    expect(r.nodes).toHaveLength(1);
  });

  it('melaporkan sintaks tak dikenal dengan nomor baris', () => {
    const r = parse('-> [square]->text["A"]\nini bukan diagram');
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain('Baris 2');
    expect(r.nodes).toHaveLength(1);
  });

  it('fallback ke square untuk bentuk tak dikenal sambil memberi error', () => {
    const r = parse('-> [trapesium]->text["A"]');
    expect(r.nodes[0]?.shape).toBe('square');
    expect(r.errors[0]).toContain('trapesium');
  });

  it('mengubah \\n literal dalam label menjadi baris baru', () => {
    const r = parse('-> [square]->text["Satu\\nDua"]');
    expect(r.nodes[0]?.label).toBe('Satu\nDua');
  });

  it('membangun rantai edge bertaut', () => {
    const r = parse(
      '-> [square]->text["A"]->node\n-> [square]->text["B"]->node\n-> [square]->text["C"]',
    );
    expect(r.edges).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ]);
  });

  it('melaporkan node terakhir yang menggantung', () => {
    const r = parse('-> [square]->text["A"]->node');
    expect(r.errors[0]).toContain('Node terakhir');
  });

  it('menerima variasi keyword text|label|txt', () => {
    const r = parse(
      '-> [square]->text["A"]\n-> [square]->label["B"]\n-> [square]->txt["C"]\n-> [square]->["D"]',
    );
    expect(r.errors).toEqual([]);
    expect(r.nodes.map((n) => n.label)).toEqual(['A', 'B', 'C', 'D']);
  });
});
