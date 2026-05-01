function requirePart(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }

  return value
}

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host = process.env.NEON_POOLER_HOST || process.env.NEON_HOST
  const database = process.env.NEON_DATABASE
  const role = process.env.NEON_ROLE
  const password = process.env.NEON_PASSWORD

  if (!host && !database && !role && !password) {
    return undefined
  }

  return `postgresql://${encodeURIComponent(requirePart('NEON_ROLE', role))}:${encodeURIComponent(
    requirePart('NEON_PASSWORD', password)
  )}@${requirePart('NEON_HOST or NEON_POOLER_HOST', host)}/${encodeURIComponent(
    requirePart('NEON_DATABASE', database)
  )}?sslmode=require`
}

