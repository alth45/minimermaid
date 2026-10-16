import type { ShapeKind } from './types';

/* =========================================================
   Kamus alias bentuk → nilai kanonik.
   Mendukung istilah Inggris & Indonesia agar fleksibel.
   ========================================================= */

const ALIAS: Record<string, ShapeKind> = {
  square: 'square', rect: 'square', box: 'square', kotak: 'square', persegi: 'square',
  round: 'round', rounded: 'round', stadium: 'round', pill: 'round', kapsul: 'round',
  circle: 'circle', lingkaran: 'circle', bulat: 'circle',
  ellipse: 'ellipse', elips: 'ellipse', oval: 'ellipse',
  diamond: 'diamond', decision: 'diamond', rhombus: 'diamond',
  belah: 'diamond', belahketupat: 'diamond',
  triangle: 'triangle', segitiga: 'triangle',
  hexagon: 'hexagon', segienam: 'hexagon',
  parallelogram: 'parallelogram', jajargenjang: 'parallelogram',
  cylinder: 'cylinder', database: 'cylinder', db: 'cylinder', silinder: 'cylinder',
  document: 'document', doc: 'document', dokumen: 'document',

};

/**
 * Penanda bentuk untuk sintaks percabangan satu-baris `[cabang]`:
 *   ->[cabang]->text["Keputusan?"]      → node sumber cabang
 *   ->[ya]->text["Berhasil"]            → sisi "ya"
 *   ->[tidak]->text["Gagal"]            → sisi "tidak"
 */
export type BranchRole = 'source' | 'yes' | 'no';

const BRANCH_SHAPE_ALIASES: Record<string, BranchRole> = {
  cabang: 'source', branch: 'source', if: 'source',
  ya: 'yes', yes: 'yes',
  tidak: 'no', no: 'no',
};

/** Kenali token bentuk sebagai penanda cabang (case-insensitive). */
export function resolveBranchRole(token: string): BranchRole | undefined {
  return BRANCH_SHAPE_ALIASES[token.trim().toLowerCase()];
}

/**
 * Selesaikan token bentuk (case-insensitive) ke nilai kanonik.
 * @returns ShapeKind, atau undefined bila tidak dikenal.
 */
export function resolveShape(token: string): ShapeKind | undefined {
  return ALIAS[token.trim().toLowerCase()];
}
