
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { Upload } from 'lucide-react';

export const Navigation = () => {
  const { uploadAudio, isUploading } = useAudioUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudio(file);
  };

  return (
    <nav className="w-full bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-primary">
            Dance Track Marker
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Upload
            </Link>
            <Link
              to="/tracks"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              My Tracks
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('headerFileInput')?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              type="file"
              id="headerFileInput"
              className="hidden"
              accept=".mp3,.wav"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
