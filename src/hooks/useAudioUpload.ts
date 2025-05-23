
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAudioUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAudio = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const fileType = file.type;
    if (!['audio/mpeg', 'audio/wav'].includes(fileType)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only MP3 or WAV files.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload to Supabase Storage with progress tracking
      const filename = `${Date.now()}-${file.name}`;
      
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
        .from('tracks')
        .upload(filename, file);

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(filename);

      // Create database record
      const { error: dbError } = await supabase
        .from('audio_tracks')
        .insert([{
          filename: file.name,
          url: publicUrl,
        }]);

      if (dbError) throw dbError;

      setUploadProgress(100);
      
      toast({
        title: 'Upload successful',
        description: 'Your audio track has been uploaded.',
      });

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { uploadAudio, isUploading, uploadProgress };
};
