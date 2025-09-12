
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionData | null;
  checkSubscription: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscription: null,
  checkSubscription: async () => {},
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription(null);
        return;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(null);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      // Wait a moment for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      // Profile should exist now due to database trigger
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
            checkAdminStatus(session.user.id);
            // Seed starter template (idempotent)
            supabase.functions
              .invoke('seed-template', {
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
              .catch((e) => console.warn('Seed template failed (non-fatal):', e));
          }, 0);
        } else {
          setSubscription(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSubscription();
        checkAdminStatus(session.user.id);
        supabase.functions
          .invoke('seed-template', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          .catch((e) => console.warn('Seed template failed (non-fatal):', e));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        user,
        session,
        loading,
        subscription,
        checkSubscription,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
