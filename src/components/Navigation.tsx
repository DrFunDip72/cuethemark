
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo-marktapdance.svg';

export const Navigation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const homePath = user ? "/app/tracks" : "/";
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully"
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };



  return (
    <nav className="w-full bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to={homePath} className="flex items-center">
            <img src={logo} alt="MarkTapDance logo" className="h-7 w-7" />
          </Link>
          <div className="flex items-center space-x-4 overflow-hidden">
            <Link
              to="/app/tracks"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              My Tracks
            </Link>
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
    </nav>
  );
};
