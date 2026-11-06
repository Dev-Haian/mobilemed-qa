import { Locator, Page, expect } from '@playwright/test';

export class PatientsPage {
  constructor(private readonly page: Page) {}

  heading = () => this.page.getByRole('heading', { name: 'Pacientes', exact: true });
  newButton = () => this.page.getByRole('button', { name: /novo paciente/i });
  search = () => this.page.getByPlaceholder(/buscar por/i);
  rows = () => this.page.locator('tr.table-row');
  dialog = () => this.page.locator('mat-dialog-container');

  rowByName(name: string): Locator {
    return this.rows().filter({ hasText: name.toUpperCase() });
  }

  private iconButton(row: Locator, icon: string): Locator {
    return row.locator('button', { has: this.page.locator('mat-icon', { hasText: icon }) });
  }

  async goto() {
    await this.page.goto('/patients');
    await expect(this.heading()).toBeVisible();
  }

  async fillForm(name: string, document: string) {
    const dialog = this.dialog();
    await dialog.locator('input[formcontrolname="name"]').fill(name);
    await dialog.locator('input[formcontrolname="document"]').fill(document);
  }

  async save() {
    const response = this.page.waitForResponse((r) => r.url().includes('/pacientes') && ['POST', 'PUT'].includes(r.request().method()));
    await this.dialog().getByRole('button', { name: /salvar/i }).click();
    return response;
  }

  async create(name: string, document: string) {
    await this.newButton().click();
    await this.fillForm(name, document);
    return this.save();
  }

  async filter(text: string) {
    if (!(await this.search().isVisible())) return;
    await this.search().fill(text);
    await this.search().press('End'); // o filtro do Angular escuta o evento keyup
  }

  async openEdit(name: string) {
    await this.iconButton(this.rowByName(name), 'edit').click();
  }

  async openNewExam(name: string) {
    await this.iconButton(this.rowByName(name), 'add_box').click();
  }
}
