import { describe, it, expect } from 'vitest'
import { formatElapsedMs, formatTimestamp } from '../time-format'

describe('formatElapsedMs', () => {
  it('formats sub-minute times', () => {
    expect(formatElapsedMs(23100)).toBe('23.1s')
  })

  it('formats multi-minute times', () => {
    expect(formatElapsedMs(263100)).toBe('4:23.1')
  })

  it('pads seconds under 10', () => {
    expect(formatElapsedMs(605200)).toBe('10:05.2')
  })

  it('handles negative values', () => {
    expect(formatElapsedMs(-1)).toBe('--:--')
  })

  it('handles zero', () => {
    expect(formatElapsedMs(0)).toBe('0.0s')
  })
})

describe('formatTimestamp', () => {
  it('formats a timestamp with milliseconds', () => {
    const result = formatTimestamp(new Date(2026, 2, 28, 10, 42, 31, 847).getTime())
    expect(result).toBe('10:42:31.847')
  })
})
