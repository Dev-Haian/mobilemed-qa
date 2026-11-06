import { test, expect } from '@playwright/test';
import { allExams, auth, createExam, createPatient, expectNoInternalLeak, login, safeJson } from '../support/api';
import { MODALITIES, newKey } from '../support/data';
import { randomUUID } from 'crypto';

let token: string;
let patientId: string;

test.beforeAll(async ({ request }) => {
  token = await login(request);
  const { res, body } = await createPatient(request, token);
  expect(res.status(), 'pré-condição: criar paciente').toBe(201);
  patientId = body.id;
});

test.describe('Exames - cadastro (POST /exames)', () => {
  test('CT30 - cadastra exame válido, retorna 201 e o exame fica gravado', async ({ request }) => {
    const key = newKey();
    const { res, body } = await createExam(request, token, { patientId, modality: 'CT', idempotencyKey: key });
    expect(res.status()).toBe(201);
    expect(body?.id, 'resposta do cadastro veio sem id do exame').toBeTruthy();
    expect(body?.idempotencyKey).toBe(key);
    const saved = (await allExams(request, token)).filter((e) => e.idempotencyKey === key);
    expect(saved, 'o exame não foi gravado no banco').toHaveLength(1);
  });

  for (const modality of MODALITIES) {
    test(`CT31 - aceita a modalidade DICOM ${modality}`, async ({ request }) => {
      const { res } = await createExam(request, token, { patientId, modality, idempotencyKey: newKey() });
      expect(res.status()).toBe(201);
    });
  }

  for (const modality of ['XX', 'ct', '', 'CTX']) {
    test(`CT32 - rejeita modalidade inválida "${modality}" com 400`, async ({ request }) => {
      const { res } = await createExam(request, token, { patientId, modality, idempotencyKey: newKey() });
      expect(res.status()).toBe(400);
    });
  }

  test('CT33 - exame para paciente inexistente retorna 404, sem expor detalhes internos', async ({ request }) => {
    const { res, body } = await createExam(request, token, {
      patientId: randomUUID(),
      modality: 'CT',
      idempotencyKey: newKey(),
    });
    expect.soft(res.status()).toBe(404);
    expectNoInternalLeak(body);
  });

  test('CT34 - patientId fora do formato UUID retorna 400', async ({ request }) => {
    const { res, body } = await createExam(request, token, { patientId: 'abc', modality: 'CT', idempotencyKey: newKey() });
    expect(res.status()).toBe(400);
    expectNoInternalLeak(body);
  });

  test('CT35 - sem idempotencyKey retorna 400', async ({ request }) => {
    const { res } = await createExam(request, token, { patientId, modality: 'CT' });
    expect(res.status()).toBe(400);
  });

  test('CT36 - idempotencyKey acima de 128 caracteres retorna 400, não 500', async ({ request }) => {
    const { res, body } = await createExam(request, token, { patientId, modality: 'CT', idempotencyKey: 'k'.repeat(129) });
    expect(res.status()).toBe(400);
    expectNoInternalLeak(body);
  });
});

test.describe('Exames - consulta', () => {
  test('CT37 - busca exame por id (GET /exames/:id) retorna 200', async ({ request }) => {
    const exams = await allExams(request, token);
    expect(exams.length, 'pré-condição: existir ao menos um exame (seed)').toBeGreaterThan(0);
    const res = await request.get(`/exames/${exams[0].id}`, { headers: auth(token) });
    expect(res.status()).toBe(200);
    expect((await safeJson(res))?.data?.id).toBe(exams[0].id);
  });

  test('CT38 - contrato do README: GET /exames?page=1&pageSize=1 retorna no máximo 1 exame', async ({ request }) => {
    const res = await request.get('/exames?page=1&pageSize=1', { headers: auth(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length, 'a rota documentada ignora a paginação').toBeLessThanOrEqual(1);
  });

  test('CT39 - listagem paginada de exames (GET /exames/paginated) traz metadados coerentes', async ({ request }) => {
    const res = await request.get('/exames/paginated?page=1&pageSize=5', { headers: auth(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.pagination.totalPages).toBe(Math.ceil(body.pagination.totalItems / 5));
  });
});
