
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

type ErrorType = 'validation' | 'storage' | 'database' | 'network' | 'unknown';

interface UploadError {
  type: ErrorType;
  message: string;
  userMessage: string;
  step: string;
  originalError?: unknown;
}

export const useAudioUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logErrorToDatabase = async (error: UploadError, file: File) => {
    try {
      const errorData = {
        user_id: user?.id,
        error_type: error.type,
        error_message: error.message,
        stack_trace: error.originalError instanceof Error ? error.originalError.stack : null,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        step_failed: error.step,
      };

      console.error('[UPLOAD ERROR]', {
        ...errorData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });

      await supabase.from('upload_errors').insert([errorData]);
    } catch (logError) {
      console.error('[ERROR LOGGING FAILED]', logError);
    }
  };

  const sanitizeFilename = (filename: string): string => {
    // Extract extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

    // Sanitize the name part
    let sanitized = name
      .replace(/:/g, '-')           // Replace colons with dashes
      .replace(/,/g, '_')            // Replace commas with underscores
      .replace(/\s+/g, '_')          // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, '')     // Remove other special characters
      .replace(/_+/g, '_')           // Collapse multiple underscores
      .replace(/^[_\-]+|[_\-]+$/g, ''); // Remove leading/trailing underscores and dashes

    // Limit length (storage has limits)
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }

    return sanitized + extension;
  };

  const createError = (
    type: ErrorType,
    step: string,
    message: string,
    userMessage: string,
    originalError?: unknown
  ): UploadError => ({
    type,
    step,
    message,
    userMessage,
    originalError,
  });

  const uploadAudio = async (file: File) => {
    if (!file || !user) {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'You must be logged in to upload files.',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // Validate file type
    const fileType = file.type;
    if (!['audio/mpeg', 'audio/wav'].includes(fileType)) {
      const error = createError(
        'validation',
        'file_type_validation',
        `Invalid file type: ${fileType}`,
        'Please upload only MP3 or WAV files.'
      );
      await logErrorToDatabase(error, file);
      
      toast({
        title: 'Invalid file type',
        description: error.userMessage,
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (50MB limit based on supabase config)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      const error = createError(
        'validation',
        'file_size_validation',
        `File too large: ${file.size} bytes (max: ${maxSize} bytes)`,
        `File is too large. Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
      );
      await logErrorToDatabase(error, file);
      
      toast({
        title: 'File too large',
        description: error.userMessage,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload to Supabase Storage with user folder (sanitized filename for storage)
      const sanitizedName = sanitizeFilename(file.name);
      const filename = `${user.id}/${Date.now()}-${sanitizedName}`;
      
      // Simulate progress for file upload since Supabase doesn't provide real progress
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
        let errorType: ErrorType = 'storage';
        let userMessage = 'Failed to upload file to storage. Please try again.';

        if (storageError.message.includes('exceeded')) {
          errorType = 'storage';
          userMessage = 'Storage quota exceeded. Please contact support or delete some files.';
        } else if (storageError.message.includes('policy')) {
          errorType = 'storage';
          userMessage = 'Permission denied. Please ensure you have access to upload files.';
        } else if (storageError.message.includes('network') || storageError.message.includes('timeout')) {
          errorType = 'network';
          userMessage = 'Network error. Please check your connection and try again.';
        }

        const error = createError(
          errorType,
          'storage_upload',
          `Storage upload failed: ${storageError.message}`,
          userMessage,
          storageError
        );
        await logErrorToDatabase(error, file);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filename);

      // Get the next order value for this user
      const { data: maxOrderData, error: orderError } = await supabase
        .from('audio_tracks')
        .select('order')
        .eq('user_id', user.id)
        .order('order', { ascending: false })
        .limit(1);

      if (orderError) {
        const error = createError(
          'database',
          'fetch_order',
          `Failed to fetch track order: ${orderError.message}`,
          'Database error while preparing upload. Please try again.',
          orderError
        );
        await logErrorToDatabase(error, file);
        throw error;
      }

      const nextOrder = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order || 0) + 1 
        : 1;

      // Create database record with user_id and order
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

        const error = createError(
          'database',
          'insert_track',
          `Database insert failed: ${dbError.message}`,
          userMessage,
          dbError
        );
        await logErrorToDatabase(error, file);
        throw error;
      }

      setUploadProgress(100);
      
      toast({
        title: 'Upload successful',
        description: 'Your audio track has been uploaded.',
      });

      // Refresh the track list
      queryClient.invalidateQueries({ queryKey: ['tracks'] });

    } catch (error) {
      if ('userMessage' in (error as object)) {
        // Already handled and logged
        const uploadError = error as UploadError;
        toast({
          title: 'Upload failed',
          description: uploadError.userMessage,
          variant: 'destructive',
        });
      } else {
        // Unexpected error
        const unexpectedError = createError(
          'unknown',
          'unexpected_error',
          error instanceof Error ? error.message : 'Unknown error occurred',
          'An unexpected error occurred during upload. Please try again or contact support.',
          error
        );
        await logErrorToDatabase(unexpectedError, file);
        
        toast({
          title: 'Upload failed',
          description: unexpectedError.userMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { uploadAudio, isUploading, uploadProgress };
};
