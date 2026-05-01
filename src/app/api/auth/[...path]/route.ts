import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { message: 'Authentication has been removed. Profiles are stored locally in the browser.' },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    { message: 'Authentication has been removed. Profiles are stored locally in the browser.' },
    { status: 410 }
  )
}
