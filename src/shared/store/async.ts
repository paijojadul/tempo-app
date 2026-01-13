export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error?: string
}

export const createAsyncState = <T>(): AsyncState<T> => ({
  status: 'idle',
  data: null,
})
