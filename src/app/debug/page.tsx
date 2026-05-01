'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
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
      <h1 className='text-2xl font-bold'>Storage Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Local-First State</CardTitle>
          <CardDescription>Current storage model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <p>
                <strong>Storage:</strong> browser localStorage profile
              </p>
              <p>
                <strong>Accounts:</strong> removed
              </p>
            </div>

            <Button onClick={checkBackend}>Test Public Backend</Button>

            {debugInfo && (
              <div>
                <h3 className='font-medium'>Public Backend Test:</h3>
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
