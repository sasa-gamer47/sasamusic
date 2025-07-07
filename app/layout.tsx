import './globals.css'
import Navbar from '@/components/Navbar'
import Player from '@/components/Player'
import { Providers } from '@/app/providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Providers>
        <body className='w-screen h-screen bg-slate-900 flex flex-col'>
          <div className='flex flex-1 overflow-hidden'>
            <Navbar />
            <main className='flex-1 overflow-y-auto'>
              {children}
            </main>
          </div>
          <Player />
        </body>
      </Providers>
    </html>
  )
}