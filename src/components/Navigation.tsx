import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, User, Shield, MessageSquare, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { useRef } from 'react';
import { handleLogout } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const Navigation = () => {
  const { toast } = useToast();
  const { user, subscription, isAdmin } = useAuth();
  const { uploadAudio } = useAudioUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const homePath = user ? "/app/tracks" : "/";
  const isOnTrackDetail = location.pathname.match(/^\/app\/tracks\/[^/]+$/) || location.pathname.match(/^\/tracks\/[^/]+$/);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudio(file);
      event.target.value = '';
    }
  };

  return (
    <nav
      className="w-full border-b"
      style={{
        backgroundColor: "hsl(var(--landing-surface))",
        borderColor: "hsl(var(--landing-border))",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {isMobile && isOnTrackDetail ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/tracks')}
              className="flex items-center gap-1 -ml-2 text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Link
              to={homePath}
              className="text-xl font-semibold transition-colors hover:opacity-90"
              style={{ color: "hsl(var(--landing-text))" }}
            >
              CueTheMark
            </Link>
          )}
          <div className="flex items-center space-x-4">
            {!isMobile && (
              <Link
                to="/app/tracks"
                className="text-sm font-medium transition-colors text-[hsl(var(--landing-text-muted))] hover:text-[hsl(var(--landing-accent))]"
              >
                My Tracks
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-[hsl(var(--landing-text))] hover:bg-[hsl(var(--landing-surface-hover))] hover:text-[hsl(var(--landing-text))]"
                  >
                    <User className="h-4 w-4" />
                    Profile
                    {isAdmin && (
                      <span className="text-xs bg-orange-500 text-white px-1 rounded">
                        ADMIN
                      </span>
                    )}
                    {subscription?.subscription_tier === 'lifetime' && (
                      <span
                        className="text-xs px-1 rounded"
                        style={{
                          backgroundColor: "hsl(var(--landing-accent))",
                          color: "#fff",
                        }}
                      >
                        LIFETIME
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-surface))] text-white [&>button]:text-white"
                >
                  <DropdownMenuItem
                    onSelect={() => navigate('/app/profile')}
                    className="focus:bg-[hsl(var(--landing-surface-hover))] focus:text-white"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onSelect={() => navigate('/app/admin')}
                      className="focus:bg-[hsl(var(--landing-surface-hover))] focus:text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => navigate(`/app/feedback?from=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`)}
                    className="focus:bg-[hsl(var(--landing-surface-hover))] focus:text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Feedback
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[hsl(var(--landing-border))]" />
                  <DropdownMenuItem
                    onSelect={() => handleLogout(navigate)}
                    className="focus:bg-[hsl(var(--landing-surface-hover))] focus:text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav"
        onChange={handleFileChange}
        className="hidden"
      />
    </nav>
  );
};
