import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { globalStats } from '@/lib/db/schema'
import { ensurePublicDataTables } from '@/lib/db/public-schema'

export async function GET() {
  await ensurePublicDataTables()

  const [globalCount] = await db.select({ count: globalStats.count }).from(globalStats).limit(1)

  return NextResponse.json({
    data: [],
    storage: 'local',
    globalCount: Number(globalCount?.count || 0),
    message: 'Per-user leaderboards were removed with accounts.',
  })
}
