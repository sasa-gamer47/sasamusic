export type LyricLine = {
    timestamp: number;
    text: string;
}

export type CreateSongParams = {
    title: string;
    artist: string;
    cover: string;
    lyrics?: LyricLine[];
    audioUrl: string;
    _id?: string;
    createdAt?: Date;
    album?: string | null;
}

export type CreateAlbumParams = {
    title: string;
    artist: string;
    cover: string;
    _id?: string;
    songs?: string[];
}

export interface Album extends CreateAlbumParams {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
