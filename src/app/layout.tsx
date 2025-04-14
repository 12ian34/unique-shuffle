import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/ui/navbar'
import { GlobalShuffleCounter } from '@/components/global-shuffle-counter'
import { Providers } from '@/components/providers'
import { UserStatsProvider } from '@/components/user-stats-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unique Shuffle',
  description: 'Shuffle playing cards, discover patterns, and earn achievements',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <Providers>
          <div className='min-h-screen flex flex-col bg-background overflow-x-hidden'>
            <UserStatsProvider>
              <Navbar />
            </UserStatsProvider>
            <main className='flex-1 container max-w-5xl px-4 py-8 mx-auto overflow-x-hidden'>
              {children}
            </main>
            <footer className='border-t py-6 bg-muted/20 w-full'>
              <div className='container max-w-5xl px-4 mx-auto text-center text-sm text-muted-foreground'>
                <p>&copy; {new Date().getFullYear()} Ian Ahuja. all rights reserved.</p>
                <p className='mt-2'>
                  <a
                    href='https://github.com/12ian34/unique-shuffle'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline text-primary/80 hover:text-primary transition-colors'
                  >
                    source code
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
