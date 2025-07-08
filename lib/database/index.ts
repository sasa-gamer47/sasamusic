// import mongoose from 'mongoose';

// const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

// let cached = (global as any).mongoose || { conn: null, promise: null };

// export const connectToDatabase = async () => {
//     if (cached.conn) return cached.conn;

//     console.log('Connecting to database');
//     // console.log('MONGODB_URI:', MONGODB_URI);

//     if(!MONGODB_URI) throw new Error('MONGODB_URI is missing');

//     // console.log('MONGODB_URI:', MONGODB_URI);
//     // console.log('MONGODB_URI:', MONGODB_URI);

//     cached.promise = cached.promise || (async () => {
//       try {
//         return await mongoose.connect(MONGODB_URI, {
//           dbName: 'Cluster0',
//           bufferCommands: false,
//         });
//       } catch (error) {
//         console.error('Database connection error:', error);
//         throw error;
//       }
//     })();

//     if (process.env.NODE_ENV === 'development' && mongoose.connection && mongoose.connection.db) {
//       try {
//         const indexInfo = await mongoose.connection.db.collection('songs').indexInformation();
//         if (indexInfo && indexInfo['artist_1']) {
//           await mongoose.connection.db.collection('songs').dropIndex('artist_1');
//           console.log('Dropped index artist_1');
//         } else {
//           console.log('Index artist_1 not found');
//         }
//       } catch (error) {
//         console.log('Error dropping index artist_1', error);
//       }
//     }

//     return cached.conn;
// }


// lib/database/index.ts
import mongoose from 'mongoose';

// IMPORTANT: This should be MONGODB_URI, not NEXT_PUBLIC_MONGODB_URI, as it's server-side
const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

// Use a global object to cache the connection
// This prevents multiple connections during hot-reloading in development
let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
    // If a connection already exists, return it immediately
    if (cached.conn) {
        return cached.conn;
    }

    // If there's an ongoing connection attempt, wait for it
    if (!cached.promise) {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is missing. Please define it in your .env file or environment variables.');
        }

        console.log('Connecting to database...');
        // Start a new connection attempt and store the promise
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: 'Cluster0',
            bufferCommands: false, // This is what makes the timing critical
        })
        .then(async (mongooseInstance) => {
            // Once the connection is successful, store the connection object
            cached.conn = mongooseInstance.connection;
            console.log('Database connected successfully.');

            // --- Development-only index dropping logic ---
            if (process.env.NODE_ENV === 'development' && cached.conn.db) {
                try {
                    const indexInfo = await cached.conn.db.collection('songs').indexInformation();
                    if (indexInfo && indexInfo['artist_1']) {
                        await cached.conn.db.db.collection('songs').dropIndex('artist_1'); // Corrected db.collection
                        console.log('Dropped index artist_1 in development.');
                    } else {
                        console.log('Index artist_1 not found in development (no drop needed).');
                    }
                } catch (error) {
                    console.error('Error dropping index artist_1 in development:', error);
                }
            }
            // --- End of development-only logic ---

            return cached.conn; // Return the actual connection object
        })
        .catch((error) => {
            // If connection fails, clear the promise and re-throw the error
            cached.promise = null; // Clear the promise so next attempt can start fresh
            cached.conn = null; // Also clear the connection on error
            console.error('Database connection error:', error);
            throw error;
        });
    }

    // Await the promise to ensure the connection is established and cached.conn is set
    // Return the resolved connection object from the promise
    return await cached.promise;
};