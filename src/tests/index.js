const assert = require('node:assert/strict')
const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))

assert.ok(packageJson.dependencies['@neondatabase/auth'], 'Neon Auth dependency is installed')
assert.ok(packageJson.dependencies['@neondatabase/serverless'], 'Neon serverless dependency is installed')
assert.ok(packageJson.dependencies['drizzle-orm'], 'Drizzle dependency is installed')
assert.ok(!packageJson.dependencies['@supabase/supabase-js'], 'Supabase client dependency is removed')

const envExample = read('.env.example')
assert.match(envExample, /DATABASE_URL=/, 'DATABASE_URL is documented')
assert.match(envExample, /NEON_AUTH_BASE_URL=/, 'NEON_AUTH_BASE_URL is documented')
assert.doesNotMatch(envExample, /SUPABASE/, 'Supabase env vars are no longer documented')

assert.ok(existsSync(join(root, 'drizzle')), 'Drizzle migration folder exists')
assert.ok(existsSync(join(root, 'src/lib/auth/server.ts')), 'Neon Auth server module exists')
assert.ok(existsSync(join(root, 'src/lib/db/schema.ts')), 'Drizzle schema module exists')

console.log('Smoke checks passed')
