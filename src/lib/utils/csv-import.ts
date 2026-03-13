import { createRiderSchema, type CreateRiderInput } from '@/lib/validators/rider'

export interface CsvParseResult {
  riders: CreateRiderInput[]
  errors: string[]
}

/**
 * Parses CSV text into rider objects.
 * First row is treated as headers. Remaining rows are data.
 * Expected columns: name, bib (optional), category, gender, age (optional)
 * Trims all values, skips empty rows.
 */
export function parseRiderCsv(csv: string): CsvParseResult {
  const lines = csv.split('\n')

  if (lines.length < 2) {
    return { riders: [], errors: ['CSV must have a header row and at least one data row'] }
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const riders: CreateRiderInput[] = []
  const errors: string[] = []

  const dataLines = lines.slice(1)

  dataLines.forEach((line, lineIndex) => {
    const rowNumber = lineIndex + 2 // +2 because 1-indexed and header is row 1

    const trimmedLine = line.trim()
    if (trimmedLine === '') {
      return
    }

    const values = line.split(',').map((v) => v.trim())

    const rawRow: Record<string, string | undefined> = {}
    headers.forEach((header, i) => {
      rawRow[header] = values[i] ?? undefined
    })

    const rawRider = {
      name: rawRow['name'] || undefined,
      bib: rawRow['bib'] || undefined,
      category: rawRow['category'] || undefined,
      gender: rawRow['gender'] || undefined,
      age: rawRow['age'] && rawRow['age'] !== '' ? Number(rawRow['age']) : undefined,
    }

    const result = createRiderSchema.safeParse(rawRider)

    if (!result.success) {
      const fieldMessages = result.error.issues.map((issue) => issue.message).join(', ')
      errors.push(`Row ${rowNumber}: ${fieldMessages}`)
      return
    }

    riders.push(result.data)
  })

  return { riders, errors }
}
