import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabaseAdmin = createSupabaseAdmin()

  try {
    const { count, error } = await supabaseAdmin
      .from('shuffles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting global shuffles:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Unexpected error counting global shuffles:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
