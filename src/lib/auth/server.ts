import { createNeonAuth } from '@neondatabase/auth/next/server'
import { getNeonAuthBaseUrl } from '@/lib/env'

export const auth = createNeonAuth({
  baseUrl: getNeonAuthBaseUrl() || 'https://missing.neon-auth.local',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'missing-neon-auth-cookie-secret-for-builds',
  },
})
