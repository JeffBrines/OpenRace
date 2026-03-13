import { describe, it, expect } from 'vitest'
import { generateToken, generateShareCode } from '../tokens'

describe('generateToken', () => {
  it('generates tokens of specified length', () => {
    expect(generateToken(24)).toHaveLength(24)
  })

  it('generates unique tokens', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })

  it('only contains hex characters', () => {
    expect(generateToken(24)).toMatch(/^[0-9a-f]{24}$/)
  })

  it('respects custom length', () => {
    expect(generateToken(12)).toHaveLength(12)
    expect(generateToken(32)).toHaveLength(32)
  })
})

describe('generateShareCode', () => {
  it('creates code from race name', () => {
    const code = generateShareCode('Purgatory Enduro 2026')
    expect(code).toMatch(/^PURG[A-Z0-9]{3}$/)
  })

  it('handles short names', () => {
    const code = generateShareCode('DH')
    expect(code).toMatch(/^DH[A-Z0-9]{3}$/)
  })

  it('strips special characters from prefix', () => {
    const code = generateShareCode('Mt. Bike Race!')
    expect(code).toMatch(/^MTBI[A-Z0-9]{3}$/)
  })
})
