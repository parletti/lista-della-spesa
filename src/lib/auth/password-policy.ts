const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "1234567890",
  "12345678",
  "qwerty123",
  "qwertyuiop",
  "asdfghjkl",
  "letmein123",
  "admin12345",
  "abcdef1234",
  "1111111111",
  "0000000000",
]);

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

type PasswordValidationResult = {
  ok: boolean;
  error?: string;
};

export function validatePasswordPolicy(password: string, email?: string): PasswordValidationResult {
  const value = password.trim();
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `La password deve avere almeno ${PASSWORD_MIN_LENGTH} caratteri.` };
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `La password può avere al massimo ${PASSWORD_MAX_LENGTH} caratteri.` };
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);

  if (!hasUppercase || !hasLowercase || !hasDigit) {
    return {
      ok: false,
      error: "La password deve contenere almeno una maiuscola, una minuscola e un numero.",
    };
  }

  const normalized = value.toLowerCase();
  if (WEAK_PASSWORDS.has(normalized)) {
    return { ok: false, error: "Password troppo debole. Scegline una più robusta." };
  }

  if (email) {
    const localPart = email.toLowerCase().split("@")[0];
    if (localPart.length >= 3 && normalized.includes(localPart)) {
      return { ok: false, error: "La password non deve contenere parti della tua email." };
    }
  }

  return { ok: true };
}
