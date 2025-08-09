"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeMute, FaListUl, FaRandom, FaRedo } from 'react-icons/fa';
import songCover from '@/imgs/song-cover.png';
import { usePlayer } from '@/context/PlayerContext';
import SongQueueModal from './SongQueueModal';

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds)) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const AudioPlayer = () => {
  const { 
    activeSong, 
    isPlaying, 
    setIsPlaying, 
    audioRef, 
    currentTime, 
    setCurrentTime,
    duration,
    setDuration,
    playNext,
    playPrevious,
    isShuffling,
    setIsShuffling,
    repeatMode,
    setRepeatMode,
    isQueueModalOpen,
    toggleQueueModal
  } = usePlayer();

  const { volume, setVolume } = usePlayer();
  const [lastVolume, setLastVolume] = useState(1);

  // Effect to handle loading a new song
  useEffect(() => {
    if (activeSong && audioRef.current) {
      const audio = audioRef.current;
      audio.src = activeSong.audioUrl;
      audio.load(); // Load the new source
      // When a new song is loaded, we want it to play if the player was already playing
      if (isPlaying) { 
        audio.play().catch(e => console.error("Error playing audio:", e));
      }
    }
  }, [activeSong, audioRef]);

  // Effect to handle play/pause state changes from context
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) audio.play().catch(e => console.error("Error playing audio:", e));
    else audio.pause();
  }, [isPlaying]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (isFinite(audio.currentTime)) setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      playNext(); // Automatically play the next song
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioRef, setCurrentTime, playNext]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSong) return;
    
    // The useEffect for isPlaying will handle the play/pause action
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="z-40 w-full h-20 bg-slate-800 flex-shrink-0 flex items-center justify-between border-t border-slate-700 px-6">
      <audio ref={audioRef} />
      <Link href={`/song/${activeSong?._id}`} className="flex items-center gap-4 w-1/3 min-w-[150px]">
        <div className="relative w-14 h-14 rounded-md overflow-hidden hidden sm:block">
          <Image
            src={activeSong?.cover || songCover}
            alt="Current Song Cover"
            fill
            sizes="100%"
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-white text-md sm:text-lg font-semibold">
            {activeSong?.title || 'No song selected'}
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm">{activeSong?.artist || '-'}</p>
        </div>
      </Link>

      <div className="flex flex-col items-center justify-center gap-2 w-1/3">
        <div className="flex items-center gap-6 text-white text-xl">
          <button
            title="Shuffle"
            onClick={() => setIsShuffling(!isShuffling)}
            className={`cursor-pointer ${isShuffling ? 'text-[#1ED760]' : ''} hover:text-gray-300 transition-colors`}
          >
            <FaRandom />
          </button>
          <FaStepBackward onClick={playPrevious} className="cursor-pointer hover:text-gray-300 transition-colors" />
          <button onClick={togglePlayPause} className="cursor-pointer text-3xl hover:text-gray-300 transition-colors">
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <FaStepForward onClick={playNext} className="cursor-pointer hover:text-gray-300 transition-colors" />
          <button
            title="Repeat"
            onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
            className={`cursor-pointer ${repeatMode !== 'off' ? 'text-[#1ED760]' : ''} hover:text-gray-300 transition-colors`}
          >
            <FaRedo />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-gray-400 text-xs sm:w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            value={currentTime || 0}
            min="0"
            max={duration || 0}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#1ED760] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-[#1ED760] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #1DB954, #1ED760 ${progress}%, #4B5563 ${progress}%)`
            }}
          />
          <span className="text-gray-400 text-xs sm:w-10">{formatTime(duration)}</span>
          <FaListUl onClick={toggleQueueModal} className="text-gray-400 text-xl sm:text-lg cursor-pointer hover:text-gray-300 transition-colors" />
        </div>
      </div>

      <div className="flex items-center gap-2 w-1/3 justify-end">
        <button onClick={toggleMute} className="text-white text-xl cursor-pointer hover:text-gray-300 transition-colors">
          {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#1ED760] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-[#1ED760] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #1DB954, #1ED760 ${volume * 100}%, #4B5563 ${volume * 100}%)`
          }}
        />
      </div>
      <SongQueueModal isOpen={isQueueModalOpen} onClose={toggleQueueModal} />
    </div>
  );
}

export default AudioPlayer
