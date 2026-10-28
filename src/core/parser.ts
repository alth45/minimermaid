import type { Direction, EdgeSpec, NodeSpec, ParseResult, ShapeKind } from './types';
import { resolveShape } from './shapes';

const LINE_PATTERN =
  /^->\s*\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]\s*(?:->\s*icon\s*\[\s*"([^"]*)"\s*\])?\s*(?:->\s*(?:text|label|txt)?\s*\[\s*"([^"]*)"\s*\])?\s*(->\s*node)?\s*$/;

const BRANCH_MARKER_PATTERN = /^\[(cabang|branch|if)\]/i;
const GROUP_PATTERN = /^\[group\s+["']?([^"']+)["']?\]/i;
const SIDE_PATTERN = /^->\s*(ya|yes|tidak|no)\s*(?:\[\s*"([^"]*)"\s*\])?\s*(->\s*node)?\s*$/i;
const DIRECTION_PATTERN = /^\[\s*(horizontal|horiz|lr|vert(?:ical|ikal)?|tb)\s*\](?:\s+.*$|$)/i;

function resolveDirection(token: string): Direction | undefined {
  const t = token.trim().toLowerCase();
  if (t === 'horizontal' || t === 'horiz' || t === 'lr') return 'horizontal';
  if (t === 'vertical' || t === 'vertikal' || t === 'tb') return 'vertical';
  return undefined;
}

interface Line { text: string; indent: number; num: number; }

