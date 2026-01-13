import { safeCall } from './safeCall'

/**
 * Minimal, safe typing untuk import.meta.env
 * (menghindari `any` tanpa mengubah behavior runtime)
 */
type ImportMetaEnvLike = {
  env?: {
    VITE_TEMPO_API_BASE_URL?: string
  }
}

type FetchOptions = globalThis.RequestInit

export type TempoErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

export class TempoError extends Error {
  code: TempoErrorCode
  status?: number

  constructor(message: string, code: TempoErrorCode, status?: number) {
    super(message)
    this.name = 'TempoError'
    this.code = code
    this.status = status ?? 0
  }
}

const BASE_URL =
  (import.meta as ImportMetaEnvLike)?.env?.VITE_TEMPO_API_BASE_URL ??
  process.env.VITE_TEMPO_API_BASE_URL ??
  ''

const DEFAULT_TIMEOUT = 10_000

function assertBaseUrl() {
  if (!BASE_URL) {
    throw new TempoError('Tempo API base URL is not configured', 'NETWORK_ERROR')
  }
}

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TempoError('Request timeout', 'TIMEOUT'))
    }, ms)
  })
}

function normalizeHttpError(status: number): TempoError {
  if (status === 401) return new TempoError('Unauthorized', 'UNAUTHORIZED', status)
  if (status === 403) return new TempoError('Forbidden', 'FORBIDDEN', status)
  if (status === 404) return new TempoError('Not found', 'NOT_FOUND', status)
  if (status >= 500) return new TempoError('Server error', 'SERVER_ERROR', status)

  return new TempoError('Request failed', 'UNKNOWN_ERROR', status)
}

function normalizeUnknownError(err: unknown): never {
  if (err instanceof TempoError) throw err
  if (err instanceof Error) {
    throw new TempoError(err.message, 'UNKNOWN_ERROR')
  }
  throw new TempoError('Unknown error', 'UNKNOWN_ERROR')
}

export function tempoRequest<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  return safeCall(async () => {
    assertBaseUrl()

    const response = await Promise.race([
      fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      }),
      timeoutPromise(DEFAULT_TIMEOUT),
    ])

    if (!(response instanceof Response)) {
      throw response
    }

    if (!response.ok) {
      throw normalizeHttpError(response.status)
    }

    return (await response.json()) as T
  }).catch(normalizeUnknownError)
}
