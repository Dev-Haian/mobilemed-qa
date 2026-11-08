import { test, expect, Page, Locator } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PatientsPage } from './pages/PatientsPage';

// Executado nos projetos "mobile" (Pixel 7, 412px) e "tablet" (768px).
// O README do desafio promete "Interface responsiva com Angular Material".

async function noHorizontalScroll(page: Page) {
  const { scroll, viewport } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scroll, `a página tem rolagem horizontal (${scroll}px de conteúdo em ${viewport}px de tela)`).toBeLessThanOrEqual(viewport + 1);
}

async function fullyInViewport(page: Page, locator: Locator, what: string) {
  await expect(locator, `${what} não está visível`).toBeVisible();
  const box = await locator.boundingBox();
  const width = page.viewportSize()!.width;
  expect(box, `${what} sem dimensões`).not.toBeNull();
  expect(box!.x, `${what} começa fora da tela`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${what} ultrapassa a largura da tela (${Math.round(box!.x + box!.width)}px > ${width}px)`).toBeLessThanOrEqual(width + 1);
}

async function evidence(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

async function loginAndOpenPatients(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login();
  await expect(page).toHaveURL(/\/patients/);
  const patients = new PatientsPage(page);
  await expect(patients.heading()).toBeVisible();
  return patients;
}

test.describe('Responsividade', () => {
  test('R01 - tela de login cabe na tela sem rolagem horizontal', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await evidence(page, 'login');
    await noHorizontalScroll(page);
    await fullyInViewport(page, login.email(), 'campo de e-mail');
    await fullyInViewport(page, login.submit(), 'botão Acessar');
  });

  test('R02 - na lista de pacientes, o conteúdo ocupa a maior parte da tela', async ({ page }) => {
    await loginAndOpenPatients(page);
    await evidence(page, 'pacientes');
    const content = page.locator('.page-content');
    const box = await content.boundingBox();
    const width = page.viewportSize()!.width;
    expect(
      box!.width,
      `o menu lateral fixo deixa só ${Math.round(box!.width)}px de ${width}px para o conteúdo`,
    ).toBeGreaterThanOrEqual(width * 0.8);
  });

  test('R03 - botão "Novo Paciente" e busca ficam visíveis dentro da tela', async ({ page }) => {
    const patients = await loginAndOpenPatients(page);
    await noHorizontalScroll(page);
    await fullyInViewport(page, patients.newButton(), 'botão Novo Paciente');
    await fullyInViewport(page, patients.search(), 'campo de busca');
  });

  test('R04 - formulário de cadastro de paciente cabe na tela', async ({ page }) => {
    const patients = await loginAndOpenPatients(page);
    await patients.newButton().click();
    await expect(patients.dialog()).toBeVisible();
    await evidence(page, 'formulario-paciente');
    await fullyInViewport(page, patients.dialog(), 'janela de cadastro');
    await fullyInViewport(page, patients.dialog().getByRole('button', { name: /salvar/i }), 'botão Salvar');
  });

  test('R05 - é possível navegar para a tela de exames', async ({ page }) => {
    await loginAndOpenPatients(page);
    const link = page.locator('a[href*="exams"]').first();
    await expect(link, 'não há link visível para Exames').toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/exams/);
    await evidence(page, 'exames');
    await noHorizontalScroll(page);
  });
});
