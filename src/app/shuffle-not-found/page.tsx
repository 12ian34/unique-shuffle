import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HomeButton } from '@/components/navigation-buttons'

export default function ShuffleNotFoundPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Shuffle Not Found</h1>
        <p className='mt-4 text-muted-foreground'>
          We couldn&apos;t find this shuffle. It may have been deleted or never existed.
        </p>
        <div className='mt-8 flex justify-center gap-4'>
          <HomeButton />
          <Button variant='outline' asChild>
            <Link href='/profile'>Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
