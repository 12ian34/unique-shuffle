import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/ui/navbar'
import { GlobalShuffleCounter } from '@/components/global-shuffle-counter'
import { Providers } from '@/components/providers'
import { UserStatsProvider } from '@/components/user-stats-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'unique shuffle',
  description: 'shuffle playing cards, discover patterns, and earn achievements',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://unique-shuffle.netlify.app'),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://unique-shuffle.netlify.app',
    siteName: 'unique shuffle',
    title: 'unique shuffle',
    description: 'shuffle playing cards, discover patterns, and earn achievements',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: 'unique shuffle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'unique shuffle',
    description: 'shuffle playing cards, discover patterns, and earn achievements',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og`],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <Providers>
          <div className='min-h-screen flex flex-col bg-background overflow-x-hidden overscroll-none'>
            <UserStatsProvider>
              <Navbar />
            </UserStatsProvider>
            <main className='flex-1 container max-w-5xl px-4 py-8 mx-auto overflow-x-hidden'>
              {children}
            </main>
            <footer className='border-t py-6 bg-muted/20 w-full'>
              <div className='container max-w-5xl px-4 mx-auto text-center text-sm text-muted-foreground'>
                <p>&copy; {new Date().getFullYear()} ian ahuja. all rights reserved.</p>
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
