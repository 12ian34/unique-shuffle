import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    data: [],
    storage: 'local',
    message: 'Achievements are stored in the browser local profile.',
  })
}
