"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { FaHome, FaSearch, FaList, FaPlus, FaCog } from 'react-icons/fa';
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
      <div className="bg-slate-900 fixed top-0 left-0 w-full h-16 flex flex-row justify-around items-center border-b-2 border-slate-800 sm:w-2/12 sm:h-full sm:border-r-2 sm:flex-col sm:justify-start z-50">
        <div className="hidden sm:flex items-center justify-between p-4 border-b-2 border-slate-800 w-full">
          <h1 className="text-2xl text-white">SasaMusic</h1>
        </div>
        <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-1/5 sm:w-full sm:justify-start">
          <Link href="/" className="flex flex-col items-center sm:flex-row">
            <FaHome size={24} className="sm:hidden" />
            <span className="hidden sm:inline sm:ml-2">Home</span>
          </Link>
        </div>
        <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-1/5 sm:w-full sm:justify-start" onClick={openSearchModal}>
            <FaSearch size={24} className="sm:hidden" />
            <span className="hidden sm:inline sm:ml-2">Search</span>
        </div>
        <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-1/5 sm:w-full sm:justify-start">
          <Link href="/albums" className="flex flex-col items-center sm:flex-row">
            <FaList size={24} className="sm:hidden" />
            <span className="hidden sm:inline sm:ml-2">Albums</span>
          </Link>
        </div>
        <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-1/5 sm:w-full sm:justify-start">
          <Link href="/songs" className="flex flex-col items-center sm:flex-row">
            <FaList size={24} className="sm:hidden" />
            <span className="hidden sm:inline sm:ml-2">Songs</span>
          </Link>
        </div>
        <div className="text-white text-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-1/5 sm:w-full sm:justify-start">
          <Link href="/songs/create" className="flex flex-col items-center sm:flex-row">
            <FaPlus size={24} className="sm:hidden" />
            <span className="hidden sm:inline sm:ml-2">Create Song</span>
          </Link>
        </div>
        <div className="text-white text-lg hidden sm:flex items-center justify-center cursor-pointer hover:bg-slate-800 p-4 w-full sm:justify-start">
          <FaCog size={24} className="sm:hidden" />
          <span className="hidden sm:inline sm:ml-2">Settings</span>
        </div>
      </div>
      <SearchModal isOpen={isSearchModalOpen} onClose={closeSearchModal} />
    </>
  );
};

export default Navbar;
