export function generateToken(length = 24): string {
  const array = new Uint8Array(Math.ceil(length * 3 / 4))
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export function generateShareCode(raceName: string): string {
  const prefix = raceName
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${prefix}${suffix}`
}
