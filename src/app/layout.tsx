import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavbarWithStats } from '@/components/ui/navbar'
import { PostHogProvider } from '@/components/PostHogProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unique Shuffle',
  description: 'Every shuffle is unique - track your card shuffling statistics!',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className='dark'>
      <body className={`${inter.className} bg-[rgb(10,15,30)] text-slate-100`}>
        <PostHogProvider>
          <NavbarWithStats />
          <main>{children}</main>
        </PostHogProvider>
      </body>
    </html>
  )
}
