"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAllSongsWithAlbum } from '@/lib/actions/song.actions';
import { CreateSongParams } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { FaPlus } from 'react-icons/fa';

type SongWithAlbum = CreateSongParams & {
  album?: { _id: string; title: string; cover: string } | string | null;
};

function formatDurationFromLyrics(lyrics?: { timestamp: number; text: string }[]): string {
  if (!lyrics || lyrics.length === 0) return '—';
  const maxTs = lyrics.reduce((max, l) => (l.timestamp > max ? l.timestamp : max), 0);
  if (!Number.isFinite(maxTs) || maxTs <= 0) return '—';
  const total = Math.round(maxTs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<SongWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveSong, insertNextInQueue, addSongToQueue } = usePlayer();
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album' | 'createdAt'>('createdAt');

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAllSongsWithAlbum();
        setSongs(all || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="relative right-0 top-0 bottom-0 w-full sm:w-10/12 p-6 bg-slate-900">
      <h1 className="text-white text-3xl font-semibold mb-4">All Songs</h1>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-800/60">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-sm font-semibold text-slate-300">#</th>
              <th className="w-2/5 px-4 py-3 text-left text-sm font-semibold text-slate-300 cursor-pointer" onClick={() => setSortBy('title')}>Title</th>
              <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-slate-300 cursor-pointer" onClick={() => setSortBy('album')}>Album</th>
              <th className="w-1/5 px-4 py-3 text-left text-sm font-semibold text-slate-300 cursor-pointer" onClick={() => setSortBy('artist')}>Artist</th>
              <th className="w-1/10 px-4 py-3 text-left text-sm font-semibold text-slate-300">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td>
              </tr>
            ) : songs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No songs found</td>
              </tr>
            ) : (
              [...songs].sort((a, b) => {
                if (sortBy === 'title') return a.title.localeCompare(b.title);
                if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
                if (sortBy === 'album') {
                  const at = typeof a.album === 'object' && a.album ? (a.album as any).title : '';
                  const bt = typeof b.album === 'object' && b.album ? (b.album as any).title : '';
                  return at.localeCompare(bt);
                }
                // createdAt fallback: newer first, unknown last
                const ad = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
                const bd = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
                return bd - ad;
              }).map((song, idx) => {
                const albumObj = (typeof song.album === 'object' && song.album !== null)
                  ? song.album as { _id: string; title: string; cover: string }
                  : null;

                return (
                  <tr
                    key={song._id || idx}
                    className="hover:bg-slate-800/40 cursor-pointer group"
                    onClick={() => setActiveSong(song as CreateSongParams, songs as CreateSongParams[], idx)}
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
                        <div className="flex flex-col">
                          <div className="text-white text-sm font-semibold">{song.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              title="Add to queue"
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                              onClick={(e) => { e.stopPropagation(); addSongToQueue(song as CreateSongParams); }}
                            >
                              Add
                            </button>
                            <button
                              title="Play next"
                              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                              onClick={(e) => { e.stopPropagation(); insertNextInQueue(song as CreateSongParams); }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{albumObj?.title || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{song.artist}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatDurationFromLyrics(song.lyrics)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
