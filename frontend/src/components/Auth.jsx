import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Lock, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const { isSetupComplete, checkSetup, login, setup, isLocked } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isSetupComplete) {
      const res = await setup(password);
      if (!res.success) setError(res.message);
      else setPassword('');
    } else {
      const res = await login(password);
      if (!res.success) setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 transform transition-all">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full text-primary shadow-inner">
            {isLocked ? <Lock size={32} /> : (!isSetupComplete ? <UserPlus size={32} /> : <LogIn size={32} />)}
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-foreground mb-2">
          {isLocked ? 'App Locked' : (!isSetupComplete ? 'Welcome' : 'Welcome Back')}
        </h2>
        <p className="text-center text-secondary-foreground mb-8 text-sm">
          {isLocked ? 'Please enter your password to unlock.' : (!isSetupComplete ? 'Create a master password to protect your data.' : 'Enter your password to access your dashboard.')}
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg mb-6 text-sm flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-xl bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {isLocked ? 'Unlock' : (!isSetupComplete ? 'Complete Setup' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
