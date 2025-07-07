"use client"

import Image from 'next/image'
import React from 'react'
import Link from 'next/link';

const Navbar = () => {
  return (
    <div className="w-2/12 bg-slate-900 h-full border-r-2 border-slate-800 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b-2 border-slate-800">
        <h1 className="text-2xl text-white">SasaMusic</h1>
        {/* <Image
          src={logo}
          alt="Logo"
          width={40}
          height={40}
          className="rounded-full"
        /> */}
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        <Link href="/">Home</Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        <Link href="/search">Search</Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        <Link href="/albums">Albums</Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        <Link href="/artists">Artists</Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        <Link href="/songs/create">Create Song</Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-4 transition-colors">
        Settings
      </div>
    </div>
  );
};

export default Navbar
