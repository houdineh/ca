import type { Metadata, Viewport } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const syne = Syne({ 
  subsets: ["latin"],
  variable: '--font-syne',
  display: 'swap'
})

const dmMono = DM_Mono({ 
  weight: ['400', '500'],
  subsets: ["latin"],
  variable: '--font-dm-mono',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'chrome | Creative Developer',
  description: 'Full-stack developer crafting immersive digital experiences. From games to web apps, I build things that matter.',
  keywords: ['developer', 'portfolio', 'game development', 'web development', 'unity', 'react', 'nextjs'],
  authors: [{ name: 'chrome' }],
  creator: 'chrome',
  openGraph: {
    title: 'chrome | Creative Developer',
    description: 'Full-stack developer crafting immersive digital experiences.',
    url: 'https://chromes.online',
    siteName: 'chrome',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'chrome | Creative Developer',
    description: 'Full-stack developer crafting immersive digital experiences.',
  },
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable} bg-[#0D0D0D]`}>
      <body className="font-mono antialiased bg-[#0D0D0D]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
