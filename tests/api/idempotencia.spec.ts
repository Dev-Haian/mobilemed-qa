import { test, expect } from '@playwright/test';
import { allExams, createExam, createPatient, login } from '../support/api';
import { SEED, newKey } from '../support/data';

let token: string;
let patientId: string;

test.beforeAll(async ({ request }) => {
  token = await login(request);
  const { res, body } = await createPatient(request, token);
  expect(res.status(), 'pré-condição: criar paciente').toBe(201);
  patientId = body.id;
});

test.describe('Idempotência no cadastro de exames', () => {
  test('CT40 - reenvio com a mesma idempotencyKey devolve o mesmo exame e não duplica', async ({ request }) => {
    const payload = { patientId, modality: 'MR', idempotencyKey: newKey() };
    const first = await createExam(request, token, payload);
    const second = await createExam(request, token, payload);
    expect(first.res.ok()).toBe(true);
    expect(second.res.ok()).toBe(true);
    expect(second.body?.id).toBeTruthy();
    expect(second.body?.id).toBe(first.body?.id);
    const saved = (await allExams(request, token)).filter((e) => e.idempotencyKey === payload.idempotencyKey);
    expect(saved).toHaveLength(1);
  });

  test('CT41 - chave já existente no seed devolve o exame original', async ({ request }) => {
    const { res, body } = await createExam(request, token, {
      patientId: SEED.patientId,
      modality: 'CT',
      idempotencyKey: SEED.examKey,
    });
    expect(res.ok()).toBe(true);
    expect(body?.id).toBe(SEED.examId);
  });

  test('CT42 - 10 requisições simultâneas com a mesma chave criam apenas 1 exame', async ({ request }) => {
    const payload = { patientId, modality: 'US', idempotencyKey: newKey() };
    const results = await Promise.all(Array.from({ length: 10 }, () => createExam(request, token, payload)));
    const statuses = results.map((r) => r.res.status());
    expect(statuses.filter((s) => s >= 500), `respostas 5xx: ${statuses.join(',')}`).toEqual([]);
    const ids = new Set(results.map((r) => r.body?.id).filter(Boolean));
    expect(ids.size, 'respostas trouxeram ids diferentes ou nenhum id').toBe(1);
    const saved = (await allExams(request, token)).filter((e) => e.idempotencyKey === payload.idempotencyKey);
    expect(saved).toHaveLength(1);
  });

  test('CT43 - mesma chave com dados diferentes não cria um segundo exame', async ({ request }) => {
    const key = newKey();
    await createExam(request, token, { patientId, modality: 'CT', idempotencyKey: key });
    const second = await createExam(request, token, { patientId, modality: 'XA', idempotencyKey: key });
    // Ambiguidade AMB01: o esperado pode ser devolver o original (200/201) ou recusar (409/422).
    expect([200, 201, 409, 422]).toContain(second.res.status());
    const saved = (await allExams(request, token)).filter((e) => e.idempotencyKey === key);
    expect(saved).toHaveLength(1);
    expect(saved[0].modality).toBe('CT');
  });
});
