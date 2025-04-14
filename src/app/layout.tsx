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
    title: 'unique shuffle - discover card patterns',
    description:
      'Shuffle playing cards, discover hidden patterns, and earn achievements. Create your unique card shuffles and share them with friends.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: 'unique shuffle - card pattern discovery game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'unique shuffle - discover card patterns',
    description:
      'Shuffle playing cards, discover hidden patterns, and earn achievements. Create your unique card shuffles and share them with friends.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og`],
    creator: '@unique_shuffle',
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
                <p>
                  &copy; {new Date().getFullYear()}{' '}
                  <a
                    href='https://ianahuja.com'
                    className='hover:underline text-primary/80 hover:text-primary transition-colors'
                  >
                    ian ahuja
                  </a>{' '}
                  all rights reserved.
                </p>
                <p className='mt-2'>
                  💻{' '}
                  <a
                    href='https://github.com/12ian34/unique-shuffle'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline text-primary/80 hover:text-primary transition-colors'
                  >
                    source code
                  </a>
                  🍕{' '}
                  <a
                    href='https://www.buymeacoffee.com/12ian34'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='relative inline-flex items-center py-1 rounded hover:bg-orange-100/20 text-orange-500 hover:text-orange-600 font-medium transition-all hover:scale-105 animate-pulse hover:animate-none'
                  >
                    buy me pizza
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
