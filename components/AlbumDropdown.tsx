"use client";

import React, { useState, useEffect } from 'react';
import { searchAlbums } from '@/lib/actions/album.actions';
import AlbumOption from './AlbumOption';
import Image from 'next/image';

interface Album {
  _id: string;
  title: string;
  cover: string;
}

interface AlbumDropdownProps {
  onChange: (albumId: string | null) => void;
}

const AlbumDropdown: React.FC<AlbumDropdownProps> = ({ onChange }): React.ReactNode => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        console.log('Fetching albums...');
        const albumList = await searchAlbums();
        if (albumList) {
          setAlbums(albumList);
          console.log('Albums fetched successfully:', albumList);
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
        // Handle error appropriately, e.g., display an error message
      }
    };

    fetchAlbums();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const albumId = e.target.value;
    setSelectedAlbum(albumId);
    onChange(albumId === "" ? null : albumId);
  };

  return (
    <div>
      <label htmlFor="album" className="block text-white text-sm font-bold mb-2">Album</label>
      <select
        id="album"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
        value={selectedAlbum || ""}
        onChange={handleChange}
      >
        <option value="">Select an album</option>
        {albums.map((album) => (
          <option key={album._id} value={album._id}>
            {album.title}
          </option>
        ))}
      </select>
      {selectedAlbum && (() => {
        const selected = albums.find(a => a._id === selectedAlbum);
        return selected ? (
          <AlbumOption albumId={selectedAlbum} albumTitle={selected.title} albumCover={selected.cover} />
        ) : null;
      })()} 
    </div>
  );
};


export default AlbumDropdown;
