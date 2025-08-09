import React from 'react'
import Image from 'next/image'

import { CreateAlbumParams } from '@/types' 

// This component is used to display an album cover and title
const Album = ({ cover, title }: {cover: string, title: string}) => {
  return (
    <div className='w-full pb-[100%] relative'> {/* This creates a square container */}
        <Image
          src={cover}
          alt={title || "Album Cover"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="rounded-lg object-cover"
        />
        <p className='absolute bottom-3 w-full text-center text-white text-lg font-semibold'>{title}</p>
    </div>
  )
}

export default Album
