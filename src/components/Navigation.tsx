
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, User, Shield, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { useRef } from 'react';
import { handleLogout } from '@/lib/utils';

export const Navigation = () => {
  const { toast } = useToast();
  const { user, subscription, isAdmin } = useAuth();
  const { uploadAudio } = useAudioUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const homePath = user ? "/app/tracks" : "/";
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudio(file);
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <nav className="w-full bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to={homePath} className="text-xl font-semibold text-primary">
            MTD
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/app/tracks"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              My Tracks
            </Link>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                    {isAdmin && (
                      <span className="text-xs bg-orange-500 text-white px-1 rounded">
                        ADMIN
                      </span>
                    )}
                    {subscription?.subscription_tier === 'lifetime' && (
                      <span className="text-xs bg-primary text-primary-foreground px-1 rounded">
                        LIFETIME
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => navigate('/app/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onSelect={() => navigate('/app/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => navigate(`/app/feedback?from=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Feedback
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleLogout(navigate)}>
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
