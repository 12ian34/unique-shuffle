import { NextResponse } from 'next/server'

// Get all friends or friend requests
export async function GET() {
  return NextResponse.json(
    {
      data: [],
      storage: 'local',
      message: 'Friends were removed with account auth.',
    },
    { status: 410 }
  )
}

// Send a friend request
export async function POST() {
  return NextResponse.json(
    {
      storage: 'local',
      message: 'Friends were removed with account auth.',
    },
    { status: 410 }
  )
}

// Update a friend request (accept/reject)
export async function PUT() {
  return NextResponse.json(
    {
      storage: 'local',
      message: 'Friends were removed with account auth.',
    },
    { status: 410 }
  )
}
