"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchSongs } from '@/lib/actions/song.actions';
import { searchAlbums } from '@/lib/actions/album.actions';
import { CreateSongParams, CreateAlbumParams } from '@/types';
import Song from '@/components/Song';
import Album from '@/components/Album';

const SearchResultsClient = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';

  const [songs, setSongs] = useState<CreateSongParams[]>([]);
  const [albums, setAlbums] = useState<CreateAlbumParams[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [songResults, albumResults] = await Promise.all([
        searchSongs({ query }),
        searchAlbums({ query }),
      ]);

      setSongs(songResults || []);
      setAlbums(albumResults || []);
    };

    fetchData();
  }, [query]);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900">
      <h1 className="text-white text-3xl font-semibold">Search Results for "{query}"</h1>

      <h2 className="text-white text-2xl font-semibold mt-4">Songs</h2>
      <div className="w-full h-3/12 py-4 flex items-center justify-start gap-4 overflow-x-auto">
        {songs.map((song, index) => (
          <div key={song._id || index} className=" h-full aspect-square flex items-center justify-center rounded-lg overflow-hidden relative shadow-lg">
            <Song song={song} />
          </div>
        ))}
      </div>
      

      <h2 className="text-white text-2xl font-semibold mt-4">Albums</h2>
      <div className="w-full h-3/12 py-4 flex items-center justify-start gap-4 overflow-x-auto">
        {albums.map((album, index) => (
          <div key={album._id || index} className=" h-full aspect-square flex items-center justify-center rounded-lg overflow-hidden relative shadow-lg">
            <Album cover={album.cover} title={album.title} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsClient;
