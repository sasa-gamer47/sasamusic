// app/page.tsx
"use client"

import Image from "next/image";
import Song from "@/components/Song";
import Album from "@/components/Album";
import { getLatestSongs } from "@/lib/actions/song.actions"; // Correct: Server Action
import { getLatestAlbums } from "@/lib/actions/album.actions"; // Correct: Server Action
import { CreateSongParams, CreateAlbumParams } from "@/types";
import { usePlayer } from "@/context/PlayerContext";
import { FaPlay } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { toast } from 'sonner';
// REMOVE THIS LINE: import { connectToDatabase } from "@/lib/database"; // <--- DELETE THIS IMPORT

const Home = () => {
  const { addSongToQueue, setActiveSong, recentlyPlayed } = usePlayer();

  // REMOVE THIS ENTIRE useEffect BLOCK:
  // useEffect(() => {
  //   connectToDatabase();
  // }, []);

  const router = useRouter();

  const [latestSongs, setLatestSongs] = useState<CreateSongParams[]>([])
  const [latestAlbums, setLatestAlbums] = useState<CreateAlbumParams[]>([])
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const [songs, albums] = await Promise.all([
          getLatestSongs(), // These are Server Actions, they run on the server
          getLatestAlbums(), // These are Server Actions, they run on the server
        ]); 
        if (songs && songs.length > 0) {
          setLatestSongs(songs.slice(0, 4)); // Limit to 4 latest songs
          // Automatically add fetched songs to the queue
          songs.forEach((song: CreateSongParams) => addSongToQueue(song));
          if (songs.length > 0) toast.success('Latest songs loaded');
        }
        if (albums && albums.length > 0) {
          setLatestAlbums(albums.slice(0, 4)); // Limit to 4 latest albums
        }
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
      } catch (error) {
        console.error('Error fetching latest data: ', error);
      }
    };
    fetchLatest();
  }, [addSongToQueue]); // addSongToQueue should be stable or memoized if it causes re-renders

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search')?.toString();

    if (searchQuery) {
      router.push(`/search?query=${searchQuery}`);
    }
  };

  return (
    <div className="absolute right-0 top-20 z-20 sm:top-0 bottom-0 w-full sm:w-10/12 h-full flex">

      <div className="relative right-0 top-0 bottom-0 w-full sm:w-10/12 p-6 bg-slate-900">
        <form onSubmit={handleSearch} className="flex justify-center border-b-2 border-slate-800 sticky top-0 z-10 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Search songs..."
            className="p-3 rounded-md text-gray-100 outline-none w-full"
          />
        </form>
        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-white text-3xl font-semibold">{greeting}</h1>
          {latestSongs[0] && (
            <button
              className="bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-full flex items-center gap-2"
              onClick={() => setActiveSong(latestSongs[0], latestSongs, 0)}
            >
              <FaPlay /> Play
            </button>
          )}
        </div>

        {recentlyPlayed.length > 0 && (
          <>
            <h2 className="text-white text-2xl font-semibold mt-6">Recently played</h2>
            <div className="w-full py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recentlyPlayed.slice(0, 2).map((song, index) => (
                <div key={song._id || index} className="bg-slate-800/60 rounded-lg p-3 flex items-center gap-3 hover:bg-slate-800 cursor-pointer" onClick={() => setActiveSong(song)}>
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    <Image src={song.cover} alt={song.title} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="truncate">
                    <div className="text-white text-sm font-semibold truncate">{song.title}</div>
                    <div className="text-slate-400 text-xs truncate">{song.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-white text-2xl font-semibold mt-6">Latest Songs</h2>
        <div className="w-full py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {latestSongs.slice(0, 2).map((song, index) => (
            <Song key={song._id || index} song={song} />
          ))}
        </div>
        <h2 className="text-white text-2xl font-semibold">Latest Albums</h2>
        <div className="w-full py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {latestAlbums.map((album: CreateAlbumParams, index: number) => (
            <Album key={album._id || index} cover={album.cover} title={album.title} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home
