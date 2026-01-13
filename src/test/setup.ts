// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/* ===============================
   GLOBAL DECLARATION (NO ANY)
=============================== */
declare global {
  // React testing environment flag
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean

  interface Window {
    matchMedia: (query: string) => MediaQueryList
  }
}

/* ===============================
   TEST CLEANUP
=============================== */
afterEach(() => {
  cleanup()
})

/* ===============================
   GLOBAL FLAGS
=============================== */
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/* ===============================
   MOCK ResizeObserver
=============================== */
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/* ===============================
   MOCK matchMedia
=============================== */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but sometimes used
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

console.log('✅ Test setup loaded')
