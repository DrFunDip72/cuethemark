import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { NavigateFunction } from 'react-router-dom';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleLogout = async (navigate: NavigateFunction) => {
  const forceLocalSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {}
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-')) localStorage.removeItem(k);
      });
    } catch (_) {}
  };

  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      await forceLocalSignOut();
    }

    toast({ title: 'Success', description: 'Logged out successfully' });
    navigate('/', { replace: true });
  } catch (err: any) {
    await forceLocalSignOut();
    toast({
      title: 'Signed out locally',
      description: 'Your session was cleared on this device.',
    });
    navigate('/', { replace: true });
  }
};
