const DEVICE_ID_KEY = 'openrace_device_id'

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getDeviceId must be called in browser')
  }

  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}
