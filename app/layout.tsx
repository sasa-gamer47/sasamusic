import './globals.css'
import Navbar from '@/components/Navbar'
import Player from '@/components/Player'
import { Providers } from '@/app/providers'
import { Toaster } from '@/components/ui/sonner'
import InstallPWA from '@/components/InstallPWA'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className='w-screen h-screen bg-slate-900 flex flex-col'>
        <Providers>
          <div className='flex flex-1 overflow-hidden'>
            <Navbar />
            <main className='flex-1 overflow-y-auto pt-16 pb-20 sm:ml-[16.666667%]'>
              {children}
            </main>
          </div>
          <Player />
        </Providers>
        <div className="fixed bottom-4 right-4 z-50">
          <InstallPWA />
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
