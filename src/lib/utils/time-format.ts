export function formatElapsedMs(ms: number): string {
  if (ms < 0) return '--:--'

  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds.toFixed(1)}s`
  }

  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
}

export function formatTimestamp(ms: number): string {
  const date = new Date(ms)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const secs = date.getSeconds().toString().padStart(2, '0')
  const millis = date.getMilliseconds().toString().padStart(3, '0')
  return `${hours}:${minutes}:${secs}.${millis}`
}
