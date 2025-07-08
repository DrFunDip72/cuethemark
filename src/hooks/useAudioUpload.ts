
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const useAudioUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      // Upload to Supabase Storage with user folder
      const filename = `${user.id}/${Date.now()}-${file.name}`;
      
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

      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filename);

      // Get the next order value for this user
      const { data: maxOrderData } = await supabase
        .from('audio_tracks')
        .select('order')
        .eq('user_id', user.id)
        .order('order', { ascending: false })
        .limit(1);

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

      if (dbError) throw dbError;

      setUploadProgress(100);
      
      toast({
        title: 'Upload successful',
        description: 'Your audio track has been uploaded.',
      });

      // Refresh the track list
      queryClient.invalidateQueries({ queryKey: ['tracks'] });

    } catch (error) {
      console.error('Upload error:', error);
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
