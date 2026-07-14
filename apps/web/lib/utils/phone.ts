export function toE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return '1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return digits;
}

export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const d = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return e164;
}

export function extractAreaCode(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1, 4);
  if (digits.length === 10) return digits.slice(0, 3);
  return '';
}

export function validatePhoneNumber(input: string): { valid: boolean; error?: string } {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10) return { valid: false, error: 'Number must be at least 10 digits' };
  if (digits.length > 11) return { valid: false, error: 'Number is too long' };
  if (digits.length === 11 && !digits.startsWith('1')) {
    return { valid: false, error: 'US numbers must start with 1' };
  }
  return { valid: true };
}
