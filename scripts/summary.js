// Gera um resumo em Markdown a partir do relatório JSON do Playwright.
const fs = require('fs');
const file = 'test-results/results.json';
if (!fs.existsSync(file)) { console.log('Relatório JSON não encontrado.'); process.exit(0); }
const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = [];
const walk = (suite, project) => {
  for (const spec of suite.specs ?? []) for (const t of spec.tests ?? []) {
    const r = t.results?.[t.results.length - 1];
    rows.push({ project: t.projectName || project, title: spec.title, status: r?.status ?? 'skipped', error: (r?.error?.message ?? '').split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '').slice(0, 140) });
  }
  for (const s of suite.suites ?? []) walk(s, project);
};
for (const s of report.suites ?? []) walk(s, '');
const passed = rows.filter((r) => r.status === 'passed').length;
const failed = rows.filter((r) => r.status !== 'passed' && r.status !== 'skipped').length;
console.log(`## Resultado dos testes\n\n**${rows.length} testes** · ✅ ${passed} passaram · ❌ ${failed} falharam\n`);
console.log('| Projeto | Teste | Status | Motivo |\n|---|---|---|---|');
for (const r of rows) console.log(`| ${r.project} | ${r.title} | ${r.status === 'passed' ? '✅' : '❌ ' + r.status} | ${r.error.replace(/\|/g, '\\|')} |`);
