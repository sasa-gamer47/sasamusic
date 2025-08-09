"use client"

import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { CreateSongParams } from '@/types';
import { getLatestSongs } from '@/lib/actions/song.actions';

interface PlayerContextType {
  activeSong: CreateSongParams | null;
  setActiveSong: (song: CreateSongParams, songs?: CreateSongParams[], index?: number) => void;
  songQueue: CreateSongParams[];
  currentSongIndex: number;
  playNext: () => void;
  playPrevious: () => void;
  addSongToQueue: (song: CreateSongParams) => void;
  insertNextInQueue: (song: CreateSongParams) => void;
  removeFromQueue: (songId: string) => void;
  removeSongFromRecentlyPlayed: (songId: string) => void;
  recentlyPlayed: CreateSongParams[];
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (d: number) => void;
  isShuffling: boolean;
  setIsShuffling: (v: boolean) => void;
  repeatMode: 'off' | 'one' | 'all';
  setRepeatMode: (m: 'off' | 'one' | 'all') => void;
  volume: number;
  setVolume: (v: number) => void;
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
  const [duration, setDuration] = useState(0);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(1);
  const [recentlyPlayed, setRecentlyPlayed] = useState<CreateSongParams[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load state from localStorage on initial mount
  React.useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { activeSong: savedActiveSong, isPlaying: savedIsPlaying, duration: savedDuration, isShuffling: savedShuffle, repeatMode: savedRepeat, volume: savedVolume, recentlyPlayed: savedRecent } = JSON.parse(savedState);
        _setActiveSong(savedActiveSong);
        setIsPlaying(savedIsPlaying);
        if (typeof savedDuration === 'number') setDuration(savedDuration);
        if (typeof savedShuffle === 'boolean') setIsShuffling(savedShuffle);
        if (savedRepeat === 'off' || savedRepeat === 'one' || savedRepeat === 'all') setRepeatMode(savedRepeat);
        if (typeof savedVolume === 'number') setVolume(Math.max(0, Math.min(1, savedVolume)));
        if (Array.isArray(savedRecent)) setRecentlyPlayed(savedRecent);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, []);

  // Save state to localStorage whenever key fields change
  React.useEffect(() => {
    try {
      if (activeSong) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          activeSong,
          isPlaying,
          duration,
          isShuffling,
          repeatMode,
          volume,
          recentlyPlayed,
        }));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if no active song
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [activeSong, isPlaying, duration, isShuffling, repeatMode, volume, recentlyPlayed]);

  const setActiveSong = (song: CreateSongParams, songs?: CreateSongParams[], index?: number) => {
    _setActiveSong(song);
    setIsPlaying(true);
    // Update recently played: move to front, unique, cap at 20
    setRecentlyPlayed(prev => {
      const without = prev.filter(s => s._id !== song._id);
      return [song, ...without].slice(0, 20);
    });
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

  const insertNextInQueue = useCallback((song: CreateSongParams) => {
    setSongQueue(prev => {
      const existsIndex = prev.findIndex(s => s._id === song._id);
      const base = existsIndex !== -1 ? prev.filter(s => s._id !== song._id) : [...prev];
      const insertAt = currentSongIndex >= 0 ? currentSongIndex + 1 : base.length;
      base.splice(insertAt, 0, song);
      return base;
    });
  }, [currentSongIndex]);

  const removeFromQueue = useCallback((songId: string) => {
    setSongQueue(prev => prev.filter(s => s._id !== songId));
  }, []);

  const removeSongFromRecentlyPlayed = useCallback((songId: string) => {
    setRecentlyPlayed(prev => prev.filter(s => s._id !== songId));
    // Also clear the active song if it's the one being deleted
    _setActiveSong(prevActiveSong => (prevActiveSong && prevActiveSong._id === songId ? null : prevActiveSong));
  }, [_setActiveSong]);

  const playNext = async () => {
    if (songQueue.length === 0) return;
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }

    let nextIndex = currentSongIndex;
    if (isShuffling && songQueue.length > 1) {
      let rand = Math.floor(Math.random() * songQueue.length);
      if (rand === currentSongIndex) rand = (rand + 1) % songQueue.length;
      nextIndex = rand;
    } else if (currentSongIndex + 1 < songQueue.length) {
      nextIndex = currentSongIndex + 1;
    } else if (repeatMode === 'all') {
      nextIndex = 0;
    } else {
      // End of queue without repeat-all: pick a random song from latest and continue
      try {
        const latest = await getLatestSongs();
        if (latest && latest.length > 0) {
          const rand = Math.floor(Math.random() * latest.length);
          _setActiveSong(latest[rand]);
          setSongQueue(latest);
          setCurrentSongIndex(rand);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      } catch {
        setIsPlaying(false);
      }
      return;
    }
    _setActiveSong(songQueue[nextIndex]);
    setCurrentSongIndex(nextIndex);
  };

  const playPrevious = () => {
    if (audioRef.current && currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    if (songQueue.length === 0) return;
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = repeatMode === 'all' ? songQueue.length - 1 : 0;
    _setActiveSong(songQueue[prevIndex]);
    setCurrentSongIndex(prevIndex);
  };

  const toggleQueueModal = () => {
    setIsQueueModalOpen(prev => !prev);
  };

  const value = {
    activeSong, setActiveSong, songQueue, currentSongIndex,
    playNext, playPrevious, addSongToQueue, insertNextInQueue, removeFromQueue, removeSongFromRecentlyPlayed, isPlaying, setIsPlaying,
    audioRef, currentTime, setCurrentTime,
    duration, setDuration,
    isShuffling, setIsShuffling, repeatMode, setRepeatMode,
    volume, setVolume,
    recentlyPlayed,
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
