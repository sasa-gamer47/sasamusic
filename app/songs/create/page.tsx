// songs/create/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
// REMOVE THIS LINE: import { connectToDatabase } from '@/lib/database'; // <<<--- DELETE THIS IMPORT
import { createSong, updateSong } from '@/lib/actions/song.actions';
import { uploadFileToCloudinary } from '@/lib/actions/cloudinary.actions';
import { generateTimedLyricsFromAudio } from '@/lib/actions/audio.actions';
import { CreateSongParams } from '@/types';
import AlbumDropdown from '@/components/AlbumDropdown';
import AlbumCreationForm from '@/components/AlbumCreationForm';
import { searchAlbums } from '@/lib/actions/album.actions'; // <<<--- This is your server action

interface Album {
  _id: string;
  title: string;
  cover: string;
}

const CreateSongPage = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [rawLyrics, setRawLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  // Renamed for clarity, as it fetches for the dropdown
  const fetchAlbumsForDropdown = async () => {
    try {
      // Call the server action. It will handle connectToDatabase() on the server.
      // Pass an empty object to searchAlbums as you want all for the dropdown initially.
      const albumList = await searchAlbums({});
      if (albumList) {
        setAlbums(albumList);
      }
    } catch (error: any) {
      console.error('Error fetching albums for dropdown:', error);
      setError('Failed to load albums.');
    }
  };

  useEffect(() => {
    fetchAlbumsForDropdown(); // <<<--- Now calls the server action
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !artist || !audioFile) {
      toast.error('Please fill in all required fields (Title, Artist, Audio File).');
      setIsLoading(false);
      return;
    }

    toast.loading('Creating song...');

    try {
      const base64Audio = await convertFileToBase64(audioFile);
      const audioUrl = await uploadFileToCloudinary({
        file: base64Audio,
        resourceType: 'video', // Cloudinary treats audio as 'video' resource type
        folder: 'sasamusic_audio',
      });

      const selectedAlbum = albums.find((album) => album._id === albumId);

      const newSong: CreateSongParams = {
        title,
        artist,
        cover: selectedAlbum && selectedAlbum.cover ? selectedAlbum.cover : 'https://res.cloudinary.com/dvwqgr38p/image/upload/v1717858368/sasamusic_covers/song-cover_j5fomg.png',
        audioUrl,
        album: albumId || undefined, // Use albumId instead of album
        lyrics: rawLyrics
          ? rawLyrics
              .split('\n')
              .map(text => ({ timestamp: 0, text: text.trim() })) // Trim whitespace
              .filter(line => line.text !== '') // Filter out empty lines
          : [],
      };

      const createdSong = await createSong(newSong); // Assuming createSong is also a server action
      toast.success('Song created successfully', { duration: 3000 });

      // Generate timed lyrics using Gemini
      if (rawLyrics && audioUrl) {
        setIsLoading(true); // Re-set loading for lyric generation phase
        toast.loading('Generating timed lyrics...', { duration: 2000 });
        try {
          console.log('Starting audio transcription...');
          // const sttOutput = await transcribeAudio({ audioUrl });
          // console.log('Audio transcription complete:', sttOutput);

          console.log('Starting Gemini lyric alignment...');
          let timedLyrics = await generateTimedLyricsFromAudio({ rawLyrics, audioUrl, audioMimeType: audioFile.type });
          console.log('Gemini lyric alignment complete:', timedLyrics);

          // Update the song with the timed lyrics
          const updatedSong = await updateSong(createdSong._id, { lyrics: timedLyrics }); // Assuming updateSong is also a server action
          console.log('Updated song with lyrics:', updatedSong);
          toast.success('Timed lyrics generated successfully!', { duration: 3000 });
        } catch (error) {
          console.error('Error generating lyrics:', error);
          setError('Failed to generate lyrics. Please check console for details.');
          toast.error('Failed to generate timed lyrics.', { duration: 3000 });
        } finally {
          setIsLoading(false);
        }
      }

      router.push(`/song/${createdSong._id}`); // Redirect to the new song's detail page

    } catch (err) {
      console.error('Error creating song:', err);
      setError('Failed to create song. Please check console for details.');
      toast.error('Failed to create song.', { duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumCreate = (newAlbumId: string) => {
    setAlbumId(newAlbumId);
    setIsCreatingAlbum(false);
    // Refresh the album list by re-fetching
    fetchAlbumsForDropdown(); // <<<--- Correctly re-fetches via server action
  };

  const handleCancelCreate = () => {
    setIsCreatingAlbum(false);
  };

  return (
    <div className="relative right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900 flex flex-col items-center justify-center">
      <h1 className="text-white text-3xl font-semibold mb-8">Create New Song</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-lg">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="mb-4">
          <label htmlFor="title" className="block text-white text-sm font-bold mb-2">Song Title</label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="artist" className="block text-white text-sm font-bold mb-2">Artist</label>
          <input
            type="text"
            id="artist"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          {/* Ensure AlbumDropdown receives the albums list */}
          <AlbumDropdown onChange={setAlbumId} />
          <button
            type="button"
            className="text-blue-500 hover:text-blue-400 transition-colors mt-2"
            onClick={() => setIsCreatingAlbum(true)}
          >
            Create New Album
          </button>
        </div>

        {isCreatingAlbum && (
          <div className="mb-4">
            <AlbumCreationForm onCreate={handleAlbumCreate} onCancel={handleCancelCreate} />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="audio" className="block text-white text-sm font-bold mb-2">Audio File</label>
          <input
            type="file"
            id="audio"
            accept="audio/*"
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="lyrics" className="block text-white text-sm font-bold mb-2">Raw Lyrics (Optional)</label>
          <textarea
            id="lyrics"
            rows={6}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
            value={rawLyrics}
            onChange={(e) => setRawLyrics(e.target.value)}
            placeholder="Paste raw lyrics here. Timestamps can be generated later on the song's detail page."
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Song...' : 'Create Song'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSongPage;
