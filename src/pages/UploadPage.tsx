
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Will implement file upload after Supabase connection
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Audio Track</h1>
      
      <Card className="w-full max-w-2xl mx-auto">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-8 border-2 border-dashed rounded-lg text-center ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
        >
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
          />
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
        <div className="grid gap-4">
          <p className="text-gray-500 text-center py-8">
            No tracks uploaded yet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
