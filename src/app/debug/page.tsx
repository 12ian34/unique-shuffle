'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import supabase from '@/lib/supabase'

export default function DebugPage() {
  const { user, session, isLoading } = useAuth()
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null)

  const checkSupabase = async () => {
    try {
      // Test Supabase connection
      const response = await fetch('/api/debug', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Check for direct connection
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact' })

      setSupabaseInfo({
        apiResponse: await response.json(),
        directData,
        directError: directError?.message,
      })
    } catch (error) {
      setSupabaseInfo({ error: (error as Error).message })
    }
  }

  return (
    <div className='space-y-6 py-8'>
      <h1 className='text-2xl font-bold'>Auth Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Auth State</CardTitle>
          <CardDescription>Current authentication state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <p>
                <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Logged in:</strong> {user ? 'Yes' : 'No'}
              </p>
            </div>

            {user && (
              <div>
                <h3 className='font-medium'>User Info:</h3>
                <pre className='bg-muted p-2 rounded-md overflow-auto text-xs mt-2 max-h-40'>
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}

            {session && (
              <div>
                <h3 className='font-medium'>Session Info:</h3>
                <pre className='bg-muted p-2 rounded-md overflow-auto text-xs mt-2 max-h-40'>
                  {JSON.stringify(
                    {
                      ...session,
                      access_token: session.access_token ? '[REDACTED]' : null,
                      refresh_token: session.refresh_token ? '[REDACTED]' : null,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            <Button onClick={checkSupabase}>Test Supabase Connection</Button>

            {supabaseInfo && (
              <div>
                <h3 className='font-medium'>Supabase Connection Test:</h3>
                <pre className='bg-muted p-2 rounded-md overflow-auto text-xs mt-2 max-h-60'>
                  {JSON.stringify(supabaseInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
