import { describe, it, expect } from 'vitest'
import { parseRiderCsv } from '../csv-import'

describe('parseRiderCsv', () => {
  it('parses valid CSV with all fields', () => {
    const csv = 'name,bib,category,gender,age\nJeff,12,Expert Men,male,35'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(1)
    expect(result.riders[0]).toEqual({
      name: 'Jeff', bib: '12', category: 'Expert Men', gender: 'male', age: 35
    })
    expect(result.errors).toHaveLength(0)
  })

  it('handles missing optional fields', () => {
    const csv = 'name,category,gender\nBob,Sport Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders[0].bib).toBeUndefined()
    expect(result.riders[0].age).toBeUndefined()
  })

  it('returns errors for invalid rows', () => {
    const csv = 'name,category,gender\n,,\nJeff,Expert Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
  })

  it('detects headers and trims whitespace', () => {
    const csv = '  name , category , gender \n Jeff , Sport Men , male '
    const result = parseRiderCsv(csv)
    expect(result.riders[0].name).toBe('Jeff')
  })

  it('skips empty rows', () => {
    const csv = 'name,category,gender\nJeff,Expert Men,male\n\n\nBob,Sport Men,male'
    const result = parseRiderCsv(csv)
    expect(result.riders).toHaveLength(2)
  })
})
