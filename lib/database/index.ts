import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    console.log('Connecting to database');

    if(!MONGODB_URI) throw new Error('MONGODB_URI is missing');

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: 'Cluster0',
        bufferCommands: false,
    });

    if (process.env.NODE_ENV === 'development' && mongoose.connection && mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection('songs').dropIndex('artist_1');
        console.log('Dropped index artist_1');
      } catch (error) {
        console.log('Error dropping index artist_1', error);
      }
    }

    return cached.conn;
}
