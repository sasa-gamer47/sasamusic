"use client"

import React from 'react';
import { FaTimes, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { usePlayer } from '@/context/PlayerContext';
import Image from 'next/image';
import songCover from '@/imgs/song-cover.png';

interface SongQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SongQueueModal: React.FC<SongQueueModalProps> = ({ isOpen, onClose }) => {
  const { songQueue, setActiveSong, activeSong, currentSongIndex, removeFromQueue, insertNextInQueue } = usePlayer();

  if (!isOpen) return null;

  const handleSongClick = (song: any, index: number) => {
    setActiveSong(song, songQueue, index);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-lg w-full max-w-2xl h-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-white text-2xl font-bold">Song Queue</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {songQueue.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">Your queue is empty. Add some songs!</p>
          ) : (
            songQueue.map((song, index) => (
              <div
                key={`${song.title}-${index}`}
                className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-colors
                            ${activeSong?._id === song._id && currentSongIndex === index ? 'bg-green-700' : 'hover:bg-slate-700'}`}
                onClick={() => handleSongClick(song, index)}
              >
                <div className='relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0'>
                  <Image
                    src={song.cover || songCover}
                    alt={song.title}
                    fill
                    sizes="100%"
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-white text-md font-semibold">{song.title}</h3>
                  <p className="text-gray-400 text-sm">{song.artist}</p>
                </div>
                {activeSong?._id === song._id && currentSongIndex === index && (
                  <span className="text-green-400 text-sm">Playing</span>
                )}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    title="Play next"
                    onClick={(e) => { e.stopPropagation(); insertNextInQueue(song); }}
                    className="text-slate-300 hover:text-white"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    title="Remove from queue"
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(song._id!); }}
                    className="text-red-400 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SongQueueModal;
