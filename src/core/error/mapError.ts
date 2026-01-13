import { TempoError } from './TempoError';

export function mapError(error: unknown): TempoError {
  if (error instanceof TempoError) {
    return error;
  }

  if (error instanceof Error) {
    return new TempoError(
      'UNKNOWN',
      error.message || 'Unknown error',
      error
    );
  }

  return new TempoError(
    'UNKNOWN',
    'Non-error thrown',
    error
  );
}
