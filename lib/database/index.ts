import mongoose from 'mongoose';

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    console.log('Connecting to database');
    // console.log('MONGODB_URI:', MONGODB_URI);

    if(!MONGODB_URI) throw new Error('MONGODB_URI is missing');

    // console.log('MONGODB_URI:', MONGODB_URI);
    // console.log('MONGODB_URI:', MONGODB_URI);

    cached.promise = cached.promise || (async () => {
      try {
        return await mongoose.connect(MONGODB_URI, {
          dbName: 'Cluster0',
          bufferCommands: false,
        });
      } catch (error) {
        console.error('Database connection error:', error);
        throw error;
      }
    })();

    if (process.env.NODE_ENV === 'development' && mongoose.connection && mongoose.connection.db) {
      try {
        const indexInfo = await mongoose.connection.db.collection('songs').indexInformation();
        if (indexInfo && indexInfo['artist_1']) {
          await mongoose.connection.db.collection('songs').dropIndex('artist_1');
          console.log('Dropped index artist_1');
        } else {
          console.log('Index artist_1 not found');
        }
      } catch (error) {
        console.log('Error dropping index artist_1', error);
      }
    }

    return cached.conn;
}
