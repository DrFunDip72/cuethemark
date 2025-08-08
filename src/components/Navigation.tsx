
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioUpload } from '@/hooks/useAudioUpload';
import { useRef } from 'react';

export const Navigation = () => {
  const { toast } = useToast();
  const { user, subscription, isAdmin } = useAuth();
  const { uploadAudio } = useAudioUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const homePath = user ? "/app/tracks" : "/";
  const handleLogout = async () => {
    const forceLocalSignOut = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (_) {}
      // Last-resort: clear any persisted Supabase tokens
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('sb-')) localStorage.removeItem(k);
        });
      } catch (_) {}
    };

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        // Session might already be gone on the server; fall back to local
        await forceLocalSignOut();
      }

      toast({ title: 'Success', description: 'Logged out successfully' });
      navigate('/', { replace: true });
    } catch (err: any) {
      // Any unexpected failure -> ensure local signout so user is never stuck
      await forceLocalSignOut();
      toast({ title: 'Signed out locally', description: 'Your session was cleared on this device.', });
      navigate('/', { replace: true });
    }
  };
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
            {isAdmin && (
              <Link
                to="/app/admin"
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <Link to="/app/profile">
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
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
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
