import { Page, expect } from '@playwright/test';
import { ADMIN } from '../../support/data';

export class LoginPage {
  constructor(private readonly page: Page) {}

  email = () => this.page.locator('input[formcontrolname="email"]');
  password = () => this.page.locator('input[formcontrolname="password"]');
  submit = () => this.page.getByRole('button', { name: /acessar|entrando/i });

  async goto() {
    await this.page.goto('/login');
    await expect(this.email()).toBeVisible();
  }

  async login(email = ADMIN.email, password = ADMIN.password) {
    await this.email().fill(email);
    await this.password().fill(password);
    const response = this.page.waitForResponse((r) => r.url().includes('/auth/login'));
    await this.submit().click();
    return response;
  }
}
