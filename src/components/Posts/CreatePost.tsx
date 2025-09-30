import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface CreatePostProps {
  onSubmit: (content: string, type?: 'text' | 'image' | 'video' | 'file', fileUrl?: string, fileName?: string) => Promise<void>;
}

const CreatePost: React.FC<CreatePostProps> = ({ onSubmit }) => {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'application/*': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      }
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${profile?.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setLoading(true);
    try {
      let fileUrl: string | undefined;
      let fileType: 'text' | 'image' | 'video' | 'file' = 'text';

      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        
        if (selectedFile.type.startsWith('image/')) {
          fileType = 'image';
        } else if (selectedFile.type.startsWith('video/')) {
          fileType = 'video';
        } else {
          fileType = 'file';
        }
      }

      await onSubmit(content, fileType, fileUrl, selectedFile?.name);
      
      setContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          {profile?.avatar_url ? (
            <img
              className="h-10 w-10 rounded-full"
              src={profile.avatar_url}
              alt={profile.full_name}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <textarea
              placeholder="Quoi de neuf ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="block w-full border-0 resize-none placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 text-gray-900 dark:text-white bg-transparent text-lg"
            />
          </div>
        </div>

        {/* File preview */}
        {selectedFile && (
          <div className="relative">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* File upload area */}
        {!selectedFile && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                <PhotoIcon className="h-6 w-6 text-gray-400" />
                <VideoCameraIcon className="h-6 w-6 text-gray-400" />
                <DocumentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Glissez-déposez ou cliquez pour ajouter des fichiers
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Images, vidéos, documents (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={(!content.trim() && !selectedFile) || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              (!content.trim() && !selectedFile) || loading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;