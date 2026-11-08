// Gera docs/resultados.md a partir do relatório JSON do Playwright.
// Uso: node scripts/report-md.js caminho/results.json > docs/resultados.md
const fs = require('fs');

const file = process.argv[2] ?? 'test-results/results.json';
const report = JSON.parse(fs.readFileSync(file, 'utf8'));

// Teste -> defeito que ele revela (ver docs/relatorio-de-bugs.md)
const BUGS = {
  CT02: 'BUG12', CT03: 'BUG12', CT11: 'BUG03 · BUG06', CT13: 'BUG07', 'CT14b': 'BUG08',
  CT15: 'BUG13 · BUG06', CT16: 'BUG13 · BUG06', CT17: 'BUG02', CT21: 'BUG11', CT22: 'BUG11',
  CT30: 'BUG01', CT33: 'BUG04 (bloqueado pelo BUG01)', CT34: 'BUG04 (bloqueado pelo BUG01)',
  CT36: 'BUG13 (bloqueado pelo BUG01)', CT37: 'BUG02', CT40: 'BUG01', CT42: 'BUG05 (bloqueado pelo BUG01)',
  CT43: 'BUG01', CT50: 'BUG02 · BUG06', CT53: 'BUG14', E2E12: 'BUG09', E2E13: 'BUG01',
  R02: 'BUG15', R03: 'BUG16', A11Y02: 'BUG17', A11Y03: 'BUG17',
};

const rows = [];
const walk = (suite, path) => {
  const here = suite.title && !suite.title.endsWith('.ts') ? [...path, suite.title] : path;
  for (const spec of suite.specs ?? []) for (const t of spec.tests ?? []) {
    const r = t.results?.[t.results.length - 1];
    const id = (spec.title.match(/^(CT\d+b?|E2E\d+|R\d+|A11Y\d+)/) ?? [])[1] ?? '';
    rows.push({ project: t.projectName, group: here.join(' › ') || '-', title: spec.title, ok: r?.status === 'passed', ms: r?.duration ?? 0, bug: BUGS[id] ?? '' });
  }
  for (const s of suite.suites ?? []) walk(s, here);
};
for (const s of report.suites ?? []) walk(s, []);

const total = rows.length;
const passed = rows.filter((r) => r.ok).length;
const failed = total - passed;
const when = new Date(report.stats.startTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const out = [];
out.push('# Resultados da execução\n');
out.push(`Execução de **${when}** (GitHub Actions, aplicação real com PostgreSQL 17 + API NestJS + front Angular; interface em desktop, celular Pixel 7 e tablet 768px) · duração dos testes: **${Math.round(report.stats.duration / 1000)} s**\n`);
out.push('| Total | ✅ Passaram | ❌ Falharam (defeitos) | Taxa de aprovação |');
out.push('|---:|---:|---:|---:|');
out.push(`| **${total}** | **${passed}** | **${failed}** | ${pct(passed, total)}% |\n`);
out.push('> Os testes descrevem o comportamento **esperado** da plataforma. Cada falha corresponde a um defeito documentado em [relatorio-de-bugs.md](relatorio-de-bugs.md).\n');

out.push('## Por área\n');
out.push('| Projeto | Área | Testes | ✅ | ❌ |');
out.push('|---|---|---:|---:|---:|');
const groups = [...new Set(rows.map((r) => `${r.project}|${r.group}`))];
for (const g of groups) {
  const [project, group] = g.split('|');
  const items = rows.filter((r) => r.project === project && r.group === group);
  const ok = items.filter((r) => r.ok).length;
  out.push(`| ${project.toUpperCase()} | ${group} | ${items.length} | ${ok} | ${items.length - ok} |`);
}

out.push('\n## Todos os testes\n');
out.push('| Projeto | Teste | Resultado | Defeito revelado |');
out.push('|---|---|:---:|---|');
for (const r of rows) out.push(`| ${r.project.toUpperCase()} | ${r.title.replace(/\|/g, '\\|')} | ${r.ok ? '✅' : '❌'} | ${r.bug} |`);

console.log(out.join('\n'));