export function parse(source: string): ParseResult {
  const nodes: NodeSpec[] = [];
  const edges: EdgeSpec[] = [];
  const errors: string[] = [];
  let direction: Direction = 'vertical';

  const lines: Line[] = [];
  source.split(/\r?\n/).forEach((raw, i) => {
    const trimmedStart = raw.trimStart();
    if (trimmedStart === '' || trimmedStart.startsWith('#') || trimmedStart.startsWith('//')) return;
    lines.push({ text: trimmedStart.trimEnd(), indent: raw.length - trimmedStart.length, num: i + 1 });
  });

  const addNode = (
    shape: ShapeKind, label: string, link: boolean, branch: boolean, parent?: number, side?: 'yes' | 'no', group?: string, icon?: string
  ): number => {
    const idx = nodes.length;
    nodes.push({ shape, label, link, branch, parent, side, group, icon });
    return idx;
  };

  const parseNodeLine = (text: string) => {
    const m = LINE_PATTERN.exec(text);
    if (!m || m[1] === undefined) return null;
    const resolved = resolveShape(m[1]);
    if (resolved === undefined) errors.push(`Bentuk "${m[1].toLowerCase()}" tidak dikenal, dipakai 'square'.`);
    return { 
      shape: resolved ?? ('square' as ShapeKind), 
      icon: m[2], 
      label: (m[3] || '').replace(/\\n/g, '\n'), 
      link: m[4] !== undefined 
    };
  };

  let idx = 0;

  const parseBlock = (parentIdx: number | undefined, minIndent: number, currentGroup?: string): void => {
    let prevIdx: number | undefined = undefined;
    let isFirstInBlock = true;

    while (idx < lines.length) {
      const line = lines[idx]!;
      if (line.indent < minIndent) break;
      
      if (line.indent > minIndent) {
        errors.push(`Baris ${line.num}: indentasi tidak terduga (${line.indent} > ${minIndent}).`);
        idx++;
        continue;
      }

      if (GROUP_PATTERN.test(line.text)) {
        const groupMatch = GROUP_PATTERN.exec(line.text)!;
        const groupName = groupMatch[1]!.trim();
        idx++;
        if (idx < lines.length && lines[idx]!.indent > line.indent) {
          parseBlock(parentIdx, lines[idx]!.indent, groupName);
        } else {
          errors.push(`Baris ${line.num}: [group] harus diikuti dengan indentasi (minimal 2 spasi).`);
        }
        continue;
      }

      if (BRANCH_MARKER_PATTERN.test(line.text)) {
        const bm = BRANCH_MARKER_PATTERN.exec(line.text)!;
        const tail = line.text.slice(bm[0].length).replace(/^\s*->\s*/, '');
        const src = parseNodeLine('->' + tail);
        if (!src) { errors.push(`Baris ${line.num}: sintaks cabang tidak dikenal → ${line.text}`); idx++; continue; }

        idx++;
        const srcIdx = addNode(src.shape, src.label, false, true, parentIdx, undefined, currentGroup, src.icon);
        
        if (isFirstInBlock && parentIdx !== undefined) {
          edges.push({ from: parentIdx, to: srcIdx });
          isFirstInBlock = false;
        } else if (prevIdx !== undefined && nodes[prevIdx]?.link) {
          edges.push({ from: prevIdx, to: srcIdx });
        }
        prevIdx = srcIdx;

        let lastSideIdx: number | undefined = undefined;
        let hasYes = false;
        let hasNo = false;
        let baseSideIndent: number | undefined = undefined;

        if (idx < lines.length) {
          const nextLine = lines[idx]!;
          if (SIDE_PATTERN.test(nextLine.text)) {
            for (let k = 0; k < 2; k++) {
              if (idx >= lines.length) break;
              const sideLine = lines[idx]!;
              const m = SIDE_PATTERN.exec(sideLine.text);
              if (!m) break;

              const word = m[1]!.toLowerCase();
              const actual: 'yes' | 'no' = word.startsWith('y') ? 'yes' : 'no';
              const label = m[2] ?? (actual === 'yes' ? 'Ya' : 'Tidak');
              const shape: ShapeKind = actual === 'yes' ? 'round' : 'diamond';
              const hasLink = m[3] !== undefined;

              if (baseSideIndent === undefined) {
                baseSideIndent = sideLine.indent;
              } else if (sideLine.indent !== baseSideIndent) {
                errors.push(`Baris ${sideLine.num}: Indentasi sisi cabang tidak konsisten (${sideLine.indent} spasi, seharusnya ${baseSideIndent}).`);
              }

              if (actual === 'yes') hasYes = true;
              if (actual === 'no') hasNo = true;

              if (k === 0 && actual === 'no') {
                errors.push(`Baris ${sideLine.num}: Sisi "tidak" ditulis sebelum "ya". Sebaiknya tulis sisi "ya" terlebih dahulu.`);
              }
              if (k === 1 && actual === 'yes') {
                errors.push(`Baris ${sideLine.num}: Sisi "ya" ditulis setelah "tidak". Sebaiknya tulis sisi "ya" terlebih dahulu.`);
              }

              idx++;
              const sideIdx = addNode(shape, label, hasLink, false, srcIdx, actual, currentGroup);
              edges.push({ from: srcIdx, to: sideIdx, label });
              lastSideIdx = sideIdx;

              let nextIndent = sideLine.indent + 2;
              if (idx < lines.length && lines[idx]!.indent > sideLine.indent) {
                nextIndent = lines[idx]!.indent;
              }
              parseBlock(sideIdx, nextIndent, currentGroup);

              if (idx >= lines.length || lines[idx]!.indent < line.indent) break;
            }
            if (!hasYes) errors.push(`Baris ${line.num}: Cabang tidak memiliki sisi "ya".`);
            if (!hasNo) errors.push(`Baris ${line.num}: Cabang tidak memiliki sisi "tidak".`);
          }
        }
        prevIdx = lastSideIdx ?? srcIdx;
        continue;
      }

      const n = parseNodeLine(line.text);
      if (!n) { errors.push(`Baris ${line.num}: sintaks tidak dikenal → ${line.text}`); idx++; continue; }

      idx++;
      const nodeIdx = addNode(n.shape, n.label, n.link, false, parentIdx, undefined, currentGroup, n.icon);
      
      if (isFirstInBlock && parentIdx !== undefined) {
        edges.push({ from: parentIdx, to: nodeIdx });
        isFirstInBlock = false;
      } else if (prevIdx !== undefined && nodes[prevIdx]?.link) {
        edges.push({ from: prevIdx, to: nodeIdx });
      }
      prevIdx = nodeIdx;
    }
  };

  if (lines.length > 0) {
    const dm = DIRECTION_PATTERN.exec(lines[0]!.text);
    if (dm && dm[1] !== undefined) {
      direction = resolveDirection(dm[1]) ?? 'vertical';
      idx = 1;
    }
  }

  parseBlock(undefined, lines[idx]?.indent ?? 0, undefined);

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    if (n.link && !edges.some((e) => e.from === i)) {
      errors.push(`Node "${n.label}" memakai "->node" tetapi tidak ada node berikutnya.`);
    }
  }

  return { nodes, edges, errors, direction };
}