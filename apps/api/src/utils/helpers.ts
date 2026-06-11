import { v4 as uuidv4 } from 'uuid';

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `NDP-${year}-${random}`;
}

export function formatPhoneNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const area = cleaned.slice(1, 4);
    const prefix = cleaned.slice(4, 7);
    const line = cleaned.slice(7);
    return `(${area}) ${prefix}-${line}`;
  }
  if (cleaned.length === 10) {
    const area = cleaned.slice(0, 3);
    const prefix = cleaned.slice(3, 6);
    const line = cleaned.slice(6);
    return `(${area}) ${prefix}-${line}`;
  }
  return number;
}

export function generateAffiliateCode(): string {
  return `NDP-${uuidv4().slice(0, 8).toUpperCase()}`;
}

export function paginationHelper(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function apiResponse(data: any = null, message: string = 'Success', pagination?: any) {
  const response: any = {
    success: true,
    message,
  };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return response;
}

export function apiError(message: string, errors?: any[]) {
  const response: any = {
    success: false,
    error: message,
  };
  if (errors) response.errors = errors;
  return response;
}

export function parsePhoneToE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  return `+${cleaned}`;
}

export function getVanityText(number: string): string | null {
  const keypad: Record<string, string> = {
    '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
    '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
  };
  const digits = number.replace(/\D/g, '').slice(-7);
  let result = '';
  for (const d of digits) {
    if (keypad[d]) result += keypad[d][0];
    else result += d;
  }
  return result.length > 3 ? result : null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
