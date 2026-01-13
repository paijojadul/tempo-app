export type TempoErrorCode =
  | 'UNKNOWN'
  | 'NETWORK'
  | 'RPC'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'VALIDATION';

export class TempoError extends Error {
  readonly code: TempoErrorCode;
  readonly cause?: unknown;

  constructor(
    code: TempoErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'TempoError';
    this.code = code;
    this.cause = cause;
  }
}
