import { Schema, model, models } from "mongoose";

const SongSchema = new Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    cover: { type: String, required: true },
    album: { type: Schema.Types.ObjectId, ref: 'Album' },
    createdAt: { type: Date, default: Date.now },
    audioUrl: { type: String, required: true },
    lyrics: [{
        timestamp: { type: Number, required: true },
        text: { type: String, default: '' }, // Set default to empty string
    }],
});

SongSchema.index({ title: 1, artist: 1, album: 1 });

const Song = models.Song || model('Song', SongSchema);

export default Song;
