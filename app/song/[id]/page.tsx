"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { getSongById, updateSong, searchSongs } from '@/lib/actions/song.actions';
import { CreateSongParams, LyricLine } from '@/types';
import { getAlbumById, getSongsByAlbum } from '@/lib/actions/album.actions';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import { generateTimedLyricsFromAudio } from '@/lib/actions/audio.actions';
import { toast } from 'sonner';

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
  const songId = params.id as string;

  const [song, setSong] = React.useState<CreateSongParams | null>(null);
  const [album, setAlbum] = React.useState<any>(null);
  const [albumSongs, setAlbumSongs] = React.useState<CreateSongParams[]>([]);
  const [moreByArtist, setMoreByArtist] = React.useState<CreateSongParams[]>([]);
  const { currentTime, setActiveSong } = usePlayer();
  const [rawLyricsInput, setRawLyricsInput] = React.useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = React.useState(false);

  React.useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;
      try {
        const songData = await getSongById(songId);
        if (songData) {
          setSong(songData);
          setRawLyricsInput(songData.lyrics?.map((l: LyricLine) => l.text).join('\n') || '');

          // Album info (populated in getSongById) or fetch if just id
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

          // More by artist
          const more = await searchSongs({ artist: songData.artist });
          setMoreByArtist((more || []).filter((s: CreateSongParams) => s._id !== songData._id).slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching song:', error);
      }
    };
    fetchSong();
  }, [songId]);

  const handleGenerateLyrics = async () => {
    if (!song || !song.audioUrl) return;
    if (!rawLyricsInput.trim()) return;
    setIsGeneratingLyrics(true);
    try {
      const timedLyrics = await generateTimedLyricsFromAudio({ rawLyrics: rawLyricsInput, audioUrl: song.audioUrl, audioMimeType: 'audio/mpeg' });
      const updatedSong = await updateSong(song._id!, { lyrics: timedLyrics });
      setSong(updatedSong);
      toast.success('Timed lyrics generated');
    } catch (error) {
      console.error('Error generating timed lyrics:', error);
      toast.error('Failed to generate timed lyrics');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

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

  if (!song) {
    return <div className="relative right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900 text-slate-400">Loading…</div>;
  }

  const albumObj = album;
  const handlePlayNow = () => {
    if (albumSongs.length > 0) {
      const idx = albumSongs.findIndex(s => s._id === song._id);
      setActiveSong(song, albumSongs, idx === -1 ? 0 : idx);
    } else {
      setActiveSong(song);
    }
  };

  return (
    <div className="relative right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900">
      <div className="flex gap-6 items-end">
        <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-md overflow-hidden shadow-lg">
          <Image src={song.cover} alt={song.title} fill sizes="(max-width: 768px) 160px, 224px" className="object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-slate-300 text-xs uppercase">Song</p>
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
          <div className="mt-4 flex gap-3">
            <button onClick={handlePlayNow} className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-5 rounded-full">Play</button>
          </div>
        </div>
      </div>

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

      {/* Optional: Raw lyrics input and generator for admins or advanced usage */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8">
          <h3 className="text-white text-lg font-semibold mb-2">Refine Lyrics (dev)</h3>
          <textarea
            id="rawLyrics"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-slate-800"
            value={rawLyricsInput}
            onChange={(e) => setRawLyricsInput(e.target.value)}
            placeholder="Paste raw lyrics here to generate timed lyrics."
          />
          <button
            onClick={handleGenerateLyrics}
            className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 ${isGeneratingLyrics ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isGeneratingLyrics}
          >{isGeneratingLyrics ? 'Generating…' : 'Generate Timed Lyrics'}</button>
        </div>
      )}
    </div>
  );
};

export default SongDetailsPage;
