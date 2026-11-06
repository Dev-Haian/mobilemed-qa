import { test, expect } from '@playwright/test';
import { auth, expectNoInternalLeak, login, safeJson } from '../support/api';

let token: string;
test.beforeAll(async ({ request }) => {
  token = await login(request);
});

test.describe('Segurança e privacidade (dados de saúde / LGPD)', () => {
  test('CT50 - erro interno não devolve stack trace nem SQL ao cliente', async ({ request }) => {
    // id fora do formato UUID força um erro no banco
    const res = await request.get('/pacientes/id-invalido', { headers: auth(token) });
    expect(res.status()).toBeLessThan(500);
    expectNoInternalLeak(await safeJson(res));
  });

  test('CT51 - listagem de usuários do sistema não expõe senha (hash)', async ({ request }) => {
    const res = await request.get('/user-system', { headers: auth(token) });
    const text = await res.text();
    expect(text, 'resposta expõe hash de senha').not.toMatch(/"password"\s*:\s*"\$2[aby]\$/);
  });

  test('CT52 - endpoints de usuários exigem autenticação', async ({ request }) => {
    const res = await request.get('/user-system');
    expect(res.status()).toBe(401);
  });

  test('CT53 - resposta de login não devolve o e-mail na URL do envelope', async ({ request }) => {
    const res = await request.post('/auth/login', { data: { email: 'adm@gmail.com', password: 'muka123' } });
    const body = await res.json();
    expect(String(body.url ?? '')).not.toContain('adm@gmail.com');
  });
});
