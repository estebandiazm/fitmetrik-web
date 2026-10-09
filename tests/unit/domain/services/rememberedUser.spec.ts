import { describe, it, expect } from 'vitest';
import { normalizeRememberedEmail } from '@/domain/services/rememberedUser';

describe('normalizeRememberedEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(normalizeRememberedEmail('  Ana.Perez@Correo.COM ')).toBe('ana.perez@correo.com');
  });

  it('returns null for empty values', () => {
    expect(normalizeRememberedEmail(undefined)).toBeNull();
    expect(normalizeRememberedEmail(null)).toBeNull();
    expect(normalizeRememberedEmail('   ')).toBeNull();
  });

  it('rejects values that are not emails', () => {
    expect(normalizeRememberedEmail('ana')).toBeNull();
    expect(normalizeRememberedEmail('ana@correo')).toBeNull();
    expect(normalizeRememberedEmail('ana @correo.com')).toBeNull();
  });

  it('rejects overly long values', () => {
    expect(normalizeRememberedEmail(`${'a'.repeat(250)}@x.co`)).toBeNull();
  });
});
