'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugPage() {
  const { session, supabase, isLoading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkSupabase = async () => {
    if (!session?.user) {
      setDebugInfo('User not authenticated.')
      return
    }

    try {
      // Example: Fetch user data using the client from context
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) throw userError

      // Add any other debug fetching logic here...
      const combinedInfo = {
        session,
        userData,
        // Add more debug data as needed
      }

      setDebugInfo(combinedInfo)
    } catch (error) {
      setDebugInfo({ error: (error as Error).message })
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
                <strong>Logged in:</strong> {session ? 'Yes' : 'No'}
              </p>
            </div>

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

            {debugInfo && (
              <div>
                <h3 className='font-medium'>Supabase Connection Test:</h3>
                <pre className='bg-muted p-2 rounded-md overflow-auto text-xs mt-2 max-h-60'>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
