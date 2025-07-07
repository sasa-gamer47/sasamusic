"use client"

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaHome, FaSearch, FaList, FaMicrophone, FaPlus, FaCog } from 'react-icons/fa';
import SearchModal from './SearchModal';

const Navbar = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const openSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  return (
    <>
    <div className="bg-slate-900 fixed top-0 left-0 w-full h-16 flex flex-row justify-between border-b-2 border-slate-800 sm:w-2/12 sm:h-full sm:border-r-2 sm:border-b-0 sm:flex-col">
      <div className="flex items-center justify-between p-4 border-b-2 border-slate-800 md:border-b-0">
        <h1 className="text-2xl text-white">SasaMusic</h1>
        {/* <Image
          src={logo}
          alt="Logo"
          width={40}
          height={40}
          className="rounded-full"
        /> */}
      </div>
      <div className=" text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors md:p-2 md:py-4">
        <Link href="/">
          <FaHome size={24} className="md:hidden" />
          <span className="hidden md:inline">Home</span>
        </Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors" onClick={openSearchModal}>
          <FaSearch size={24} className="md:hidden" />
          <span className="hidden md:inline">Search</span>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors">
        <Link href="/albums">
          <FaList size={24} className="md:hidden" />
          <span className="hidden md:inline">Albums</span>
        </Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors">
        <Link href="/artists">
          <FaMicrophone size={24} className="md:hidden" />
          <span className="hidden md:inline">Artists</span>
        </Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors">
        <Link href="/songs/create">
          <FaPlus size={24} className="md:hidden" />
          <span className="hidden md:inline">Create Song</span>
        </Link>
      </div>
      <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-2 py-0 transition-colors">
        <FaCog size={24} className="md:hidden" />
        <span className="hidden md:inline">Settings</span>
      </div>
    </div>
    <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
    </>
  );
};

export default Navbar
