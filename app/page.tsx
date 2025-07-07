"use client"

import Image from "next/image";
import Song from "@/components/Song";
import Album from "@/components/Album";
import { getLatestSongs } from "@/lib/actions/song.actions";
import { getLatestAlbums } from "@/lib/actions/album.actions";
import { CreateSongParams, CreateAlbumParams } from "@/types";
import { usePlayer } from "@/context/PlayerContext";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";

const Home = () => {
  const { addSongToQueue } = usePlayer();
  const router = useRouter();

  const [latestSongs, setLatestSongs] = useState<CreateSongParams[]>([])
  const [latestAlbums, setLatestAlbums] = useState<CreateAlbumParams[]>([])

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const [songs, albums] = await Promise.all([
          getLatestSongs(),
          getLatestAlbums(),
        ]); 
        if (songs && songs.length > 0) {
          setLatestSongs(songs.slice(0, 4)); // Limit to 4 latest songs
          // Automatically add fetched songs to the queue
          songs.forEach((song: CreateSongParams) => addSongToQueue(song));
        }
        if (albums && albums.length > 0) {
          setLatestAlbums(albums.slice(0, 4)); // Limit to 4 latest albums
        }
      } catch (error) {
        console.error('Error fetching latest data: ', error);
      }
    };
    fetchLatest();
  }, [addSongToQueue]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search')?.toString();

    if (searchQuery) {
      router.push(`/search?query=${searchQuery}`);
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-10/12 h-full flex">

      <div className="relative right-0 top-0 bottom-0 w-10/12 p-6 bg-slate-900">
        <form onSubmit={handleSearch} className=" flex justify-center border-b-2 border-slate-800">
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Search songs..."
            className="p-2 rounded-md text-gray-100 outline-none w-full"
          />
        </form>
        <h1 className="text-white text-3xl font-semibold">Latest Songs</h1>
        <div className="w-full h-3/12 py-4 flex items-center justify-start gap-4 overflow-x-auto">
          {latestSongs.map((song, index) => (
            <div key={song._id || index} className=" h-full aspect-square flex items-center justify-center rounded-lg overflow-hidden relative shadow-lg">
              <Song song={song} />
            </div>
          ))}
        </div>
        <h1 className="text-white text-3xl font-semibold">Latest Albums</h1>
        <div className="w-full h-3/12 py-4 flex items-center justify-start gap-4 overflow-x-auto">
          {latestAlbums.map((album: CreateAlbumParams, index: number) => (
            <div key={album._id || index} className=" h-full aspect-square flex items-center justify-center rounded-lg overflow-hidden relative shadow-lg">
              <Album cover={album.cover} title={album.title} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home
