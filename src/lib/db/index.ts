import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { getDatabaseUrl } from '@/lib/env'

const connectionString =
  getDatabaseUrl() || 'postgresql://missing:missing@localhost:5432/missing'
const sql = neon(connectionString)

export const db = drizzle(sql, { schema })

export type DbClient = typeof db
