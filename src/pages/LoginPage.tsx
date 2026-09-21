import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/events';

type Mode = 'signup' | 'signin';

const LoginPage = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo')?.startsWith('/') ? params.get('returnTo')! : '/app';
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (user) return <Navigate to={returnTo} replace />;

  const redirectTo = `${window.location.origin}${returnTo}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        logEvent('signup_completed');
        if (!data.session) setNotice('Check your email to confirm your account, then come back here.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const sendMagicLink = async () => {
    if (!email) return setError('Enter your email first.');
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
    setBusy(false);
    if (error) setError(error.message);
    else setNotice(`We sent a sign-in link to ${email}.`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 text-foreground">
      <header className="mx-auto w-full max-w-sm py-6">
        <Link to="/"><Logo /></Link>
      </header>
      <main className="mx-auto w-full max-w-sm flex-1 pt-8">
        <h1 className="text-2xl font-bold">{mode === 'signup' ? 'Create your instructor account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signup' ? 'Free while we pilot with studios. Dancers never need an account.' : 'Sign in to manage your routines.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">{notice}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
          {mode === 'signin' && (
            <button type="button" onClick={sendMagicLink} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
              Forgot your password? Email me a sign-in link
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError(null);
              setNotice(null);
            }}
          >
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
