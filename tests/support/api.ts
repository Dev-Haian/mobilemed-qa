import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { ADMIN, uniqueName, validCpf } from './data';

/** Faz login com o usuário do seed e devolve o token JWT. */
export async function login(request: APIRequestContext, creds = ADMIN): Promise<string> {
  const res = await request.post('/auth/login', { data: creds });
  expect(res.status(), `login deveria funcionar: ${await res.text()}`).toBe(200);
  const body = await res.json();
  expect(body.data?.accessToken, 'resposta do login sem accessToken').toBeTruthy();
  return body.data.accessToken as string;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Cria um paciente válido via API e devolve o corpo da resposta. */
export async function createPatient(request: APIRequestContext, token: string, overrides: Record<string, unknown> = {}) {
  const payload = { name: uniqueName(), document: validCpf(), ...overrides };
  const res = await request.post('/pacientes', { headers: auth(token), data: payload });
  return { res, payload, body: await safeJson(res) };
}

export async function createExam(request: APIRequestContext, token: string, payload: Record<string, unknown>) {
  const res = await request.post('/exames', { headers: auth(token), data: payload });
  return { res, body: await safeJson(res) };
}

/** Lista todos os exames (rota sem paginação) para conferir o que foi realmente gravado. */
export async function allExams(request: APIRequestContext, token: string): Promise<any[]> {
  const res = await request.get('/exames', { headers: auth(token) });
  const body = await safeJson(res);
  return Array.isArray(body?.data) ? body.data : [];
}

export async function safeJson(res: APIResponse): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

/** Uma resposta de erro não deve expor detalhes internos (stack trace, SQL, nomes de tabela). */
export function expectNoInternalLeak(body: unknown) {
  const text = JSON.stringify(body ?? '');
  expect(text, 'resposta expõe stack trace (campo "stark" ou "stack")').not.toMatch(/"stark"\s*:\s*"|"stack"\s*:/);
  expect(text, 'resposta expõe detalhes do banco').not.toMatch(/duplicate key|violates|constraint|QueryFailedError|at \w+ \(/i);
}
