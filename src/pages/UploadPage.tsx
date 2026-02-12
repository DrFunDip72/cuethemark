import { useQuery } from '@tanstack/react-query';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { TrackList } from '@/components/TrackList';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';

const UploadPage = () => {
  const { user } = useAuth();
  const { uploadAudio, isUploading, uploadProgress } = useAudioUpload();

  const { data: tracks = [] } = useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string }[];
    },
    enabled: !!user,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudio(file);
  };

  const showFirstTimePrompt = tracks.length === 0;

  return (
    <div className="container mx-auto px-4 pt-6 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tracks</h1>
        <div className="flex items-center gap-4">
          {isUploading && (
            <div className="flex items-center gap-2">
              <Progress value={uploadProgress} className="w-24" />
              <span className="text-sm text-white/80">{uploadProgress}%</span>
            </div>
          )}
          <Button
            onClick={() => document.getElementById('fileInput')?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
            style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
          >
            <Upload className="h-4 w-4" />
            Upload Track
          </Button>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".mp3,.wav"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {showFirstTimePrompt && (
        <div
          className="mb-6 rounded-lg border p-6"
          style={{
            backgroundColor: "hsl(var(--landing-surface))",
            borderColor: "hsl(var(--landing-border))",
          }}
        >
          <p className="text-lg font-medium mb-2">Upload your first track to get started</p>
          <p className="mb-4 text-white/80">
            Add markers to jump to any section in seconds. Drag and drop your team&apos;s audio file to begin.
          </p>
          <Button
            onClick={() => document.getElementById('fileInput')?.click()}
            disabled={isUploading}
            className="gap-2"
            style={{ backgroundColor: "hsl(var(--landing-accent))", color: "#fff" }}
          >
            <Upload className="h-4 w-4" />
            Upload Track
          </Button>
        </div>
      )}

      <TrackList />
    </div>
  );
};

export default UploadPage;
