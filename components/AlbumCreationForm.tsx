"use client";

import React, { useState, useCallback } from 'react';
import { createAlbum } from '@/lib/actions/album.actions';
import { uploadFileToCloudinary } from '@/lib/actions/cloudinary.actions';
import { CreateAlbumParams } from '@/types';

interface AlbumCreationFormProps {
  onCreate: (albumId: string) => void;
  onCancel: () => void;
}

const AlbumCreationForm: React.FC<AlbumCreationFormProps> = ({ onCreate, onCancel }): React.ReactNode => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title || !artist) {
      setError('Please fill in all required fields (Title, Artist).');
      setIsLoading(false);
      return;
    }

    try {
      let coverUrl = '';
      if (coverFile) {
        const base64Cover = await convertFileToBase64(coverFile);
        coverUrl = await uploadFileToCloudinary({
          file: base64Cover,
          resourceType: 'image',
          folder: 'sasamusic_covers',
        });
      }

      const newAlbum: CreateAlbumParams = {
        title,
        artist,
        cover: coverUrl,
      };

      const createdAlbum = await createAlbum(newAlbum);

      if (createdAlbum) {
        onCreate(createdAlbum._id);
        setTitle('');
        setArtist('');
        setCoverFile(null);
        alert('Album created successfully!');
      } else {
        setError('Failed to create album.');
      }
    } catch (err) {
      console.error('Error creating album:', err);
      setError('Failed to create album. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div>
        <div className="mb-4">
          <label htmlFor="title" className="block text-white text-sm font-bold mb-2">Album Title</label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="artist" className="block text-white text-sm font-bold mb-2">Artist</label>
          <input
            type="text"
            id="artist"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-slate-700 text-white"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="cover" className="block text-white text-sm font-bold mb-2">Cover Image (Optional)</label>
          <input
            type="file"
            id="cover"
            accept="image/*"
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating Album...' : 'Create Album'}
          </button>
          <button
            type="button"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlbumCreationForm;
