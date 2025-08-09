import './globals.css'
import Navbar from '@/components/Navbar'
import Player from '@/components/Player'
import { Providers } from '@/app/providers'
import { Toaster } from '@/components/ui/sonner'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className='w-screen h-screen bg-slate-900 flex flex-col'>
        <Providers>
          <div className='flex flex-1 overflow-hidden'>
            <Navbar />
            <main className='flex-1 overflow-y-auto pt-16 sm:pt-0 sm:ml-[16.666667%]'>
              {children}
            </main>
          </div>
          <Player />
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
