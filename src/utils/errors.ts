export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isSqliteConstraintError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  if (!('code' in err)) return false;
  return (err as { code?: unknown }).code === 'SQLITE_CONSTRAINT';
}
