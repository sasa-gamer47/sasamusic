"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { searchAlbums } from '@/lib/actions/album.actions';
import { CreateAlbumParams } from '@/types';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<CreateAlbumParams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await searchAlbums({});
        setAlbums(list || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="relative right-0 top-0 bottom-0 w-full sm:w-10/12 p-6 bg-slate-900">
      <h1 className="text-white text-3xl font-semibold mb-4">Albums</h1>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : albums.length === 0 ? (
        <p className="text-slate-400">No albums found</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {albums.map((album, idx) => (
            <Link key={album._id || idx} href={`/albums/${album._id}`} className="block group">
              <div className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors">
                <div className="relative w-full aspect-square rounded overflow-hidden">
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-full px-4 py-2 text-sm">Play</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-white text-sm font-semibold truncate">{album.title}</div>
                  <div className="text-slate-400 text-xs truncate">{album.artist}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
