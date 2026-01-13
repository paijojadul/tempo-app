export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export type AsyncState<T> = {
  data: T | null
  status: AsyncStatus
  error?: string
}

export function createAsyncState<T>(): AsyncState<T> {
  return {
    data: null,
    status: 'idle',
    error: undefined,
  }
}
