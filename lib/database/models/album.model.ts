import { Schema, model, models } from "mongoose";

const AlbumSchema = new Schema({
    title: { type: String, required: true, unique: true },
    artist: { type: String, default: 'Francesco Omma' },
    cover: { type: String, required: true },
    songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
    album: { type: Schema.Types.ObjectId, ref: 'Album' },
});

const Album = models.Album || model('Album', AlbumSchema);

export default Album;
