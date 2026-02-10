
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import Card from '../components/Card';
import Button from '../components/Button';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Basic Client-side validation
    if (isSignUp && password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        setLoading(false);
        return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! You can now sign in.' });
        // Optional: Switch to sign in mode automatically or wait for user
        setTimeout(() => {
             setIsSignUp(false);
             setMessage(null);
        }, 2000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md border-neutral-800">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        <p className="text-neutral-400 text-center mb-6">
          {isSignUp ? 'Join IronTrack and start your journey.' : 'Sign in to access your workouts.'}
        </p>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-100 font-medium rounded-lg p-3 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-neutral-900 px-2 text-neutral-500">Or continue with email</span>
                </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-sm text-neutral-400 block mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400 block mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm text-neutral-400 block mb-1">Confirm Password</label>
                <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-lime-400 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
          )}
          
          <Button fullWidth disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-400">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-lime-400 font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
