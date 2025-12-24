export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Invalid phone number');
  }
  return digits;
}

export function renderMessage(template: string, firstName?: string | null): string {
  const safeName = firstName ?? '';
  return template.replace(/\{first_name\}/g, safeName);
}
