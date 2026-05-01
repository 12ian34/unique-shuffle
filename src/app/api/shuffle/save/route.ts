import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    data: [],
    storage: 'local',
    message: 'Saved shuffles are stored in browser localStorage.',
  })
}

// Save or unsave a shuffle
export async function POST() {
  return NextResponse.json(
    {
      storage: 'local',
      message: 'Save or remove shuffles in the browser local profile.',
    },
    { status: 410 }
  )
}
