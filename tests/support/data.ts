import { randomUUID } from 'crypto';

/** Credenciais criadas pelo seed da aplicação (README do desafio). */
export const ADMIN = { email: 'adm@gmail.com', password: 'muka123' };

/** Dados criados pelo seed: usados como oráculo nos testes de idempotência. */
export const SEED = {
  patientId: '9d1e25b6-f352-76e9-5311-d63b35a6f351',
  examId: 'b4a656d4-5381-48b6-8fae-5638159a17fc',
  examKey: 'exam-2025-09-08-001',
};

export const MODALITIES = ['CR', 'CT', 'DX', 'MG', 'MR', 'NM', 'OT', 'PT', 'RF', 'US', 'XA'] as const;

/** Gera um CPF válido (11 dígitos, sem máscara), com os dois dígitos verificadores corretos. */
export function validCpf(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  if (base.every((d) => d === base[0])) base[0] = (base[0] + 1) % 10;
  const digit = (nums: number[]) => {
    const sum = nums.reduce((acc, n, i) => acc + n * (nums.length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = digit(base);
  const d2 = digit([...base, d1]);
  return [...base, d1, d2].join('');
}

/** Formata um CPF como o front exibe: 000.000.000-00 */
export function maskCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function uniqueName(prefix = 'Paciente QA'): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function newKey(): string {
  return `qa-${randomUUID()}`;
}
