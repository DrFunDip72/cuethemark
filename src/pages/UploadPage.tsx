import { Link, useLocation } from 'react-router-dom';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { Button } from "@/components/ui/button";
import { TrackList } from '@/components/TrackList';
import { Progress } from '@/components/ui/progress';
import { Upload, MessageSquare } from 'lucide-react';

const UploadPage = () => {
  const { uploadAudio, isUploading, uploadProgress } = useAudioUpload();
  const location = useLocation();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudio(file);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tracks</h1>
        <div className="flex items-center gap-4">
          {isUploading && (
            <div className="flex items-center gap-2">
              <Progress value={uploadProgress} className="w-24" />
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
          )}
          <Button
            onClick={() => document.getElementById('fileInput')?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
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

      <TrackList />

      <Link to={`/app/feedback?from=${encodeURIComponent(location.pathname + location.search + location.hash)}`} className="fixed bottom-6 right-6 z-50">
        <Button className="shadow-lg">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Feedback
        </Button>
      </Link>
    </div>
  );
};

export default UploadPage;
