"use client"

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { CreateSongParams } from '@/types';

interface PlayerContextType {
  activeSong: CreateSongParams | null;
  setActiveSong: (song: CreateSongParams, songs?: CreateSongParams[], index?: number) => void;
  songQueue: CreateSongParams[];
  currentSongIndex: number;
  playNext: () => void;
  playPrevious: () => void;
  addSongToQueue: (song: CreateSongParams) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isQueueModalOpen: boolean;
  toggleQueueModal: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'musicPlayerState';

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [activeSong, _setActiveSong] = useState<CreateSongParams | null>(null);
  const [songQueue, setSongQueue] = useState<CreateSongParams[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load state from localStorage on initial mount
  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { activeSong: savedActiveSong, currentTime: savedCurrentTime, isPlaying: savedIsPlaying } = JSON.parse(savedState);
        _setActiveSong(savedActiveSong);
        setCurrentTime(savedCurrentTime);
        setIsPlaying(savedIsPlaying);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever activeSong, currentTime, or isPlaying changes
  React.useEffect(() => {
    try {
      if (activeSong) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          activeSong,
          isPlaying,
        }));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if no active song
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [activeSong, isPlaying]);

  const setActiveSong = (song: CreateSongParams, songs?: CreateSongParams[], index?: number) => {
    _setActiveSong(song);
    if (songs && index !== undefined) {
      setSongQueue(songs);
      setCurrentSongIndex(index);
    } else if (!songQueue.some(s => s._id === song._id)) {
      // If no queue is provided, and the song is not already in the queue, add it
      setSongQueue(prevQueue => [...prevQueue, song]);
      setCurrentSongIndex(songQueue.length); // Set to the newly added song's index
    } else {
      // If the song is already in the queue, just set it as active
      const existingIndex = songQueue.findIndex(s => s._id === song._id);
      setCurrentSongIndex(existingIndex);
    }
    // When a new song is set, reset current time unless it's being loaded from storage
    if (audioRef.current && activeSong?._id !== song._id) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const addSongToQueue = useCallback((song: CreateSongParams) => {
    if (!songQueue.some(s => s._id === song._id)) {
      setSongQueue(prevQueue => [...prevQueue, song]);
    }
  }, [songQueue]);

  const playNext = () => {
    if (songQueue.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songQueue.length;
    _setActiveSong(songQueue[nextIndex]);
    setCurrentSongIndex(nextIndex);
  };

  const playPrevious = () => {
    if (audioRef.current && currentTime > 3) { // If song has played for more than 3 seconds, restart it
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    } else { // Otherwise, go to the previous song
      if (songQueue.length === 0) return;
      const prevIndex = (currentSongIndex - 1 + songQueue.length) % songQueue.length;
      _setActiveSong(songQueue[prevIndex]);
      setCurrentSongIndex(prevIndex);
    }
  };

  const toggleQueueModal = () => {
    setIsQueueModalOpen(prev => !prev);
  };

  const value = {
    activeSong, setActiveSong, songQueue, currentSongIndex,
    playNext, playPrevious, addSongToQueue, isPlaying, setIsPlaying,
    audioRef, currentTime, setCurrentTime,
    isQueueModalOpen, toggleQueueModal,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
