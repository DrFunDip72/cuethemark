
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackList } from '@/components/TrackList';
import { Progress } from '@/components/ui/progress';

const UploadPage = () => {
  const { uploadAudio, isUploading } = useAudioUpload();
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadAudio(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudio(file);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Audio Track</h1>
      
      <Card className="w-full max-w-2xl mx-auto">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="p-8 border-2 border-dashed rounded-lg text-center"
        >
          {isUploading ? (
            <div className="space-y-4">
              <p className="text-lg">Uploading...</p>
              <Progress value={100} className="w-full" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-lg mb-2">Drag and drop your audio file here</p>
                <p className="text-sm text-gray-500">Supported formats: MP3, WAV</p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => document.getElementById('fileInput')?.click()}
                className="mt-4"
              >
                Select File
              </Button>
              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept=".mp3,.wav"
                onChange={handleFileSelect}
              />
            </>
          )}
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
        <TrackList />
      </div>
    </div>
  );
};

export default UploadPage;
