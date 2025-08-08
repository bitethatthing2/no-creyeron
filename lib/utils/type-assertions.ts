// Type assertion helpers for Supabase type mismatches
export function assertNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Value cannot be null or undefined');
  }
  return value;
}

export function safeStringOrNull(value: string | null | undefined): string | undefined {
  return value === null ? undefined : value;
}

export function safeJsonValue(value: any): any {
  return value || {};
}

export function assertWolfpackMember(data: any): any {
  return {
    ...data,
    last_active: data.last_active || new Date().toISOString()
  };
}
