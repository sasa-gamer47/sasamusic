"use client";

import React from 'react';
import Image from 'next/image';

interface AlbumOptionProps {
  albumId?: string;
  albumTitle: string;
  albumCover: string;
}

const AlbumOption: React.FC<AlbumOptionProps> = ({ albumId, albumTitle, albumCover }) => {
  return (
    <div className="flex items-center w-full p-2 mt-2 hover:bg-slate-800 cursor-pointer">
      <Image
        src={albumCover}
        alt={`${albumTitle} cover`}
        width={40}
        height={40}
        className="rounded-md"
      />
      <span className="ml-4 text-white">{albumTitle}</span>
    </div>
  );
};

export default AlbumOption;
