"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAlbumById, getSongsByAlbum } from '@/lib/actions/album.actions';
import { CreateAlbumParams, CreateSongParams } from '@/types';
import { useParams } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';

function formatDurationFromLyrics(lyrics?: { timestamp: number; text: string }[]): string {
  if (!lyrics || lyrics.length === 0) return '—';
  const maxTs = lyrics.reduce((max, l) => (l.timestamp > max ? l.timestamp : max), 0);
  if (!Number.isFinite(maxTs) || maxTs <= 0) return '—';
  const total = Math.round(maxTs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [album, setAlbum] = useState<CreateAlbumParams | null>(null);
  const [songs, setSongs] = useState<CreateSongParams[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveSong, addSongToQueue, insertNextInQueue } = usePlayer();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [albumData, albumSongs] = await Promise.all([
          getAlbumById(id),
          getSongsByAlbum(id),
        ]);
        setAlbum(albumData || null);
        setSongs(albumSongs || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="relative right-0 top-0 bottom-0 w-full sm:w-10/12 p-6 bg-slate-900">
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : !album ? (
        <p className="text-slate-400">Album not found</p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative h-24 w-24 rounded overflow-hidden">
              <Image src={album.cover} alt={album.title} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-semibold">{album.title}</h1>
              <p className="text-slate-400">{album.artist}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Artist</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {songs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No songs in this album</td>
                  </tr>
                ) : (
                  songs.map((song, idx) => (
                    <tr
                      key={song._id || idx}
                      className="hover:bg-slate-800/40 cursor-pointer group"
                      onClick={() => setActiveSong(song, songs, idx)}
                    >
                      <td className="px-4 py-3 text-sm text-slate-300">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded">
                            <Image
                              src={song.cover}
                              alt={song.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-white text-sm font-semibold">{song.title}</div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                                onClick={(e) => { e.stopPropagation(); addSongToQueue(song); }}
                              >
                                Add
                              </button>
                              <button
                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                                onClick={(e) => { e.stopPropagation(); insertNextInQueue(song); }}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{song.artist}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{formatDurationFromLyrics(song.lyrics)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
