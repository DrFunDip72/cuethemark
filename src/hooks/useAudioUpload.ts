import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorLogger } from './useErrorLogger';

export const useAudioUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logError } = useErrorLogger();

  const sanitizeFilename = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    let sanitized = name
      .replace(/:/g, '-')
      .replace(/,/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '')
      .replace(/_+/g, '_')
      .replace(/^[_\-]+|[_\-]+$/g, '');

    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }

    return sanitized + extension;
  };

  const uploadAudio = async (file: File) => {
    if (!file || !user) {
      if (!user) {
        await logError({
          type: 'authentication',
          message: 'User not authenticated',
          userMessage: 'You must be logged in to upload files.',
          step: 'authentication_check',
          context: {
            component: 'AudioUpload',
            action: 'upload_track',
            additionalContext: {
              fileName: file?.name,
              fileSize: file?.size,
            },
          },
        });
      }
      return;
    }
    
    // Validate file type
    const fileType = file.type;
    if (!['audio/mpeg', 'audio/wav'].includes(fileType)) {
      await logError({
        type: 'validation',
        message: `Invalid file type: ${fileType}`,
        userMessage: 'Please upload only MP3 or WAV files.',
        step: 'file_type_validation',
        context: {
          component: 'AudioUpload',
          action: 'upload_track',
          additionalContext: {
            fileName: file.name,
            fileSize: file.size,
            fileType,
          },
        },
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      await logError({
        type: 'validation',
        message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit`,
        userMessage: `File is too large. Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        step: 'file_size_validation',
        context: {
          component: 'AudioUpload',
          action: 'upload_track',
          additionalContext: {
            fileName: file.name,
            fileSize: file.size,
            fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          },
        },
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const sanitizedName = sanitizeFilename(file.name);
      const filename = `${user.id}/${Date.now()}-${sanitizedName}`;
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('audio-files')
        .upload(filename, file);

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (storageError) {
        let errorType = 'storage';
        let userMessage = 'Failed to upload file to storage. Please try again.';

        if (storageError.message.includes('exceeded')) {
          userMessage = 'Storage quota exceeded. Please contact support or delete some files.';
        } else if (storageError.message.includes('policy')) {
          userMessage = 'Permission denied. Please ensure you have access to upload files.';
        } else if (storageError.message.includes('network') || storageError.message.includes('timeout')) {
          errorType = 'network';
          userMessage = 'Network error. Please check your connection and try again.';
        }

        await logError({
          type: errorType as any,
          message: storageError.message,
          userMessage,
          step: 'storage_upload',
          originalError: storageError,
          context: {
            component: 'AudioUpload',
            action: 'upload_track',
            additionalContext: {
              fileName: sanitizedName,
              filename,
            },
          },
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filename);

      const { data: maxOrderData, error: orderError } = await supabase
        .from('audio_tracks')
        .select('order')
        .eq('user_id', user.id)
        .order('order', { ascending: false })
        .limit(1);

      if (orderError) {
        await logError({
          type: 'database',
          message: orderError.message,
          userMessage: 'Database error while preparing upload. Please try again.',
          step: 'fetch_order',
          originalError: orderError,
          context: {
            component: 'AudioUpload',
            action: 'upload_track',
            additionalContext: {
              fileName: file.name,
            },
          },
        });
        return;
      }

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order || 0) + 1 
        : 1;

      const { error: dbError } = await supabase
        .from('audio_tracks')
        .insert([{
          filename: file.name,
          url: publicUrl,
          user_id: user.id,
          order: nextOrder,
        }]);

      if (dbError) {
        let userMessage = 'Failed to save track information. Please try again.';
        
        if (dbError.message.includes('policy')) {
          userMessage = 'Permission denied. You may not have access to create tracks.';
        } else if (dbError.message.includes('unique')) {
          userMessage = 'A track with this name already exists.';
        }

        await logError({
          type: 'database',
          message: dbError.message,
          userMessage,
          step: 'insert_track',
          originalError: dbError,
          context: {
            component: 'AudioUpload',
            action: 'upload_track',
            additionalContext: {
              fileName: file.name,
              url: publicUrl,
            },
          },
        });
        return;
      }

      setUploadProgress(100);
      
      toast({
        title: 'Upload successful',
        description: 'Your audio track has been uploaded.',
      });

      queryClient.invalidateQueries({ queryKey: ['tracks'] });

    } catch (error) {
      await logError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        userMessage: 'An unexpected error occurred during upload. Please try again or contact support.',
        step: 'unexpected_error',
        originalError: error,
        context: {
          component: 'AudioUpload',
          action: 'upload_track',
          additionalContext: {
            fileName: file.name,
            fileSize: file.size,
          },
        },
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { uploadAudio, isUploading, uploadProgress };
};
