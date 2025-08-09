'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import Album from '@/lib/database/models/album.model'
import Song from '@/lib/database/models/song.model'
import { handleError } from '@/lib/utils'
import { CreateAlbumParams } from '@/types'

interface SearchAlbumsParams {
    query?: string;
    artist?: string;
    genre?: string;
}

export async function searchAlbums({ query, artist, genre }: SearchAlbumsParams = {}) {
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

        const albums = await Album.find(conditions).sort({ title: 1 });

        return JSON.parse(JSON.stringify(albums));
    } catch (error) {
        handleError(error);
    }
}


export async function createAlbum(album: CreateAlbumParams) {
    try {
        await connectToDatabase()
        const newAlbum = await Album.create({...album, cover: album.cover || '/imgs/song-cover.png', artist: album.artist || 'Francesco Omma'})
        return JSON.parse(JSON.stringify(newAlbum))
    } catch (error) {
        handleError(error)
    }
}

export async function getAlbumById(albumId: string) {
    try {
        await connectToDatabase()
        const album = await Album.findById(albumId)

        if (!album) throw new Error('Album not found')
        return JSON.parse(JSON.stringify(album))
    } catch (error) {
        handleError(error)
    }
}

export async function getSongsByAlbum(albumId: string) {
    try {
        await connectToDatabase()
        // Fetch songs directly to include necessary fields (lyrics for duration, audioUrl, album)
        const songs = await Song.find({ album: albumId })
            .sort({ createdAt: -1 })
            .select('_id title artist cover audioUrl lyrics album createdAt');

        return JSON.parse(JSON.stringify(songs))
    } catch (error) {
        handleError(error)
    }
}

export async function getLatestAlbums() {
    try {
        await connectToDatabase()
        const albums = await Album.find().sort({ createdAt: -1 }).limit(10) // Get the 10 latest albums

        if (!albums || albums.length === 0) throw new Error('No albums found')
        return JSON.parse(JSON.stringify(albums))
    } catch (error) {
        handleError(error)
    }
}
