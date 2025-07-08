'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import Song from '@/lib/database/models/song.model'
import { handleError } from '@/lib/utils'
import { CreateSongParams, LyricLine } from '@/types'


import { Schema, Types, model, models } from "mongoose";


export async function createSong(song: CreateSongParams) {
try {
    await connectToDatabase()
    // Pre-process lyrics to ensure 'text' field exists, preventing validation errors.
    const processedSong = {
        ...song,
            ...(song.lyrics && {
        lyrics: song.lyrics.map(line => ({
        ...line,
        text: line.text || '',
        })),
        }),
    };

    console.log('song: ', processedSong)
    const newSong = await Song.create(processedSong)
    return JSON.parse(JSON.stringify(newSong))
} catch (error) {
    handleError(error)
}
}

interface SearchSongsParams {
    query?: string;
    artist?: string;
    genre?: string;
    albumId?: string;
}

export async function searchSongs({ query, artist, genre, albumId }: SearchSongsParams) {
    try {
        await connectToDatabase();
        const conditions: any = {};

        if (query) {
            conditions.$or = [
                { title: { $regex: query, $options: 'i' } },
                { artist: { $regex: query, $options: 'i' } },
            ];
        }

        if (artist) {
            conditions.artist = { $regex: artist, $options: 'i' };
        }

        if (genre) {
            conditions.genre = { $regex: genre, $options: 'i' };
        }

        if (albumId) {
            conditions.album = new Types.ObjectId(albumId);
        }

        const songs = await Song.find(conditions).sort({ title: 1 });

        return JSON.parse(JSON.stringify(songs));
    } catch (error) {
        handleError(error);
    }
}


export async function updateSong(songId: string, songData: Partial<CreateSongParams>) {
    try {
        await connectToDatabase();
        const dataToUpdate = { ...songData };

        // If lyrics are being updated, process them to ensure 'text' exists.
        if (dataToUpdate.lyrics) {
            dataToUpdate.lyrics = dataToUpdate.lyrics.map(line => ({
                ...line,
                text: line.text || '',
            }));
        }

        const updatedSong = await Song.findByIdAndUpdate(
            songId,
            { $set: dataToUpdate },
            // Return the updated document and run schema validators
            { new: true, runValidators: true }
        );

        if (!updatedSong) throw new Error('Song not found');

        return JSON.parse(JSON.stringify(updatedSong));
    } catch (error) {
        handleError(error);
    }
}

export async function getSongById(songId: string) {
    try {
        await connectToDatabase()
        const song = await Song.findById(songId).populate({
            path: 'album',
            select: '_id title cover'
        });

        if (!song) throw new Error('Song not found')
        return JSON.parse(JSON.stringify(song))
    } catch (error) {
        handleError(error)
    }
}


export async function getLatestSongs() {
    try {
        await connectToDatabase()
        const songs = await Song.find().sort({ createdAt: -1 }).limit(10)

        return JSON.parse(JSON.stringify(songs || []))
    } catch (error) {
        handleError(error)
    }
}
