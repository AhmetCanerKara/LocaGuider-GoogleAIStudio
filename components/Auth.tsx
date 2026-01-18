import React, { useState, useEffect } from 'react';
import { AuthView, User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
  onGuestAccess: () => void;
}

const STORAGE_KEY = 'lcg_users';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onGuestAccess }) => {
  const [view, setView] = useState<AuthView>('SIGN_IN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Clear errors when switching views
  useEffect(() => {
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  }, [view]);

  // Helper to access "Database"
  const getStoredUsers = (): any[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const handleSignIn = () => {
    const users = getStoredUsers();
    // Simple plain-text check for prototype purposes
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
      const appUser: User = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        is_guest: false,
        created_at: user.created_at,
        preferences: user.preferences
      };
      onLoginSuccess(appUser);
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleSignUp = () => {
    const users = getStoredUsers();
    
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      setError('This email is already registered.');
      setLoading(false);
      return;
    }

    const newUser = {
      user_id: `u_${Date.now()}`,
      username: name,
      email: email,
      password: password, // Storing password locally for prototype logic
      created_at: new Date().toISOString(),
      preferences: { pref_id: `p_${Date.now()}`, preferred_categories: [], language: 'en' }
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

    // Auto-login after signup
    const appUser: User = {
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      is_guest: false,
      created_at: newUser.created_at,
      preferences: newUser.preferences
    };
    onLoginSuccess(appUser);
  };

  const handleForgotPassword = () => {
    const users = getStoredUsers();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      alert(`Password reset link sent to ${email} (Mock Action)`);
      setView('SIGN_IN');
    } else {
      setError('No account found with this email.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay for realism
    setTimeout(() => {
      if (view === 'SIGN_IN') {
        handleSignIn();
      } else if (view === 'SIGN_UP') {
        handleSignUp();
      } else if (view === 'FORGOT_PASSWORD') {
        handleForgotPassword();
      }
      setLoading(false);
    }, 1000);
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-pulse">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  };

  const renderSignIn = () => (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500">Sign in to continue to LocaGuider</p>
      </div>

      {renderError()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex justify-end">
          <button type="button" onClick={() => setView('FORGOT_PASSWORD')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Forgot Password?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center space-y-4">
        <p className="text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => setView('SIGN_UP')} className="font-bold text-blue-600">Sign Up</button>
        </p>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">or</span></div>
        </div>
        <button 
          onClick={onGuestAccess}
          className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </>
  );

  const renderSignUp = () => (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-500">Join LocaGuider today</p>
      </div>

      {renderError()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500">
          Already have an account?{' '}
          <button onClick={() => setView('SIGN_IN')} className="font-bold text-blue-600">Sign In</button>
        </p>
      </div>
    </>
  );

  const renderForgot = () => (
    <>
      <button 
        onClick={() => setView('SIGN_IN')}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={20} className="mr-1" /> Back to Sign In
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-500">Enter your email to receive instructions</p>
      </div>

      {renderError()}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </>
  );

  return (
    <div className="h-full w-full bg-white p-6 flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto">
        {view === 'SIGN_IN' && renderSignIn()}
        {view === 'SIGN_UP' && renderSignUp()}
        {view === 'FORGOT_PASSWORD' && renderForgot()}
      </div>
    </div>
  );
};
