import { Page } from '@playwright/test';

export class ExamDialog {
  constructor(private readonly page: Page) {}

  dialog = () => this.page.locator('mat-dialog-container');

  async chooseModality(modality: string) {
    await this.dialog().locator('mat-select[formcontrolname="modality"]').click();
    await this.page.getByRole('option', { name: modality, exact: true }).click();
  }

  async save() {
    const response = this.page.waitForResponse((r) => r.url().includes('/exames') && r.request().method() === 'POST');
    await this.dialog().getByRole('button', { name: /salvar/i }).click();
    return response;
  }
}
