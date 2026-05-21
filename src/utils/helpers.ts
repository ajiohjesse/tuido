const DATE_PATTERN = /^\d{2}-\d{2}-\d{4}( \(\d+\))?$/

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function isAutoNamed(name: string): boolean {
  return DATE_PATTERN.test(name)
}

export function todayDateName(): string {
  return formatDate(new Date().toISOString())
}
