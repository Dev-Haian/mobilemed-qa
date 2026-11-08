import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from './pages/LoginPage';
import { PatientsPage } from './pages/PatientsPage';

// Verificação automática de acessibilidade (WCAG 2.1 A/AA) com axe-core.
// Falha apenas em violações de impacto "serious" ou "critical"; as demais ficam anexadas ao relatório.

async function audit(page: Page, name: string) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const resumo = result.violations.map((v) => ({ regra: v.id, impacto: v.impact, descricao: v.help, ocorrencias: v.nodes.length }));
  await test.info().attach(`axe-${name}.json`, { body: JSON.stringify(resumo, null, 2), contentType: 'application/json' });
  const graves = resumo.filter((v) => v.impacto === 'serious' || v.impacto === 'critical');
  expect(graves, `violações graves de acessibilidade em ${name}: ${graves.map((g) => `${g.regra} (${g.ocorrencias})`).join(', ')}`).toEqual([]);
}

test.describe('Acessibilidade (axe-core / WCAG 2.1 AA)', () => {
  test('A11Y01 - tela de login', async ({ page }) => {
    await new LoginPage(page).goto();
    await audit(page, 'login');
  });

  test('A11Y02 - lista de pacientes', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login();
    await expect(new PatientsPage(page).heading()).toBeVisible();
    await audit(page, 'pacientes');
  });

  test('A11Y03 - formulário de cadastro de paciente', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login();
    const patients = new PatientsPage(page);
    await expect(patients.heading()).toBeVisible();
    await patients.newButton().click();
    await expect(patients.dialog()).toBeVisible();
    await audit(page, 'formulario-paciente');
  });
});
