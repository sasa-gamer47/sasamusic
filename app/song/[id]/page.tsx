"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSongById, updateSong, searchSongs, deleteSong } from '@/lib/actions/song.actions';
import { CreateSongParams, LyricLine } from '@/types';
import { getAlbumById, getSongsByAlbum } from '@/lib/actions/album.actions';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import { toast } from 'sonner';
import SongControls from '@/components/SongControls';

function formatDurationFromLyrics(lyrics?: { timestamp: number; text: string }[]): string {
  if (!lyrics || lyrics.length === 0) return '—';
  const maxTs = lyrics.reduce((max, l) => (l.timestamp > max ? l.timestamp : max), 0);
  if (!Number.isFinite(maxTs) || maxTs <= 0) return '—';
  const total = Math.round(maxTs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SongDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const [song, setSong] = React.useState<CreateSongParams | null>(null);
  const [album, setAlbum] = React.useState<any>(null);
  const [albumSongs, setAlbumSongs] = React.useState<CreateSongParams[]>([]);
  const [moreByArtist, setMoreByArtist] = React.useState<CreateSongParams[]>([]);
  const { currentTime, setActiveSong, removeSongFromRecentlyPlayed } = usePlayer(); // Added removeSongFromRecentlyPlayed
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState('');
  const [editedArtist, setEditedArtist] = React.useState('');
  const [editedLyrics, setEditedLyrics] = React.useState('');

  React.useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;
      try {
        const songData = await getSongById(songId);
        if (songData) {
          setSong(songData);
          setEditedTitle(songData.title);
          setEditedArtist(songData.artist);
          setEditedLyrics(songData.lyrics ? songData.lyrics.map((l: LyricLine) => l.text).join('\n') : '');

          const albumObj = typeof songData.album === 'object' && songData.album !== null ? songData.album : null;
          if (albumObj) {
            setAlbum(albumObj);
            const songsInAlbum = await getSongsByAlbum(albumObj._id);
            setAlbumSongs(songsInAlbum || []);
          } else if (songData.album) {
            const albumData = await getAlbumById(songData.album);
            setAlbum(albumData);
            const songsInAlbum = await getSongsByAlbum(songData.album);
            setAlbumSongs(songsInAlbum || []);
          }

          const more = await searchSongs({ artist: songData.artist });
          setMoreByArtist((more || []).filter((s: CreateSongParams) => s._id !== songData._id).slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching song:', error);
      }
    };
    fetchSong();
  }, [songId]);

  const getHighlightedLyricIndex = (lyrics: LyricLine[], time: number) => {
    let highlightedIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (time >= lyrics[i].timestamp) {
        highlightedIndex = i;
      } else {
        break;
      }
    }
    return highlightedIndex;
  };

  const highlightedLyricIndex = song?.lyrics ? getHighlightedLyricIndex(song.lyrics, currentTime) : -1;

  const handleUpdate = async () => {
    const password = prompt('Enter password to update song');
    if (password && song) {
      try {
        await updateSong(song._id!, { title: editedTitle, artist: editedArtist, lyrics: editedLyrics.split('\n').map(text => ({ timestamp: 0, text: text.trim() })) }, password);
        toast.success('Song updated');
        setIsEditing(false);
        // Refetch song data
        const songData = await getSongById(songId);
        setSong(songData);
      } catch (error) {
        toast.error('Failed to update song. Incorrect password?');
      }
    }
  };

  const handleDelete = async () => {
    const password = prompt('Enter password to delete song');
    if (password) {
      try {
        await deleteSong(songId, password);
        toast.success('Song deleted');
        removeSongFromRecentlyPlayed(songId); // Call to remove from recently played
        router.push('/');
      } catch (error) {
        toast.error('Failed to delete song. Incorrect password?');
      }
    }
  };

  if (!song) {
    return <div className="relative right-0 top-0 bottom-0 w-full p-6 bg-slate-900 text-slate-400">Loading…</div>;
  }

  const albumObj = album;

  return (
    <div className="relative right-0 top-0 bottom-0 w-full p-6 bg-slate-900">
      <div className="relative w-full h-64 sm:h-96 rounded-lg overflow-hidden">
        <Image src={song.cover} alt={song.title} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end p-6">
          <p className="text-slate-300 text-xs uppercase">Song</p>
          {isEditing ? (
            <>
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="bg-slate-700 text-white text-3xl sm:text-5xl font-extrabold leading-tight w-full mb-2" />
              <input type="text" value={editedArtist} onChange={(e) => setEditedArtist(e.target.value)} className="bg-slate-700 text-white text-sm w-full mb-2" />
              <textarea
                value={editedLyrics}
                onChange={(e) => setEditedLyrics(e.target.value)}
                className="bg-slate-700 text-white text-sm w-full"
                rows={5}
              />
            </>
          ) : (
            <>
              <h1 className="text-white text-3xl sm:text-5xl font-extrabold leading-tight">{song.title}</h1>
              <div className="mt-2 text-slate-300 text-sm flex items-center gap-2">
                <span>{song.artist}</span>
                {albumObj && (
                  <>
                    <span>•</span>
                    <Link href={`/albums/${albumObj._id}`} className="hover:underline">{albumObj.title}</Link>
                    <span>•</span>
                    <span>{formatDurationFromLyrics(song.lyrics)}</span>
                  </>
                )}
              </div>
            </>
          )}
          <div className="mt-4 flex gap-3">
            <SongControls />
            <button onClick={() => setIsEditing(!isEditing)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full">
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="mt-4 flex gap-4">
          <button onClick={handleUpdate} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-full">
            Update Song
          </button>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-full">
            Delete Song
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-white text-xl font-semibold mb-3">Lyrics</h2>
          <div className="text-slate-300 bg-slate-800/40 rounded-lg p-4 max-h-[420px] overflow-y-auto">
            {song.lyrics && song.lyrics.length > 0 ? (
              song.lyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`py-1 transition-colors duration-300 ${highlightedLyricIndex === index ? 'text-white font-semibold' : ''}`}
                >
                  {lyric.text}
                </p>
              ))
            ) : (
              <p>No lyrics available for this song.</p>
            )}
          </div>
        </div>

        <div>
          {albumObj && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white text-xl font-semibold">From the album</h2>
                <Link href={`/albums/${albumObj._id}`} className="text-slate-300 text-sm hover:underline">See all</Link>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {albumSongs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-slate-400">No songs in this album</td>
                      </tr>
                    ) : (
                      albumSongs.map((s, idx) => (
                        <tr key={s._id || idx} className="hover:bg-slate-800/40 cursor-pointer" onClick={() => setActiveSong(s, albumSongs, idx)}>
                          <td className="px-4 py-3 text-sm text-slate-300">{idx + 1}</td>
                          <td className="px-4 py-3 text-white text-sm font-semibold">{s.title}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{formatDurationFromLyrics(s.lyrics)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-6">
            <h2 className="text-white text-xl font-semibold mb-3">More by {song.artist}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {moreByArtist.map((s, idx) => (
                <div key={s._id || idx} className="bg-slate-800/50 rounded p-3 hover:bg-slate-800 cursor-pointer" onClick={() => setActiveSong(s)}>
                  <div className="relative w-full aspect-square rounded overflow-hidden">
                    <Image src={s.cover} alt={s.title} fill sizes="(max-width: 768px) 33vw, 15vw" className="object-cover" />
                  </div>
                  <div className="mt-2">
                    <div className="text-white text-sm font-semibold truncate">{s.title}</div>
                    <div className="text-slate-400 text-xs truncate">{s.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetailsPage;
