"use client"

import React from 'react'
import Image from 'next/image'
import { usePlayer } from '@/context/PlayerContext'

import { CreateSongParams } from '@/types'

const Song = ({ song }: { song: CreateSongParams }) => {
  const { setActiveSong } = usePlayer();

  return (
    <div
      className='w-full h-full flex items-center justify-center cursor-pointer group'
      onClick={() => setActiveSong(song)}
    >
        <Image
          src={song.cover}
          alt={song.title || "Song Cover"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="rounded-lg group-hover:opacity-80 transition-opacity"
        />
        <p className='absolute bottom-3 w-full text-center text-white text-lg font-semibold'>{song.title}</p>
    </div>
  )
}

export default Song
