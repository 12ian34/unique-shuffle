import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HomeButton } from '@/components/navigation-buttons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ShuffleNotFoundPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Shuffle Not Found</h1>
        <p className='mt-4 text-muted-foreground'>
          We couldn&apos;t find this shuffle. It may have been deleted or never existed.
        </p>
      </div>

      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-amber-500' />
            <CardTitle>What might have happened?</CardTitle>
          </div>
          <CardDescription>Here are some reasons why you might be seeing this page</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <ul className='list-disc pl-5 space-y-2'>
            <li>The shuffle ID or share code is incorrect or mistyped</li>
            <li>The shuffle was deleted from the database</li>
            <li>The shuffle was never saved (temporary shuffles aren&apos;t accessible by ID)</li>
            <li>The shuffle belongs to another user and isn&apos;t shared publicly</li>
          </ul>

          <div className='pt-4'>
            <h3 className='font-semibold text-lg mb-2'>What you can do:</h3>
            <ul className='list-disc pl-5 space-y-2'>
              <li>Check if the URL is correct</li>
              <li>Try accessing the shuffle from your profile if it&apos;s yours</li>
              <li>Ask the person who shared it to verify the link</li>
              <li>Create a new shuffle</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className='mt-8 flex justify-center gap-4'>
        <HomeButton />
        <Button variant='outline' asChild>
          <Link href='/profile'>Go to Profile</Link>
        </Button>
        <Button
          variant='default'
          className='bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white'
          asChild
        >
          <Link href='/'>Create New Shuffle</Link>
        </Button>
      </div>
    </div>
  )
}
