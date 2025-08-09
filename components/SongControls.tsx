"use client";

import React from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaRandom, FaRedo } from 'react-icons/fa';
import { usePlayer } from '@/context/PlayerContext';

const SongControls = () => {
  const {
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    isShuffling,
    setIsShuffling,
    repeatMode,
    setRepeatMode,
    activeSong,
  } = usePlayer();

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSong) return;
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center justify-center gap-6 text-white text-2xl">
      <button
        title="Shuffle"
        onClick={() => setIsShuffling(!isShuffling)}
        className={`cursor-pointer ${isShuffling ? 'text-[#1ED760]' : ''} hover:text-gray-300 transition-colors`}
      >
        <FaRandom />
      </button>
      <button onClick={playPrevious} className="cursor-pointer hover:text-gray-300 transition-colors">
        <FaStepBackward />
      </button>
      <button onClick={togglePlayPause} className="cursor-pointer text-5xl hover:text-gray-300 transition-colors bg-green-500 rounded-full p-3">
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <button onClick={playNext} className="cursor-pointer hover:text-gray-300 transition-colors">
        <FaStepForward />
      </button>
      <button
        title="Repeat"
        onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
        className={`cursor-pointer ${repeatMode !== 'off' ? 'text-[#1ED760]' : ''} hover:text-gray-300 transition-colors`}
      >
        <FaRedo />
      </button>
    </div>
  );
};

export default SongControls;
