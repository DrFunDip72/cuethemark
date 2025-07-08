-- Create audio_tracks table for storing uploaded audio files
CREATE TABLE public.audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  "order" INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio_labels table for storing markers/timestamps
CREATE TABLE public.audio_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.audio_tracks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label_name TEXT NOT NULL,
  timestamp_seconds DECIMAL(10,1) NOT NULL,
  notes TEXT,
  playback_offset_seconds DECIMAL(5,1) DEFAULT 3.0,
  "order" INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audio_tracks
CREATE POLICY "Users can view their own tracks" 
ON public.audio_tracks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracks" 
ON public.audio_tracks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" 
ON public.audio_tracks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
ON public.audio_tracks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for audio_labels
CREATE POLICY "Users can view their own labels" 
ON public.audio_labels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own labels" 
ON public.audio_labels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own labels" 
ON public.audio_labels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own labels" 
ON public.audio_labels 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true);

-- Create storage policies for audio uploads
CREATE POLICY "Users can view audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_audio_tracks_updated_at
  BEFORE UPDATE ON public.audio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audio_labels_updated_at
  BEFORE UPDATE ON public.audio_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_audio_tracks_user_id ON public.audio_tracks(user_id);
CREATE INDEX idx_audio_tracks_order ON public.audio_tracks("order");
CREATE INDEX idx_audio_labels_track_id ON public.audio_labels(track_id);
CREATE INDEX idx_audio_labels_user_id ON public.audio_labels(user_id);
CREATE INDEX idx_audio_labels_timestamp ON public.audio_labels(timestamp_seconds);
CREATE INDEX idx_audio_labels_order ON public.audio_labels("order");