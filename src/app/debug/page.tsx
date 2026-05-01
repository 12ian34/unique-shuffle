'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugPage() {
  const { session, isLoading } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkBackend = async () => {
    try {
      const response = await fetch('/api/debug', { cache: 'no-store' })
      setDebugInfo(await response.json())
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
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}

            <Button onClick={checkBackend}>Test Neon Connection</Button>

            {debugInfo && (
              <div>
                <h3 className='font-medium'>Neon Connection Test:</h3>
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
