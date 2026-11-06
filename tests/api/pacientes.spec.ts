import { test, expect } from '@playwright/test';
import { auth, createPatient, expectNoInternalLeak, login, safeJson } from '../support/api';
import { uniqueName, validCpf } from '../support/data';

let token: string;
test.beforeAll(async ({ request }) => {
  token = await login(request);
});

test.describe('Pacientes - cadastro (POST /pacientes)', () => {
  test('CT10 - cadastra paciente válido e retorna 201 com id', async ({ request }) => {
    const { res, payload, body } = await createPatient(request, token);
    expect(res.status()).toBe(201);
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.name).toBe(payload.name);
    expect(body.document).toBe(payload.document);
  });

  test('CT11 - documento duplicado retorna 409 Conflict sem expor detalhes internos', async ({ request }) => {
    const document = validCpf();
    const first = await createPatient(request, token, { document });
    expect(first.res.status()).toBe(201);
    const second = await createPatient(request, token, { document, name: uniqueName('Duplicado') });
    expect.soft(second.res.status()).toBe(409);
    expectNoInternalLeak(second.body);
  });

  for (const [caso, payload] of [
    ['nome vazio', { name: '', document: validCpf() }],
    ['sem nome', { document: validCpf() }],
    ['documento vazio', { name: uniqueName(), document: '' }],
    ['sem documento', { name: uniqueName() }],
    ['nome numérico (tipo errado)', { name: 123, document: validCpf() }],
  ] as const) {
    test(`CT12 - campo obrigatório: ${caso} retorna 400`, async ({ request }) => {
      const res = await request.post('/pacientes', { headers: auth(token), data: payload });
      expect(res.status()).toBe(400);
    });
  }

  test('CT13 - CPF inválido é rejeitado pela API (não só pelo front)', async ({ request }) => {
    const res = await request.post('/pacientes', {
      headers: auth(token),
      data: { name: uniqueName(), document: '12345678900' },
    });
    expect(res.status(), 'a API aceitou um CPF com dígitos verificadores inválidos').toBe(400);
  });

  test('CT14 - campo desconhecido no corpo é rejeitado com 400', async ({ request }) => {
    const res = await request.post('/pacientes', {
      headers: auth(token),
      data: { name: uniqueName(), document: validCpf(), extra: 'x' },
    });
    expect(res.status()).toBe(400);
  });

  test('CT14b - cliente não consegue falsificar a auditoria (createdBy)', async ({ request }) => {
    const { res, body } = await createPatient(request, token, { createdBy: 'usuario-falso' });
    if (res.status() === 400) return; // rejeitar o campo também é um comportamento aceitável
    expect(body?.createdBy, 'createdBy enviado pelo cliente foi gravado na auditoria').not.toBe('usuario-falso');
  });

  test('CT15 - nome acima do limite do banco (150) retorna 400, não 500', async ({ request }) => {
    const { res, body } = await createPatient(request, token, { name: 'A'.repeat(151) });
    expect.soft(res.status()).toBe(400);
    expectNoInternalLeak(body);
  });

  test('CT16 - documento acima do limite do banco (32) retorna 400, não 500', async ({ request }) => {
    const { res, body } = await createPatient(request, token, { document: '9'.repeat(33) });
    expect.soft(res.status()).toBe(400);
    expectNoInternalLeak(body);
  });
});

test.describe('Pacientes - consulta', () => {
  test('CT17 - busca paciente por id (GET /pacientes/:id) retorna 200', async ({ request }) => {
    const { body: created } = await createPatient(request, token);
    const res = await request.get(`/pacientes/${created.id}`, { headers: auth(token) });
    expect(res.status()).toBe(200);
    expect((await safeJson(res))?.data?.id).toBe(created.id);
  });

  test('CT18 - listagem paginada retorna dados e metadados coerentes', async ({ request }) => {
    await createPatient(request, token);
    const res = await request.get('/pacientes?page=1&pageSize=2', { headers: auth(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.pagination).toMatchObject({ currentPage: 1, pageSize: 2 });
    expect(body.pagination.totalPages).toBe(Math.ceil(body.pagination.totalItems / 2));
  });

  test('CT19 - páginas consecutivas não repetem pacientes', async ({ request }) => {
    for (let i = 0; i < 3; i++) await createPatient(request, token);
    const p1 = await (await request.get('/pacientes?page=1&pageSize=2', { headers: auth(token) })).json();
    const p2 = await (await request.get('/pacientes?page=2&pageSize=2', { headers: auth(token) })).json();
    const ids1 = p1.data.map((p: any) => p.id);
    const ids2 = p2.data.map((p: any) => p.id);
    expect(ids1.filter((id: string) => ids2.includes(id))).toEqual([]);
  });

  for (const query of ['page=0&pageSize=10', 'page=1&pageSize=0', 'page=-1&pageSize=10', 'page=abc&pageSize=10']) {
    test(`CT20 - paginação inválida (${query}) retorna 400`, async ({ request }) => {
      const res = await request.get(`/pacientes?${query}`, { headers: auth(token) });
      expect(res.status()).toBe(400);
    });
  }

  test('CT21 - página além do fim retorna 200 com lista vazia', async ({ request }) => {
    const res = await request.get('/pacientes?page=99999&pageSize=10', { headers: auth(token) });
    expect(res.status()).toBe(200);
    expect((await safeJson(res))?.data).toEqual([]);
  });

  test('CT22 - pageSize muito grande é limitado ou rejeitado', async ({ request }) => {
    const res = await request.get('/pacientes?page=1&pageSize=100000', { headers: auth(token) });
    const body = await safeJson(res);
    const limited = res.status() === 400 || (body?.pagination?.pageSize ?? 0) <= 100;
    expect(limited, 'API aceita pageSize=100000 sem limite (risco de sobrecarga)').toBe(true);
  });
});
