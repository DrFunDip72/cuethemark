import { useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Music2, Upload, User } from 'lucide-react';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { uploadAudio, isUploading } = useAudioUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pathname = location.pathname;
  const isAdminRoute = pathname.startsWith('/app/admin');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudio(file);
      event.target.value = '';
      navigate('/app/tracks');
    }
  };

  if (!isMobile || isAdminRoute) {
    return null;
  }

  const isTracksActive = pathname === '/app' || pathname === '/app/tracks' || pathname.startsWith('/app/tracks/');
  const isProfileActive = pathname === '/app/profile';

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{
          backgroundColor: 'hsl(var(--landing-surface))',
          borderColor: 'hsl(var(--landing-border))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex h-14 items-center justify-around">
          {/* Tracks */}
          <Link
            to="/app/tracks"
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isTracksActive ? 'text-[hsl(var(--landing-accent))]' : 'text-[hsl(var(--landing-text-muted))]'
            )}
          >
            <Music2 className="h-5 w-5" />
            <span className="text-xs font-medium">Tracks</span>
          </Link>

          {/* Upload - center action */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
            style={{
              color: 'hsl(var(--landing-accent))',
            }}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs font-medium">Upload</span>
          </button>

          {/* Profile */}
          <Link
            to="/app/profile"
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors',
              isProfileActive ? 'text-[hsl(var(--landing-accent))]' : 'text-[hsl(var(--landing-text-muted))]'
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,.mp3,.wav"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
