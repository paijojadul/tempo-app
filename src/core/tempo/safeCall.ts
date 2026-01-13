import { mapError } from '../error/mapError';
import { TempoError } from '../error/TempoError';

export async function safeCall<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const mapped: TempoError = mapError(err);
    throw mapped;
  }
}
