import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PatientsPage } from './pages/PatientsPage';
import { ExamDialog } from './pages/ExamDialog';
import { uniqueName, validCpf } from '../support/data';

test.describe('Login', () => {
  test('E2E01 - login válido leva à tela de pacientes', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    const res = await login.login();
    expect(res.status()).toBe(200);
    await expect(page).toHaveURL(/\/patients/);
  });

  test('E2E02 - login com senha errada mantém o usuário na tela de login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(undefined, 'senha-errada');
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E03 - acessar /patients sem login redireciona para /login', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Pacientes e exames pela interface', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login();
    await expect(page).toHaveURL(/\/patients/);
  });

  test('E2E10 - cadastra paciente com CPF válido e ele aparece na lista', async ({ page }) => {
    const patients = new PatientsPage(page);
    const name = uniqueName('E2E');
    const res = await patients.create(name, validCpf());
    expect(res.status()).toBe(201);
    await patients.filter(name.toUpperCase());
    await expect(patients.rowByName(name)).toHaveCount(1);
  });

  test('E2E11 - CPF inválido é bloqueado no formulário', async ({ page }) => {
    const patients = new PatientsPage(page);
    await patients.newButton().click();
    await patients.fillForm(uniqueName('E2E'), '12345678900');
    await patients.dialog().getByRole('button', { name: /salvar/i }).click();
    await expect(page.getByText(/cpf inválido/i)).toBeVisible();
    await expect(patients.dialog()).toBeVisible();
  });

  test('E2E12 - editar um paciente não altera os outros da lista', async ({ page }) => {
    const patients = new PatientsPage(page);
    const nameA = uniqueName('E2E-A');
    const nameB = uniqueName('E2E-B');
    await patients.create(nameA, validCpf());
    await patients.create(nameB, validCpf());
    await patients.goto();

    const edited = `${nameB} EDITADO`;
    await patients.filter(nameB.toUpperCase());
    await patients.openEdit(nameB);
    await patients.dialog().locator('input[formcontrolname="name"]').fill(edited);
    const res = await patients.save();
    expect(res.status()).toBe(200);

    await patients.filter('');
    await patients.filter(nameA.toUpperCase());
    await expect(patients.rowByName(nameA), 'o paciente A sumiu ou mudou depois de editar o B').toHaveCount(1);
  });

  test('E2E13 - cadastra exame para um paciente e ele aparece na tela de exames', async ({ page }) => {
    const patients = new PatientsPage(page);
    const name = uniqueName('E2E-EX');
    const cpf = validCpf();
    await patients.create(name, cpf);
    await patients.goto();
    await patients.filter(name.toUpperCase());
    await patients.openNewExam(name);

    const exam = new ExamDialog(page);
    await exam.chooseModality('MR');
    const res = await exam.save();
    expect(res.status()).toBe(201);
    const body = await res.json().catch(() => null);
    expect(body?.id, 'a API respondeu 201 mas sem o exame criado').toBeTruthy();

    await page.goto('/exams');
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page.locator('tr.table-row').filter({ hasText: new RegExp(escaped, 'i') }).first()).toBeVisible();
  });
});
