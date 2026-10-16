import { it } from 'vitest';
import { parse } from '../src/core/parser';
import { layout } from '../src/core/layout';
import { renderDiagram } from '../src/rendering/diagram';

const show = (name: string, src: string) => {
  const p = parse(src);
  const g = layout(p.nodes, p.edges, p.direction);
  console.log('===', name, '| direction:', g.direction, '| errors:', JSON.stringify(p.errors));
  g.nodes.forEach((n,i)=>console.log(` node${i} "${n.label}" x=${n.x.toFixed(1)} y=${n.y.toFixed(1)} w=${n.w} h=${n.h} branch=${n.branch}`));
  const r = renderDiagram(g);
  const paths = [...r.markup.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]!);
  paths.slice(0,8).forEach(d=>console.log(' path:', d.slice(0,95)));
};

it('dump', () => {
show('CABANG VERTIKAL (satu baris multi-segmen)', `->[round]->text["Mulai"]->node\n[cabang]->[diamond]->text["Login?"]->node->[ya]->text["OK"]->node->[tidak]->text["Gagal"]\n->[square]->text["Selesai"]`);
show('HORIZONTAL + CABANG', `[horizontal]\n->[round]->text["Mulai"]->node\n[cabang]->[diamond]->text["Login?"]->node->[ya]->text["OK"]->node->[tidak]->text["Gagal"]\n->[square]->text["Selesai"]`);
});
