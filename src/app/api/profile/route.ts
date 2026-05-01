import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    storage: 'local',
    message: 'Profiles are stored in browser localStorage and can be exported from /profile.',
  })
}

export async function PATCH() {
  return NextResponse.json(
    {
      storage: 'local',
      message: 'Update the local profile through the /profile page.',
    },
    { status: 410 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    {
      storage: 'local',
      message: 'Reset the local profile through the /profile page.',
    },
    { status: 410 }
  )
}
