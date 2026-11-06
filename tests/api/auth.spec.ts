import { test, expect } from '@playwright/test';
import { ADMIN } from '../support/data';
import { auth, login, safeJson } from '../support/api';

test.describe('Autenticação (POST /auth/login)', () => {
  test('CT01 - login com credenciais válidas retorna token JWT', async ({ request }) => {
    const res = await request.post('/auth/login', { data: ADMIN });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(body.data.expiresIn).toBeGreaterThan(0);
    expect(body.data).not.toHaveProperty('password');
  });

  test('CT02 - senha incorreta retorna 401 Unauthorized', async ({ request }) => {
    const res = await request.post('/auth/login', { data: { ...ADMIN, password: 'senha-errada' } });
    expect(res.status()).toBe(401);
    expect((await safeJson(res))?.data ?? null).toBeNull();
  });

  test('CT03 - e-mail inexistente retorna 401 com a mesma mensagem da senha incorreta', async ({ request }) => {
    const wrongPass = await safeJson(await request.post('/auth/login', { data: { ...ADMIN, password: 'x' } }));
    const res = await request.post('/auth/login', { data: { email: 'naoexiste@qa.com', password: 'x' } });
    expect(res.status()).toBe(401);
    expect((await safeJson(res))?.message).toBe(wrongPass?.message);
  });

  test('CT04 - e-mail em formato inválido retorna 400', async ({ request }) => {
    const res = await request.post('/auth/login', { data: { email: 'nao-e-email', password: 'x' } });
    expect(res.status()).toBe(400);
  });

  test('CT05 - rota protegida sem token retorna 401', async ({ request }) => {
    const res = await request.get('/pacientes');
    expect(res.status()).toBe(401);
  });

  test('CT06 - rota protegida com token adulterado retorna 401', async ({ request }) => {
    const token = await login(request);
    const tampered = token.slice(0, -4) + (token.endsWith('aaaa') ? 'bbbb' : 'aaaa');
    const res = await request.get('/pacientes', { headers: auth(tampered) });
    expect(res.status()).toBe(401);
  });
});
