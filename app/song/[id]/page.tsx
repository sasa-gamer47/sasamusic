"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { getSongById, updateSong } from '@/lib/actions/song.actions';
import { CreateSongParams, LyricLine } from '@/types';
import { getAlbumById } from '@/lib/actions/album.actions';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import { generateTimedLyricsFromAudio } from '@/lib/actions/audio.actions';

const SongDetailsPage = () => {
  const params = useParams();
  const songId = params.id as string;

  const [song, setSong] = React.useState<CreateSongParams | null>(null);
  const [album, setAlbum] = React.useState<any>(null);
  const { currentTime } = usePlayer();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editArtist, setEditArtist] = React.useState('');
  const [editAlbum, setEditAlbum] = React.useState('');
  const [rawLyricsInput, setRawLyricsInput] = React.useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = React.useState(false);

  React.useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;
      try {
        const songData = await getSongById(songId);
        if (songData) {
          setSong(songData);
          setEditTitle(songData.title);
          setEditArtist(songData.artist);
          setEditAlbum(songData.album || '');
          if (songData?.album) {
            const albumData = await getAlbumById(songData.album);
            setAlbum(albumData);
          }
          setRawLyricsInput(songData.lyrics?.map((l: LyricLine) => l.text).join('\n') || '');
        }
      } catch (error) {
        console.error("Error fetching song:", error);
      }
    };
    fetchSong();
  }, [songId]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    setIsEditing(false);
    if (!song) return;

    try {
      const updatedSongData = {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
      };
      const updatedSong = await updateSong(song._id!, updatedSongData);
      setSong(updatedSong);
      alert('Song updated successfully!');
    } catch (error) {
      console.error("Error updating song:", error);
      alert('Failed to update song. Please check console for details.');
    }
  };

  const handleGenerateLyrics = async () => {
    if (!song || !song.audioUrl) {
      alert('No audio file available to generate lyrics.');
      return;
    }
    if (!rawLyricsInput.trim()) {
      alert('Please provide raw lyrics in the text area before generating timed lyrics.');
      return;
    }

    setIsGeneratingLyrics(true);
    try {
      console.log('Starting audio transcription for lyric generation...');
      // const sttOutput = await transcribeAudio({ audioUrl: song.audioUrl });
      // console.log('Audio transcription complete:', sttOutput);

      console.log('Starting Gemini lyric alignment...');
      const timedLyrics = await generateTimedLyricsFromAudio({ rawLyrics: rawLyricsInput, audioUrl: song.audioUrl, audioMimeType: 'audio/mpeg' });
      const updatedSong = await updateSong(song._id!, { lyrics: timedLyrics });
      console.log('Gemini lyric alignment complete:', timedLyrics);
      setSong(updatedSong);
      alert('Timed lyrics generated and updated successfully!');
    } catch (error) {
      console.error('Error generating timed lyrics:', error);
      alert('Failed to generate timed lyrics. Please check console for details.');
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
    return <div>Loading...</div>;
  }

  return (
    <div className="relative right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900 flex flex-col items-center justify-center">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white mb-2"
          />
          <input
            type="text"
            value={editArtist}
            onChange={(e) => setEditArtist(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white mb-2"
          />
          <input
            type="text"
            value={editAlbum}
            onChange={(e) => setEditAlbum(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white mb-2"
          />
          <button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Save
          </button>
          <textarea
            id="rawLyrics"
            rows={6}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white mt-4"
            value={rawLyricsInput}
            onChange={(e) => setRawLyricsInput(e.target.value)}
            placeholder="Paste raw lyrics here to generate timed lyrics."
          />
          <button
            onClick={handleGenerateLyrics}
            className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 ${isGeneratingLyrics ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isGeneratingLyrics}
          >{isGeneratingLyrics ? 'Generating...' : 'Generate Timed Lyrics'}</button>
        </>
      ) : (
        <>
          <h1 className="text-white text-3xl font-semibold">{song.title}</h1>
          <p className="text-gray-400 text-sm">{song.artist}</p>
          <button onClick={handleEditClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Edit Song Info
          </button>
        </>
      )}
      <Image src={song.cover} alt={song.title} width={400} height={400} className="rounded-md mt-4" />
      <>
        <h2 className="text-white text-2xl font-semibold mt-8 w-full bg-slate-800 text-center rounded-lg">Lyrics</h2>
        <div className="text-gray-400 text-center mt-4 max-h-96 overflow-y-auto">
          {song.lyrics && song.lyrics.length > 0 ? (
            song.lyrics.map((lyric, index) => (
              <p
                key={index}
                className={`py-1 transition-colors duration-300 ${
                  highlightedLyricIndex === index ? 'text-white font-bold text-lg' : ''
                }`}
              >
                {lyric.text}
              </p>
            ))
          ) : (
            <p>No lyrics available for this song.</p>
          )}
        </div>
        {album && (
          <>
            <h2 className="text-white text-2xl font-semibold mt-8">Album</h2>
            <div>
              <Image src={album.cover} alt={album.title || 'Album Cover'} width={200} height={200} className="rounded-md mt-4" />
              <p className="text-gray-400">{album.title}</p>
            </div>
          </>
        )}
        <h2 className="text-white text-2xl font-semibold mt-8">Related Songs</h2>
        <p className="text-gray-400">
          [Placeholder for related songs]
        </p>
        <h2 className="text-white text-2xl font-semibold mt-8">Related Albums</h2>
        <p className="text-gray-400">
          [Placeholder for related albums]
        </p>
      </>
    </div>
  );
};

export default SongDetailsPage;
